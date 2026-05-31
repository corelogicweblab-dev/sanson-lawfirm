import structlog
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import check_database_connection, get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent
from app.core.firebase import is_firebase_configured, verify_firebase_token
from app.core.responses import error_response, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mappers import to_user_response
from app.schemas.user import AuthSyncRequest
from app.services.auth_service import AuthService
from app.services.security_service import SecurityService
from app.services.session_service import SessionService
from app.services.user_service import UserService

router = APIRouter()
logger = structlog.get_logger()


@router.post("/sync")
async def sync_user(
    body: AuthSyncRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Sync Firebase user to PostgreSQL after authentication."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return error_response("Authentication token required", code="AUTH_REQUIRED")

    if not await check_database_connection():
        logger.error("auth_sync_db_unavailable")
        return error_response(
            "Database is unavailable. Fix DATABASE_URL on Render (Supabase connection pooler, SSL).",
            code="DATABASE_UNAVAILABLE",
        )

    token = auth_header[7:]
    auth_service = AuthService(db)

    try:
        if is_firebase_configured():
            claims = verify_firebase_token(token)
            if not claims:
                return error_response("Invalid Firebase token", code="INVALID_TOKEN")
            firebase_uid = claims.get("uid") or claims.get("sub")
            email = claims.get("email", "")
        else:
            firebase_uid = f"dev-{token[:32]}"
            email = token.replace("dev:", "") if token.startswith("dev:") else "dev@local.test"

        user, is_new = await auth_service.sync_user(
            firebase_uid=firebase_uid,
            email=email,
            first_name=body.first_name,
            last_name=body.last_name,
            phone=body.phone,
            role_name=body.role,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
        user = await auth_service.user_repo.get_by_id(user.id)

        try:
            session_svc = SessionService(db)
            await session_svc.create_session(
                user_id=user.id,
                token=token,
                platform="WEB",
                ip=get_client_ip(request),
                ua=get_user_agent(request),
                actor_role=user.role.name.value,
            )
        except Exception as session_exc:
            logger.warning("session_create_skipped", error=str(session_exc))

        try:
            sec = SecurityService(db)
            await sec.record_login_success(user.id, get_client_ip(request), get_user_agent(request))
        except Exception as sec_exc:
            logger.warning("security_event_skipped", error=str(sec_exc))

        return success_response(
            {"user": to_user_response(user), "is_new_user": is_new},
            "User synced successfully" if is_new else "User logged in",
        )
    except Exception as exc:
        logger.exception("auth_sync_failed", error=str(exc))
        return error_response(
            "Login sync failed. Check Render logs and Supabase DATABASE_URL.",
            code="SYNC_FAILED",
        )


@router.get("/me")
async def get_me(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.get_me(current_user.id)
    if not user:
        return success_response(None, "User not found")
    return success_response(to_user_response(user))


@router.post("/logout")
async def logout(
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    await auth_service.logout(
        current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    return success_response(None, "Logged out successfully")


@router.get("/status")
async def auth_status():
    return success_response(
        {
            "firebase_configured": is_firebase_configured(),
            "provider": "firebase",
        },
        "Auth status",
    )

