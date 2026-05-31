from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case_migration import (
    CaseMigrationItem,
    CaseMigrationItemStatusEnum,
    CaseMigrationJob,
    CaseMigrationJobTypeEnum,
)
from app.models.legal import CaseCategoryEnum
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.services.legal_workflow import LegalWorkflowService


class CaseMigrationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)
        self.workflow = LegalWorkflowService(db)
        self.audit = AuditService(db)

    async def _resolve_client_id(self, email: str | None) -> UUID | None:
        if not email:
            return None
        user = await self.users.get_by_email(email.strip().lower())
        return user.id if user else None

    async def create_legacy_case(
        self,
        *,
        title: str,
        client_email: str | None,
        legacy_reference: str | None,
        case_category: str,
        assigned_lawyer_id: UUID | None,
        assigned_paralegal_id: UUID | None,
        created_by: UUID,
        ip: str | None,
        ua: str | None,
    ) -> dict:
        job = CaseMigrationJob(
            job_type=CaseMigrationJobTypeEnum.LEGACY_CASE,
            created_by=created_by,
            total_items=1,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(job)
        await self.db.flush()

        item = CaseMigrationItem(
            job_id=job.id,
            legacy_reference=legacy_reference,
            title=title,
            client_email=client_email,
            case_category=case_category,
            assigned_lawyer_id=assigned_lawyer_id,
            assigned_paralegal_id=assigned_paralegal_id,
            created_by=created_by,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(item)
        await self.db.flush()

        result = await self._import_item(item, created_by, ip, ua)
        job.success_count = 1 if result["imported"] else 0
        job.failed_count = 0 if result["imported"] else 1
        return {"job_id": str(job.id), "item": result}

    async def bulk_import_cases(
        self,
        cases: list[dict],
        created_by: UUID,
        ip: str | None,
        ua: str | None,
    ) -> dict:
        job = CaseMigrationJob(
            job_type=CaseMigrationJobTypeEnum.BULK_CASES,
            created_by=created_by,
            total_items=len(cases),
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(job)
        await self.db.flush()

        results = []
        for row in cases:
            item = CaseMigrationItem(
                job_id=job.id,
                legacy_reference=row.get("legacy_reference"),
                title=row.get("title") or "Legacy Case",
                client_email=row.get("client_email"),
                case_category=row.get("case_category") or "CIVIL",
                assigned_lawyer_id=row.get("assigned_lawyer_id"),
                assigned_paralegal_id=row.get("assigned_paralegal_id"),
                payload_=row,
                created_by=created_by,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self.db.add(item)
            await self.db.flush()
            results.append(await self._import_item(item, created_by, ip, ua, auto_import=False))

        job.success_count = sum(1 for r in results if r["status"] != "FAILED")
        job.failed_count = job.total_items - job.success_count
        return {"job_id": str(job.id), "items": results}

    async def bulk_import_documents(self, documents: list[dict], created_by: UUID) -> dict:
        job = CaseMigrationJob(
            job_type=CaseMigrationJobTypeEnum.BULK_DOCUMENTS,
            created_by=created_by,
            total_items=len(documents),
            metadata_={"queued": True},
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(job)
        await self.db.flush()
        for doc in documents:
            item = CaseMigrationItem(
                job_id=job.id,
                title=doc.get("file_name") or "Document",
                legacy_reference=doc.get("legacy_reference"),
                payload_=doc,
                status=CaseMigrationItemStatusEnum.PENDING,
                created_by=created_by,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self.db.add(item)
        job.success_count = len(documents)
        return {
            "job_id": str(job.id),
            "message": "Documents queued for validation. Upload files via Document Center after case import.",
            "count": len(documents),
        }

    async def assign_staff(
        self,
        item_id: UUID,
        lawyer_id: UUID | None,
        paralegal_id: UUID | None,
        actor_id: UUID,
        ip: str | None,
        ua: str | None,
    ) -> dict:
        item = await self._get_item(item_id)
        item.assigned_lawyer_id = lawyer_id
        item.assigned_paralegal_id = paralegal_id
        item.updated_at = datetime.now(timezone.utc)

        if item.case_id and lawyer_id:
            await self.workflow.assign_to_case(
                case_id=item.case_id,
                assignee_id=lawyer_id,
                assignee_role="LAWYER",
                assigned_by=actor_id,
                notes="Case migration assignment",
                ip=ip,
                ua=ua,
            )
        if item.case_id and paralegal_id:
            await self.workflow.assign_to_case(
                case_id=item.case_id,
                assignee_id=paralegal_id,
                assignee_role="PARALEGAL",
                assigned_by=actor_id,
                notes="Case migration assignment",
                ip=ip,
                ua=ua,
            )
        return self._item_dict(item)

    async def validate_record(
        self,
        item_id: UUID,
        notes: str | None,
        import_now: bool,
        actor_id: UUID,
        ip: str | None,
        ua: str | None,
    ) -> dict:
        item = await self._get_item(item_id)
        item.status = CaseMigrationItemStatusEnum.VALIDATED
        item.validation_notes = notes
        item.validated_by = actor_id
        item.validated_at = datetime.now(timezone.utc)
        item.updated_at = datetime.now(timezone.utc)
        if import_now:
            await self._import_item(item, actor_id, ip, ua)
        return self._item_dict(item)

    async def list_queue(self, status: str | None = None, limit: int = 50) -> list[dict]:
        q = select(CaseMigrationItem).order_by(CaseMigrationItem.created_at.desc()).limit(limit)
        if status:
            q = q.where(CaseMigrationItem.status == CaseMigrationItemStatusEnum(status))
        result = await self.db.execute(q)
        return [self._item_dict(i) for i in result.scalars().all()]

    async def summary(self) -> dict:
        counts = {}
        for st in CaseMigrationItemStatusEnum:
            c = (
                await self.db.execute(
                    select(func.count(CaseMigrationItem.id)).where(
                        CaseMigrationItem.status == st
                    )
                )
            ).scalar() or 0
            counts[st.value] = c
        return {"items_by_status": counts, "total": sum(counts.values())}

    async def _get_item(self, item_id: UUID) -> CaseMigrationItem:
        result = await self.db.execute(
            select(CaseMigrationItem).where(CaseMigrationItem.id == item_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise ValueError("Migration item not found")
        return item

    async def _import_item(
        self,
        item: CaseMigrationItem,
        actor_id: UUID,
        ip: str | None,
        ua: str | None,
        auto_import: bool = True,
    ) -> dict:
        if item.status == CaseMigrationItemStatusEnum.IMPORTED and item.case_id:
            return self._item_dict(item)

        client_id = await self._resolve_client_id(item.client_email)
        if not client_id:
            item.status = CaseMigrationItemStatusEnum.PENDING
            item.error_message = "Client email not found — create client in Firebase first or fix email"
            return self._item_dict(item)

        if not auto_import and item.status != CaseMigrationItemStatusEnum.VALIDATED:
            return self._item_dict(item)

        try:
            try:
                cat = CaseCategoryEnum(item.case_category.upper())
            except ValueError:
                cat = CaseCategoryEnum.CIVIL
            case = await self.workflow.create_case(
                client_id=client_id,
                case_category=cat,
                title=item.title,
                description=item.validation_notes or f"Legacy import {item.legacy_reference or ''}".strip(),
                assigned_lawyer_id=item.assigned_lawyer_id,
                assigned_paralegal_id=item.assigned_paralegal_id,
                performed_by=actor_id,
                ip=ip,
                ua=ua,
                source_type="LEGACY",
            )
            item.case_id = case.id
            item.status = CaseMigrationItemStatusEnum.IMPORTED
            item.error_message = None
            await self.audit.log_intelligent(
                action="migration.case_imported",
                resource_type="cases",
                resource_id=case.id,
                actor_id=actor_id,
                new_values={"legacy_reference": item.legacy_reference},
                ip_address=ip,
            )
        except Exception as exc:
            item.status = CaseMigrationItemStatusEnum.FAILED
            item.error_message = str(exc)[:500]

        item.updated_at = datetime.now(timezone.utc)
        return {**self._item_dict(item), "imported": item.status == CaseMigrationItemStatusEnum.IMPORTED}

    @staticmethod
    def _item_dict(item: CaseMigrationItem) -> dict:
        return {
            "id": str(item.id),
            "jobId": str(item.job_id) if item.job_id else None,
            "legacyReference": item.legacy_reference,
            "title": item.title,
            "clientEmail": item.client_email,
            "caseCategory": item.case_category,
            "status": item.status.value,
            "caseId": str(item.case_id) if item.case_id else None,
            "assignedLawyerId": str(item.assigned_lawyer_id) if item.assigned_lawyer_id else None,
            "assignedParalegalId": str(item.assigned_paralegal_id) if item.assigned_paralegal_id else None,
            "validationNotes": item.validation_notes,
            "errorMessage": item.error_message,
            "createdAt": item.created_at.isoformat(),
        }
