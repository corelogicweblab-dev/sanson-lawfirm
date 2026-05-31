from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent
from app.core.firebase import is_firebase_configured, verify_firebase_token
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mappers import to_user_response
from app.schemas.user import AuthSyncRequest
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()


@router.post("/sync")
async def sync_user(
    body: AuthSyncRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Sync Firebase user to PostgreSQL after authentication."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return success_response(None, "Authentication token required")

    token = auth_header[7:]
    auth_service = AuthService(db)

    if is_firebase_configured():
        claims = verify_firebase_token(token)
        if not claims:
            return success_response(None, "Invalid Firebase token")
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

    return success_response(
        {"user": to_user_response(user), "is_new_user": is_new},
        "User synced successfully" if is_new else "User logged in",
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

