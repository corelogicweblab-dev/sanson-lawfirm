from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_current_user,
    get_user_agent,
    require_legal_operator,
    require_permission,
)
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mappers import to_user_response
from app.schemas.user import ProfileUpdateRequest, RoleUpdateRequest, UserStatusUpdateRequest
from app.services.user_service import UserService

router = APIRouter()


@router.get("/")
async def list_users(
    pagination: PaginationParams = Depends(),
    role: str | None = None,
    current_user: AuthenticatedUser = Depends(require_permission("users:read")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    users, total = await service.list_users(
        page=pagination.page,
        page_size=pagination.page_size,
        role_name=role,
    )
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )
    return success_response(
        [to_user_response(u) for u in users],
        "Users retrieved",
        meta=meta.model_dump(),
    )


@router.get("/directory")
async def legal_user_directory(
    role: str | None = None,
    pagination: PaginationParams = Depends(),
    _user: AuthenticatedUser = Depends(require_permission("cases:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    """Minimal user list for paralegal case intake (clients, lawyers)."""
    service = UserService(db)
    users, _total = await service.list_users(
        page=pagination.page,
        page_size=min(pagination.page_size, 100),
        role_name=role,
    )
    items = [
        {
            "id": str(u.id),
            "email": u.email,
            "role": u.role.name if u.role else None,
            "display_name": (
                f"{u.profile.first_name} {u.profile.last_name}".strip()
                if u.profile
                else u.email
            ),
        }
        for u in users
    ]
    return success_response(items, "Directory retrieved")


@router.get("/stats")
async def dashboard_stats(
    current_user: AuthenticatedUser = Depends(require_permission("dashboard:admin")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    stats = await service.get_dashboard_stats()
    return success_response(stats, "Dashboard stats retrieved")


@router.get("/{user_id}")
async def get_user(
    user_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if str(current_user.id) != str(user_id) and not current_user.has_permission("users:read"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    service = UserService(db)
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return success_response(to_user_response(user))


@router.patch("/{user_id}/profile")
async def update_profile(
    user_id: UUID,
    body: ProfileUpdateRequest,
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if str(current_user.id) != str(user_id) and not current_user.has_permission("users:write"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    service = UserService(db)
    profile = await service.update_profile(
        user_id=user_id,
        performed_by=current_user.id,
        first_name=body.first_name,
        middle_name=body.middle_name,
        last_name=body.last_name,
        suffix=body.suffix,
        phone=body.phone,
        address=body.address,
        profile_photo=body.profile_photo,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return success_response(
        {
            "id": str(profile.id),
            "first_name": profile.first_name,
            "last_name": profile.last_name,
        },
        "Profile updated",
    )


@router.patch("/{user_id}/role")
async def update_role(
    user_id: UUID,
    body: RoleUpdateRequest,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("roles:write")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.update_role(
        user_id=user_id,
        role_name=body.role,
        performed_by=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or role not found")
    return success_response(to_user_response(user), "Role updated")


@router.patch("/{user_id}/status")
async def update_status(
    user_id: UUID,
    body: UserStatusUpdateRequest,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("users:write")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.set_active(
        user_id=user_id,
        is_active=body.is_active,
        performed_by=current_user.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return success_response(to_user_response(user), "User status updated")

