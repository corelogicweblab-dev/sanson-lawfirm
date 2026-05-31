from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import User, UserRoleEnum
from app.models.legal import (
    Appointment,
    AppointmentStatusEnum,
    AssigneeRoleEnum,
    Case,
    CaseActivity,
    CaseAssignment,
    CaseCategoryEnum,
    CaseSourceTypeEnum,
    CaseStatus,
    Comment,
    ConsultationNote,
    ConsultationOutcome,
    ConsultationOutcomeEnum,
    ConsultationTypeEnum,
    LegalRequest,
    LegalRequestStatusEnum,
    PriorityLevelEnum,
    Task,
    TaskStatusEnum,
    Timeline,
    TimelineEventTypeEnum,
)
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.utils.references import generate_case_number, generate_request_reference


class LegalWorkflowService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)
        self.user_repo = UserRepository(db)

    # --- Legal Requests ---

    async def create_legal_request(
        self,
        client_id: UUID,
        case_category: str,
        subject: str,
        description: str,
        priority: str,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> LegalRequest:
        ref = await generate_request_reference(self.db)
        req = LegalRequest(
            client_id=client_id,
            request_reference=ref,
            case_category=CaseCategoryEnum[case_category],
            subject=subject,
            description=description,
            priority=PriorityLevelEnum[priority],
            status=LegalRequestStatusEnum.NEW,
            requested_at=datetime.now(timezone.utc),
        )
        self.db.add(req)
        await self.db.flush()
        await self.audit.log(
            "legal_request.create", "legal_requests", req.id, performed_by, ip, ua,
            new_values={"reference": ref, "subject": subject},
        )
        return req

    async def get_legal_request(self, request_id: UUID) -> LegalRequest | None:
        result = await self.db.execute(
            select(LegalRequest).where(
                LegalRequest.id == request_id, LegalRequest.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def list_legal_requests(
        self,
        offset: int,
        limit: int,
        client_id: UUID | None = None,
        status: str | None = None,
        lawyer_view: bool = False,
    ) -> tuple[list[LegalRequest], int]:
        query = select(LegalRequest).where(LegalRequest.deleted_at.is_(None))
        count_q = select(func.count(LegalRequest.id)).where(LegalRequest.deleted_at.is_(None))
        if client_id:
            query = query.where(LegalRequest.client_id == client_id)
            count_q = count_q.where(LegalRequest.client_id == client_id)
        if status:
            query = query.where(LegalRequest.status == LegalRequestStatusEnum[status])
            count_q = count_q.where(LegalRequest.status == LegalRequestStatusEnum[status])
        if lawyer_view:
            query = query.where(
                LegalRequest.status.in_([
                    LegalRequestStatusEnum.NEW,
                    LegalRequestStatusEnum.UNDER_REVIEW,
                    LegalRequestStatusEnum.WAITING_FOR_SCHEDULE,
                    LegalRequestStatusEnum.SCHEDULED,
                ])
            )
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            query.order_by(LegalRequest.requested_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def update_legal_request(
        self,
        request_id: UUID,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
        **kwargs,
    ) -> LegalRequest | None:
        req = await self.get_legal_request(request_id)
        if not req:
            return None
        old_status = req.status.value
        if "status" in kwargs and kwargs["status"]:
            req.status = LegalRequestStatusEnum[kwargs["status"]]
        if "subject" in kwargs and kwargs["subject"]:
            req.subject = kwargs["subject"]
        if "description" in kwargs and kwargs["description"]:
            req.description = kwargs["description"]
        if "priority" in kwargs and kwargs["priority"]:
            req.priority = PriorityLevelEnum[kwargs["priority"]]
        if "case_category" in kwargs and kwargs["case_category"]:
            req.case_category = CaseCategoryEnum[kwargs["case_category"]]
        await self.db.flush()
        if kwargs.get("status") and kwargs["status"] != old_status:
            await self.audit.log(
                "legal_request.status_change", "legal_requests", req.id, performed_by, ip, ua,
                old_values={"status": old_status},
                new_values={"status": kwargs["status"]},
            )
        return req

    # --- Appointments ---

    async def create_appointment(
        self,
        request_id: UUID,
        client_id: UUID,
        appointment_date,
        appointment_time,
        consultation_type: str,
        lawyer_id: UUID | None,
        remarks: str | None,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> Appointment:
        req = await self.get_legal_request(request_id)
        if not req:
            raise ValueError("Legal request not found")
        if req.status not in (
            LegalRequestStatusEnum.UNDER_REVIEW,
            LegalRequestStatusEnum.WAITING_FOR_SCHEDULE,
            LegalRequestStatusEnum.APPROVED,
            LegalRequestStatusEnum.SCHEDULED,
        ) and req.status != LegalRequestStatusEnum.NEW:
            pass  # allow scheduling from multiple states
        appt = Appointment(
            request_id=request_id,
            client_id=client_id,
            lawyer_id=lawyer_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            consultation_type=ConsultationTypeEnum[consultation_type],
            status=AppointmentStatusEnum.PENDING,
            remarks=remarks,
        )
        self.db.add(appt)
        req.status = LegalRequestStatusEnum.SCHEDULED
        await self.db.flush()
        await self.audit.log(
            "appointment.create", "appointments", appt.id, performed_by, ip, ua,
            new_values={"request_id": str(request_id)},
        )
        return appt

    async def get_appointment(self, appointment_id: UUID) -> Appointment | None:
        result = await self.db.execute(
            select(Appointment).where(
                Appointment.id == appointment_id, Appointment.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def list_appointments(
        self,
        offset: int,
        limit: int,
        client_id: UUID | None = None,
        lawyer_id: UUID | None = None,
        request_id: UUID | None = None,
    ) -> tuple[list[Appointment], int]:
        query = select(Appointment).where(Appointment.deleted_at.is_(None))
        count_q = select(func.count(Appointment.id)).where(Appointment.deleted_at.is_(None))
        if client_id:
            query = query.where(Appointment.client_id == client_id)
            count_q = count_q.where(Appointment.client_id == client_id)
        if lawyer_id:
            query = query.where(Appointment.lawyer_id == lawyer_id)
            count_q = count_q.where(Appointment.lawyer_id == lawyer_id)
        if request_id:
            query = query.where(Appointment.request_id == request_id)
            count_q = count_q.where(Appointment.request_id == request_id)
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Appointment.appointment_date.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def update_appointment(
        self, appointment_id: UUID, performed_by: UUID,
        ip: str | None = None, ua: str | None = None, **kwargs
    ) -> Appointment | None:
        appt = await self.get_appointment(appointment_id)
        if not appt:
            return None
        for field in ("lawyer_id", "appointment_date", "appointment_time", "remarks"):
            if field in kwargs and kwargs[field] is not None:
                setattr(appt, field, kwargs[field])
        if kwargs.get("consultation_type"):
            appt.consultation_type = ConsultationTypeEnum[kwargs["consultation_type"]]
        if kwargs.get("status"):
            appt.status = AppointmentStatusEnum[kwargs["status"]]
            if kwargs["status"] == "COMPLETED":
                req = await self.get_legal_request(appt.request_id)
                if req:
                    req.status = LegalRequestStatusEnum.CONSULTED
        await self.db.flush()
        await self.audit.log(
            "appointment.update", "appointments", appt.id, performed_by, ip, ua,
            new_values={k: str(v) for k, v in kwargs.items() if v is not None},
        )
        return appt

    # --- Cases ---

    async def get_case_status_by_name(self, name: str) -> CaseStatus | None:
        result = await self.db.execute(
            select(CaseStatus).where(CaseStatus.name == name, CaseStatus.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_default_open_status(self) -> CaseStatus:
        status = await self.get_case_status_by_name("OPEN")
        if not status:
            result = await self.db.execute(select(CaseStatus).limit(1))
            status = result.scalar_one()
        return status

    async def create_case(
        self,
        client_id: UUID,
        case_category: str,
        title: str,
        description: str | None,
        priority: str,
        request_id: UUID | None,
        assigned_lawyer_id: UUID | None,
        assigned_paralegal_id: UUID | None,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
        source_type: str = "MANUAL",
    ) -> Case:
        case_number = await generate_case_number(self.db)
        status = await self.get_default_open_status()
        try:
            src = CaseSourceTypeEnum[source_type]
        except KeyError:
            src = CaseSourceTypeEnum.MANUAL
        case = Case(
            case_number=case_number,
            request_id=request_id,
            client_id=client_id,
            assigned_lawyer_id=assigned_lawyer_id,
            assigned_paralegal_id=assigned_paralegal_id,
            status_id=status.id,
            case_category=CaseCategoryEnum[case_category],
            source_type=src,
            title=title,
            description=description,
            priority=PriorityLevelEnum[priority],
            opened_at=datetime.now(timezone.utc),
        )
        self.db.add(case)
        await self.db.flush()
        if request_id:
            req = await self.get_legal_request(request_id)
            if req:
                req.status = LegalRequestStatusEnum.CONVERTED_TO_CASE
        await self._log_case_activity(
            case.id, "case.created", f"Case {case_number} opened", performed_by
        )
        await self._add_timeline(
            case.id, TimelineEventTypeEnum.STATUS_CHANGE, "Case Opened",
            f"Case {case_number} was opened", performed_by,
        )
        if assigned_lawyer_id:
            await self._create_assignment(
                case.id, assigned_lawyer_id, AssigneeRoleEnum.LAWYER, performed_by
            )
        if assigned_paralegal_id:
            await self._create_assignment(
                case.id, assigned_paralegal_id, AssigneeRoleEnum.PARALEGAL, performed_by
            )
        await self.audit.log(
            "case.create", "cases", case.id, performed_by, ip, ua,
            new_values={"case_number": case_number},
        )
        return case

    async def create_case_from_request(
        self, request_id: UUID, performed_by: UUID,
        title: str | None = None, description: str | None = None,
        assigned_lawyer_id: UUID | None = None,
        assigned_paralegal_id: UUID | None = None,
        ip: str | None = None, ua: str | None = None,
    ) -> Case:
        req = await self.get_legal_request(request_id)
        if not req:
            raise ValueError("Request not found")
        return await self.create_case(
            client_id=req.client_id,
            case_category=req.case_category.value,
            title=title or req.subject,
            description=description or req.description,
            priority=req.priority.value,
            request_id=request_id,
            assigned_lawyer_id=assigned_lawyer_id,
            assigned_paralegal_id=assigned_paralegal_id,
            performed_by=performed_by,
            ip=ip,
            ua=ua,
            source_type="AI_INTAKE",
        )

    async def get_case(self, case_id: UUID) -> Case | None:
        result = await self.db.execute(
            select(Case)
            .options(selectinload(Case.status))
            .where(Case.id == case_id, Case.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_cases(
        self,
        offset: int,
        limit: int,
        client_id: UUID | None = None,
        lawyer_id: UUID | None = None,
        paralegal_id: UUID | None = None,
    ) -> tuple[list[Case], int]:
        query = (
            select(Case)
            .options(selectinload(Case.status))
            .where(Case.deleted_at.is_(None))
        )
        count_q = select(func.count(Case.id)).where(Case.deleted_at.is_(None))
        if client_id:
            query = query.where(Case.client_id == client_id)
            count_q = count_q.where(Case.client_id == client_id)
        if lawyer_id:
            query = query.where(Case.assigned_lawyer_id == lawyer_id)
            count_q = count_q.where(Case.assigned_lawyer_id == lawyer_id)
        if paralegal_id:
            query = query.where(Case.assigned_paralegal_id == paralegal_id)
            count_q = count_q.where(Case.assigned_paralegal_id == paralegal_id)
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Case.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def update_case(
        self, case_id: UUID, performed_by: UUID,
        ip: str | None = None, ua: str | None = None, **kwargs
    ) -> Case | None:
        case = await self.get_case(case_id)
        if not case:
            return None
        old_status = case.status.name if case.status else None
        if kwargs.get("title"):
            case.title = kwargs["title"]
        if kwargs.get("description") is not None:
            case.description = kwargs["description"]
        if kwargs.get("priority"):
            case.priority = PriorityLevelEnum[kwargs["priority"]]
        if kwargs.get("status_id"):
            case.status_id = kwargs["status_id"]
        elif kwargs.get("status_name"):
            st = await self.get_case_status_by_name(kwargs["status_name"])
            if st:
                case.status_id = st.id
                if st.is_terminal:
                    case.closed_at = datetime.now(timezone.utc)
        if kwargs.get("assigned_lawyer_id") is not None:
            case.assigned_lawyer_id = kwargs["assigned_lawyer_id"]
        if kwargs.get("assigned_paralegal_id") is not None:
            case.assigned_paralegal_id = kwargs["assigned_paralegal_id"]
        await self.db.flush()
        case = await self.get_case(case_id)
        if kwargs.get("status_name") and kwargs["status_name"] != old_status:
            await self._log_case_activity(
                case_id, "case.status_change",
                f"Status changed to {kwargs['status_name']}", performed_by,
            )
            await self._add_timeline(
                case_id, TimelineEventTypeEnum.STATUS_CHANGE,
                f"Status: {kwargs['status_name']}", None, performed_by,
            )
        await self.audit.log("case.update", "cases", case_id, performed_by, ip, ua)
        return case

    async def list_case_statuses(self) -> list[CaseStatus]:
        result = await self.db.execute(
            select(CaseStatus)
            .where(CaseStatus.deleted_at.is_(None))
            .order_by(CaseStatus.sort_order)
        )
        return list(result.scalars().all())

    # --- Assignments ---

    async def _create_assignment(
        self, case_id: UUID, assignee_id: UUID, role: AssigneeRoleEnum, assigned_by: UUID,
        notes: str | None = None,
    ) -> CaseAssignment:
        await self.db.execute(
            select(CaseAssignment)
            .where(
                CaseAssignment.case_id == case_id,
                CaseAssignment.assignee_role == role,
                CaseAssignment.is_active.is_(True),
            )
        )
        result = await self.db.execute(
            select(CaseAssignment).where(
                CaseAssignment.case_id == case_id,
                CaseAssignment.assignee_role == role,
                CaseAssignment.is_active.is_(True),
                CaseAssignment.deleted_at.is_(None),
            )
        )
        for existing in result.scalars().all():
            existing.is_active = False
            existing.ended_at = datetime.now(timezone.utc)

        assignment = CaseAssignment(
            case_id=case_id,
            assignee_id=assignee_id,
            assignee_role=role,
            assigned_by=assigned_by,
            is_active=True,
            notes=notes,
            assigned_at=datetime.now(timezone.utc),
        )
        self.db.add(assignment)
        await self.db.flush()
        case = await self.get_case(case_id)
        if case:
            if role == AssigneeRoleEnum.LAWYER:
                case.assigned_lawyer_id = assignee_id
            else:
                case.assigned_paralegal_id = assignee_id
        await self._add_timeline(
            case_id, TimelineEventTypeEnum.ASSIGNMENT,
            f"{role.value} assigned", notes, assigned_by,
        )
        return assignment

    async def assign_to_case(
        self, case_id: UUID, assignee_id: UUID, assignee_role: str,
        assigned_by: UUID, notes: str | None = None,
        ip: str | None = None, ua: str | None = None,
    ) -> CaseAssignment:
        a = await self._create_assignment(
            case_id, assignee_id, AssigneeRoleEnum[assignee_role], assigned_by, notes
        )
        await self.audit.log(
            "case.assignment", "case_assignments", a.id, assigned_by, ip, ua,
            new_values={"assignee_role": assignee_role},
        )
        return a

    async def list_assignments(self, case_id: UUID) -> list[CaseAssignment]:
        result = await self.db.execute(
            select(CaseAssignment)
            .where(CaseAssignment.case_id == case_id, CaseAssignment.deleted_at.is_(None))
            .order_by(CaseAssignment.assigned_at.desc())
        )
        return list(result.scalars().all())

    # --- Tasks ---

    async def create_task(
        self, created_by: UUID, title: str, description: str | None,
        case_id: UUID | None, request_id: UUID | None,
        assigned_to: UUID | None, priority: str, due_date,
        ip: str | None = None, ua: str | None = None,
    ) -> Task:
        task = Task(
            case_id=case_id,
            request_id=request_id,
            assigned_to=assigned_to,
            created_by=created_by,
            title=title,
            description=description,
            priority=PriorityLevelEnum[priority],
            due_date=due_date,
            status=TaskStatusEnum.PENDING,
        )
        self.db.add(task)
        await self.db.flush()
        if case_id:
            await self._add_timeline(
                case_id, TimelineEventTypeEnum.TASK, f"Task: {title}", description, created_by,
                reference_id=task.id,
            )
        await self.audit.log("task.create", "tasks", task.id, created_by, ip, ua)
        return task

    async def list_tasks(
        self, offset: int, limit: int,
        assigned_to: UUID | None = None, case_id: UUID | None = None,
        status: str | None = None,
    ) -> tuple[list[Task], int]:
        query = select(Task).where(Task.deleted_at.is_(None))
        count_q = select(func.count(Task.id)).where(Task.deleted_at.is_(None))
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
            count_q = count_q.where(Task.assigned_to == assigned_to)
        if case_id:
            query = query.where(Task.case_id == case_id)
            count_q = count_q.where(Task.case_id == case_id)
        if status:
            query = query.where(Task.status == TaskStatusEnum[status])
            count_q = count_q.where(Task.status == TaskStatusEnum[status])
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())
            .offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def update_task(
        self, task_id: UUID, performed_by: UUID,
        ip: str | None = None, ua: str | None = None, **kwargs
    ) -> Task | None:
        result = await self.db.execute(
            select(Task).where(Task.id == task_id, Task.deleted_at.is_(None))
        )
        task = result.scalar_one_or_none()
        if not task:
            return None
        if kwargs.get("title"):
            task.title = kwargs["title"]
        if kwargs.get("description") is not None:
            task.description = kwargs["description"]
        if kwargs.get("priority"):
            task.priority = PriorityLevelEnum[kwargs["priority"]]
        if kwargs.get("assigned_to"):
            task.assigned_to = kwargs["assigned_to"]
        if kwargs.get("due_date") is not None:
            task.due_date = kwargs["due_date"]
        if kwargs.get("status"):
            task.status = TaskStatusEnum[kwargs["status"]]
            if kwargs["status"] == "COMPLETED":
                task.completed_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.audit.log("task.update", "tasks", task.id, performed_by, ip, ua)
        return task

    # --- Comments ---

    async def create_comment(
        self, case_id: UUID, user_id: UUID, content: str,
        parent_id: UUID | None, mentions: list,
        ip: str | None = None, ua: str | None = None,
    ) -> Comment:
        comment = Comment(
            case_id=case_id, user_id=user_id, content=content,
            parent_id=parent_id, mentions=mentions,
        )
        self.db.add(comment)
        await self.db.flush()
        await self._add_timeline(
            case_id, TimelineEventTypeEnum.COMMENT, "Internal comment added",
            content[:200], user_id, reference_id=comment.id,
        )
        await self.audit.log("comment.create", "comments", comment.id, user_id, ip, ua)
        return comment

    async def list_comments(self, case_id: UUID) -> list[Comment]:
        result = await self.db.execute(
            select(Comment)
            .where(Comment.case_id == case_id, Comment.deleted_at.is_(None))
            .order_by(Comment.created_at.asc())
        )
        return list(result.scalars().all())

    # --- Consultations ---

    async def create_consultation_note(
        self, lawyer_id: UUID, performed_by: UUID, **fields
    ) -> ConsultationNote:
        note = ConsultationNote(lawyer_id=lawyer_id, **fields)
        self.db.add(note)
        await self.db.flush()
        await self.audit.log(
            "consultation.note", "consultation_notes", note.id, performed_by
        )
        return note

    async def create_consultation_outcome(
        self, request_id: UUID, outcome: str, recorded_by: UUID,
        appointment_id: UUID | None = None, notes: str | None = None,
        ip: str | None = None, ua: str | None = None,
    ) -> ConsultationOutcome:
        oc = ConsultationOutcome(
            request_id=request_id,
            appointment_id=appointment_id,
            outcome=ConsultationOutcomeEnum[outcome],
            notes=notes,
            recorded_by=recorded_by,
        )
        self.db.add(oc)
        req = await self.get_legal_request(request_id)
        if req:
            if outcome == "PROCEED_WITH_CASE":
                req.status = LegalRequestStatusEnum.APPROVED
            elif outcome == "DECLINED":
                req.status = LegalRequestStatusEnum.DECLINED
            elif outcome == "REQUIRE_MORE_DOCUMENTS":
                req.status = LegalRequestStatusEnum.UNDER_REVIEW
        await self.db.flush()
        await self.audit.log(
            "consultation.outcome", "consultation_outcomes", oc.id, recorded_by, ip, ua,
            new_values={"outcome": outcome},
        )
        return oc

    async def list_consultation_notes(
        self, request_id: UUID | None = None, appointment_id: UUID | None = None
    ) -> list[ConsultationNote]:
        query = select(ConsultationNote).where(ConsultationNote.deleted_at.is_(None))
        if request_id:
            query = query.where(ConsultationNote.request_id == request_id)
        if appointment_id:
            query = query.where(ConsultationNote.appointment_id == appointment_id)
        result = await self.db.execute(query.order_by(ConsultationNote.created_at.desc()))
        return list(result.scalars().all())

    # --- Timelines ---

    async def _add_timeline(
        self, case_id: UUID, event_type: TimelineEventTypeEnum, title: str,
        description: str | None, created_by: UUID | None,
        reference_id: UUID | None = None,
    ) -> Timeline:
        tl = Timeline(
            case_id=case_id,
            event_type=event_type,
            event_date=datetime.now(timezone.utc),
            title=title,
            description=description,
            source="system",
            reference_id=reference_id,
            created_by=created_by,
        )
        self.db.add(tl)
        await self.db.flush()
        return tl

    async def create_timeline_event(
        self, case_id: UUID, event_type: str, event_date: datetime,
        title: str, description: str | None, created_by: UUID,
        reference_id: UUID | None = None,
        ip: str | None = None, ua: str | None = None,
    ) -> Timeline:
        tl = Timeline(
            case_id=case_id,
            event_type=TimelineEventTypeEnum[event_type],
            event_date=event_date,
            title=title,
            description=description,
            source="manual",
            reference_id=reference_id,
            created_by=created_by,
        )
        self.db.add(tl)
        await self.db.flush()
        await self.audit.log("timeline.create", "timelines", tl.id, created_by, ip, ua)
        return tl

    async def list_timelines(self, case_id: UUID) -> list[Timeline]:
        result = await self.db.execute(
            select(Timeline)
            .where(Timeline.case_id == case_id, Timeline.deleted_at.is_(None))
            .order_by(Timeline.event_date.desc())
        )
        return list(result.scalars().all())

    async def list_case_activities(self, case_id: UUID) -> list[CaseActivity]:
        result = await self.db.execute(
            select(CaseActivity)
            .where(CaseActivity.case_id == case_id, CaseActivity.deleted_at.is_(None))
            .order_by(CaseActivity.created_at.desc())
        )
        return list(result.scalars().all())

    async def _log_case_activity(
        self, case_id: UUID, activity_type: str, description: str, performed_by: UUID
    ) -> None:
        act = CaseActivity(
            case_id=case_id,
            activity_type=activity_type,
            description=description,
            performed_by=performed_by,
        )
        self.db.add(act)

    async def get_workflow_stats(self) -> dict:
        req_count = (await self.db.execute(
            select(func.count(LegalRequest.id)).where(LegalRequest.deleted_at.is_(None))
        )).scalar() or 0
        appt_scheduled = (await self.db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.deleted_at.is_(None),
                Appointment.status.in_([
                    AppointmentStatusEnum.PENDING,
                    AppointmentStatusEnum.CONFIRMED,
                ]),
            )
        )).scalar() or 0
        active_cases = (await self.db.execute(
            select(func.count(Case.id))
            .join(CaseStatus, Case.status_id == CaseStatus.id)
            .where(Case.deleted_at.is_(None), CaseStatus.is_terminal.is_(False))
        )).scalar() or 0
        pending_tasks = (await self.db.execute(
            select(func.count(Task.id)).where(
                Task.deleted_at.is_(None),
                Task.status.in_([TaskStatusEnum.PENDING, TaskStatusEnum.IN_PROGRESS]),
            )
        )).scalar() or 0
        status_dist = await self.db.execute(
            select(CaseStatus.display_name, func.count(Case.id))
            .join(Case, Case.status_id == CaseStatus.id)
            .where(Case.deleted_at.is_(None))
            .group_by(CaseStatus.display_name)
        )
        return {
            "total_requests": req_count,
            "consultations_scheduled": appt_scheduled,
            "active_cases": active_cases,
            "pending_tasks": pending_tasks,
            "case_status_distribution": {row[0]: row[1] for row in status_dist.all()},
        }

    async def verify_user_role(self, user_id: UUID, role: UserRoleEnum) -> bool:
        user = await self.user_repo.get_by_id(user_id)
        return user is not None and user.role.name == role

