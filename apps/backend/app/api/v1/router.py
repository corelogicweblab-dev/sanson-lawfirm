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
    document_analysis,
    documents,
    evidence,
    evidence_timelines,
    health,
    knowledge,
    mobile,
    notifications,
    devices,
    sync,
    security,
    system,
    sessions,
    ops,
    case_migration,
    recommendations,
    search,
    legal_requests,
    ocr,
    permissions,
    roles,
    tasks,
    timelines,
    uploads,
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

api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Evidence"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
api_router.include_router(
    document_analysis.router, prefix="/document-analysis", tags=["Document Analysis"]
)
api_router.include_router(
    evidence_timelines.router, prefix="/evidence-timelines", tags=["Evidence Timelines"]
)

api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])

api_router.include_router(mobile.router, prefix="/mobile", tags=["Mobile"])
api_router.include_router(devices.router, prefix="/devices", tags=["Mobile Devices"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(sync.router, prefix="/sync", tags=["Realtime Sync"])

api_router.include_router(security.router, prefix="/security", tags=["Security"])
api_router.include_router(system.router, prefix="/system", tags=["System"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
api_router.include_router(ops.router, prefix="/ops", tags=["Operations"])
api_router.include_router(
    case_migration.router, prefix="/case-migration", tags=["Case Migration"]
)

