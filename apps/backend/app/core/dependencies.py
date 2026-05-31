from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.firebase import is_firebase_configured, verify_firebase_token
from app.domain.authenticated_user import AuthenticatedUser
from app.services.auth_service import AuthService
from app.services.rbac_service import RBACService

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedUser | None:
    if not credentials:
        return None
    return await _resolve_user(request, credentials.credentials, db)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedUser:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    user = await _resolve_user(request, credentials.credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return user


async def _resolve_user(
    request: Request,
    token: str,
    db: AsyncSession,
) -> AuthenticatedUser | None:
    auth_service = AuthService(db)
    rbac = RBACService(db)

    from app.services.session_service import SessionService

    session_svc = SessionService(db)
    if await session_svc.is_token_revoked(token):
        return None

    if is_firebase_configured():
        claims = verify_firebase_token(token)
        if not claims:
            return None
        firebase_uid = claims.get("uid") or claims.get("sub")
        if not firebase_uid:
            return None
        user = await auth_service.get_user_by_firebase_uid(firebase_uid)
        if not user:
            return None
    else:
        user = await auth_service.get_user_by_dev_token(token)
        if not user:
            return None

    permissions = await rbac.get_permissions_for_role(user.role_id)
    return AuthenticatedUser(
        id=user.id,
        firebase_uid=user.firebase_uid,
        email=user.email,
        role_name=user.role.name.value,
        permissions=permissions,
        is_active=user.is_active,
    )


def require_permission(permission: str):
    async def checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )
        return user

    return checker


def require_role(*roles: str):
    async def checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if not user.has_role(*roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role privileges",
            )
        return user

    return checker


def get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def get_user_agent(request: Request) -> str | None:
    return request.headers.get("User-Agent")
