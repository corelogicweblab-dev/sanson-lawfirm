from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.services.audit_service import AuditService
from app.services.mobile_dashboard_service import MobileDashboardService

router = APIRouter()


@router.get("/dashboard")
async def mobile_dashboard(
    user: AuthenticatedUser = Depends(require_permission("mobile:read")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = MobileDashboardService(db)
    data = await svc.get_dashboard(user.id, user.role_name)
    audit = AuditService(db)
    await audit.log("mobile.dashboard_access", "mobile", None, user.id, ip, ua)
    return success_response(data, "Mobile dashboard")


@router.get("/bootstrap")
async def mobile_bootstrap(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initial payload after login — dashboard + realtime hints."""
    dash_svc = MobileDashboardService(db)
    from app.services.sync_service import SyncService

    sync_svc = SyncService(db)
    return success_response(
        {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role_name,
            },
            "dashboard": await dash_svc.get_dashboard(user.id, user.role_name),
            "realtime": sync_svc.supabase_config(),
        },
        "Mobile bootstrap",
    )
