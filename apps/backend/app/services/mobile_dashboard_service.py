from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_chat import ChatSession
from app.models.documents import Document, DocumentReviewStatusEnum
from app.models.legal import Appointment, Case, LegalRequest, Task
from app.services.notification_service import NotificationService


class MobileDashboardService:
    """Role-specific mobile dashboard payloads."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.notifications = NotificationService(db)

    async def get_dashboard(self, user_id: UUID, role: str) -> dict:
        builders = {
            "CLIENT": self._client_dashboard,
            "LAWYER": self._lawyer_dashboard,
            "PARALEGAL": self._paralegal_dashboard,
            "ADMIN": self._admin_dashboard,
        }
        fn = builders.get(role, self._client_dashboard)
        return await fn(user_id)

    async def _recent_notifications(self, user_id: UUID, limit: int = 5) -> list[dict]:
        rows, _ = await self.notifications.list_notifications(user_id, limit=limit)
        return [
            {"id": str(n.id), "title": n.title, "body": n.body, "isRead": n.is_read}
            for n in rows
        ]

    async def _client_dashboard(self, user_id: UUID) -> dict:
        sessions = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.client_id == user_id)
            .order_by(ChatSession.last_activity_at.desc())
            .limit(3)
        )
        requests = await self.db.execute(
            select(LegalRequest)
            .where(LegalRequest.client_id == user_id)
            .order_by(LegalRequest.created_at.desc())
            .limit(5)
        )
        appointments = await self.db.execute(
            select(Appointment)
            .where(Appointment.client_id == user_id)
            .order_by(Appointment.appointment_date.desc())
            .limit(5)
        )
        cases = await self.db.execute(
            select(Case).where(Case.client_id == user_id, Case.deleted_at.is_(None)).limit(5)
        )
        pending_req = [r for r in requests.scalars().all() if r.status.value in ("NEW", "UNDER_REVIEW")]
        return {
            "role": "CLIENT",
            "widgets": {
                "recentAiConversations": [
                    {"id": str(s.id), "status": s.status.value} for s in sessions.scalars().all()
                ],
                "pendingRequests": len(pending_req),
                "upcomingAppointments": [
                    {
                        "id": str(a.id),
                        "date": a.appointment_date.isoformat(),
                        "status": a.status.value,
                    }
                    for a in appointments.scalars().all()
                ],
                "activeCases": [{"id": str(c.id), "title": c.title} for c in cases.scalars().all()],
                "recentNotifications": await self._recent_notifications(user_id),
            },
            "quickActions": [
                {"label": "AI Assistant", "route": "/ai"},
                {"label": "New Request", "route": "/requests"},
                {"label": "Upload Evidence", "route": "/documents"},
            ],
        }

    async def _lawyer_dashboard(self, user_id: UUID) -> dict:
        appointments = await self.db.execute(
            select(Appointment).where(Appointment.lawyer_id == user_id).limit(10)
        )
        cases = await self.db.execute(
            select(Case).where(Case.deleted_at.is_(None)).order_by(Case.updated_at.desc()).limit(10)
        )
        tasks = await self.db.execute(select(Task).where(Task.assigned_to == user_id).limit(10))
        pending_docs = await self.db.execute(
            select(Document).where(
                Document.review_status == DocumentReviewStatusEnum.PENDING,
                Document.deleted_at.is_(None),
            ).limit(5)
        )
        urgent = [c for c in cases.scalars().all() if c.priority.value == "URGENT"]
        return {
            "role": "LAWYER",
            "widgets": {
                "todaysConsultations": len(appointments.scalars().all()),
                "urgentCases": len(urgent),
                "pendingReviews": len(list(pending_docs.scalars().all())),
                "assignedTasks": len(
                    [t for t in tasks.scalars().all() if t.status.value in ("PENDING", "IN_PROGRESS")]
                ),
                "recentNotifications": await self._recent_notifications(user_id),
            },
            "quickActions": [
                {"label": "Consultations", "route": "/consultations"},
                {"label": "Cases", "route": "/cases"},
                {"label": "Smart Search", "route": "/search"},
            ],
        }

    async def _paralegal_dashboard(self, user_id: UUID) -> dict:
        tasks = await self.db.execute(select(Task).where(Task.assigned_to == user_id).limit(15))
        return {
            "role": "PARALEGAL",
            "widgets": {
                "assignedTasks": len(list(tasks.scalars().all())),
                "documentValidationQueue": 0,
                "recentNotifications": await self._recent_notifications(user_id),
            },
            "quickActions": [
                {"label": "Tasks", "route": "/tasks"},
                {"label": "Documents", "route": "/documents"},
            ],
        }

    async def _admin_dashboard(self, user_id: UUID) -> dict:
        from app.models import User

        users = (await self.db.execute(select(User).where(User.deleted_at.is_(None))).scalars().all())
        cases = (await self.db.execute(select(Case).where(Case.deleted_at.is_(None))).scalars().all())
        return {
            "role": "ADMIN",
            "widgets": {
                "totalUsers": len(users),
                "activeCases": len(cases),
                "recentNotifications": await self._recent_notifications(user_id),
            },
            "quickActions": [
                {"label": "Users", "route": "/users"},
                {"label": "Cases", "route": "/cases"},
                {"label": "Analytics", "route": "/analytics"},
            ],
        }
