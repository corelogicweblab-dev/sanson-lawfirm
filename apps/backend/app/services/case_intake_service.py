from datetime import date, datetime, time, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserProfile, UserStatusEnum
from app.models.legal import CaseParty, CaseStatus, Task, TaskStatusEnum
from app.repositories.user_repository import RoleRepository, UserRepository, UserProfileRepository
from app.schemas.case_intake import MasterCaseIntakeCreate
from app.services.legal_workflow import LegalWorkflowService


class CaseIntakeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.workflow = LegalWorkflowService(db)
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)
        self.role_repo = RoleRepository(db)

    async def _resolve_client(self, client_in, performed_by: UUID) -> User:
        if client_in.client_id:
            user = await self.user_repo.get_by_id(client_in.client_id)
            if not user:
                raise ValueError("Selected client not found")
            profile = await self.profile_repo.get_by_user_id(user.id)
            if profile:
                profile.first_name = client_in.first_name
                profile.middle_name = client_in.middle_name
                profile.last_name = client_in.last_name
                profile.suffix = client_in.suffix
                profile.phone = client_in.phone or client_in.mobile_number
                profile.address = client_in.address
                profile.client_details = {**(profile.client_details or {}), **client_in.details}
                await self.profile_repo.update(profile)
            return user

        email = (client_in.email or "").strip().lower()
        if not email:
            raise ValueError("Email is required when creating a new client")

        existing = await self.user_repo.get_by_email(email)
        if existing:
            return existing

        role = await self.role_repo.get_by_name("CLIENT")
        if not role:
            raise ValueError("CLIENT role not configured")

        user = User(
            firebase_uid=f"firm-client-{uuid4()}",
            email=email,
            role_id=role.id,
            status=UserStatusEnum.ACTIVE,
            is_active=True,
        )
        await self.user_repo.create(user)
        profile = UserProfile(
            user_id=user.id,
            first_name=client_in.first_name,
            middle_name=client_in.middle_name,
            last_name=client_in.last_name,
            suffix=client_in.suffix,
            phone=client_in.phone or client_in.mobile_number,
            address=client_in.address,
            client_details=client_in.details,
        )
        await self.profile_repo.create(profile)
        await self.workflow.audit.log(
            "client.create",
            "users",
            user.id,
            performed_by,
            new_values={"email": email, "source": "master_case_intake"},
        )
        return user

    async def _status_by_name(self, name: str) -> CaseStatus:
        status = await self.workflow.get_case_status_by_name(name)
        if status:
            return status
        return await self.workflow.get_default_open_status()

    async def create_master_case(
        self,
        body: MasterCaseIntakeCreate,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ):
        client_user = await self._resolve_client(body.client, performed_by)

        master_data = {
            "case_details": body.case_details,
            "important_dates": body.important_dates,
            "legal_team": body.legal_team,
            "internal_notes": body.internal_notes,
            "ai_intake": body.ai_intake,
            "client_snapshot": {
                "email": client_user.email,
                **body.client.model_dump(mode="json"),
            },
            "workspace_modules": [
                "overview",
                "client",
                "opposing_party",
                "assigned_lawyers",
                "assigned_paralegals",
                "documents",
                "evidence",
                "photos",
                "videos",
                "audio",
                "affidavits",
                "contracts",
                "court_filings",
                "timeline",
                "calendar",
                "tasks",
                "notes",
                "activities",
                "ai_summaries",
                "audit",
            ],
        }

        status = await self._status_by_name(body.status_name)
        from app.utils.references import generate_case_number
        from app.models.legal import (
            AssigneeRoleEnum,
            Case,
            CaseCategoryEnum,
            CaseSourceTypeEnum,
            PriorityLevelEnum,
            TimelineEventTypeEnum,
        )

        case_number = await generate_case_number(self.db)
        try:
            src = CaseSourceTypeEnum[body.source_type]
        except KeyError:
            src = CaseSourceTypeEnum.MANUAL

        paralegal_id = body.assigned_paralegal_id or performed_by
        case = Case(
            case_number=case_number,
            request_id=body.request_id,
            client_id=client_user.id,
            assigned_lawyer_id=body.assigned_lawyer_id,
            assigned_paralegal_id=paralegal_id,
            status_id=status.id,
            case_category=CaseCategoryEnum[body.case_category],
            source_type=src,
            title=body.title,
            description=body.description,
            priority=PriorityLevelEnum[body.priority],
            opened_at=datetime.now(timezone.utc),
            master_data=master_data,
        )
        self.db.add(case)
        await self.db.flush()

        if body.opposing_party:
            op = body.opposing_party
            party = CaseParty(
                case_id=case.id,
                party_role="OPPOSING",
                party_type=op.party_type,
                full_name=op.full_name,
                contact_phone=op.contact_phone,
                contact_email=op.contact_email,
                address=op.address,
                province=op.province,
                city=op.city,
                relationship_to_case=op.relationship_to_case,
                position_in_case=op.position_in_case,
                notes=op.notes,
                details=op.details,
            )
            self.db.add(party)

        await self.workflow._log_case_activity(
            case.id, "case.master_intake", f"Master intake: {case_number}", performed_by
        )
        await self.workflow._add_timeline(
            case.id,
            TimelineEventTypeEnum.STATUS_CHANGE,
            "Case opened (draft)",
            body.description or body.title,
            performed_by,
        )

        if body.assigned_lawyer_id:
            await self.workflow._create_assignment(
                case.id, body.assigned_lawyer_id, AssigneeRoleEnum.LAWYER, performed_by
            )
        if paralegal_id:
            await self.workflow._create_assignment(
                case.id, paralegal_id, AssigneeRoleEnum.PARALEGAL, performed_by
            )

        if body.initial_task and body.initial_task.get("title"):
            assignee = body.initial_task.get("assigned_to")
            task = Task(
                case_id=case.id,
                assigned_to=UUID(str(assignee)) if assignee else paralegal_id,
                created_by=performed_by,
                title=str(body.initial_task["title"])[:255],
                description=body.initial_task.get("description"),
                status=TaskStatusEnum.PENDING,
                priority=PriorityLevelEnum[str(body.initial_task.get("priority", "MEDIUM"))],
            )
            self.db.add(task)

        await self.workflow.audit.log(
            "case.master_intake",
            "cases",
            case.id,
            performed_by,
            ip,
            ua,
            new_values={"case_number": case_number, "client_id": str(client_user.id)},
        )

        await self.db.refresh(case, attribute_names=["status"])
        return case, client_user
