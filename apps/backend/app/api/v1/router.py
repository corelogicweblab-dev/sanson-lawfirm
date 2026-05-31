from fastapi import APIRouter

from app.api.v1 import (
    ai,
    appointments,
    assignments,
    audit,
    auth,
    cases,
    chat,
    comments,
    consultations,
    health,
    legal_requests,
    permissions,
    roles,
    tasks,
    timelines,
    users,
    workflow,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(permissions.router, prefix="/permissions", tags=["Permissions"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])

api_router.include_router(legal_requests.router, prefix="/legal-requests", tags=["Legal Requests"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(cases.router, prefix="/cases", tags=["Cases"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(comments.router, prefix="/comments", tags=["Comments"])
api_router.include_router(consultations.router, prefix="/consultations", tags=["Consultations"])
api_router.include_router(timelines.router, prefix="/timelines", tags=["Timelines"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["Workflow"])

api_router.include_router(chat.router, prefix="/chat", tags=["AI Chat"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Engine"])

