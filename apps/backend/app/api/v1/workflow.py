from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.get("/stats")
async def workflow_stats(
    current_user: AuthenticatedUser = Depends(require_permission("dashboard:admin")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    stats = await service.get_workflow_stats()
    return success_response(stats, "Legal workflow stats retrieved")

