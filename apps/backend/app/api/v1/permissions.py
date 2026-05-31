from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mappers import to_permission_response
from app.services.rbac_service import RBACService

router = APIRouter()


@router.get("/")
async def list_permissions(
    current_user: AuthenticatedUser = Depends(require_permission("permissions:read")),
    db: AsyncSession = Depends(get_db),
):
    service = RBACService(db)
    permissions = await service.list_permissions()
    return success_response(
        [to_permission_response(p) for p in permissions],
        "Permissions retrieved",
    )

