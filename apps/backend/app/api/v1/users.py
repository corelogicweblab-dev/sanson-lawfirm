from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
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
from app.schemas.mappers import to_profile_response, to_user_response
from app.schemas.user import (
    EmailUpdateRequest,
    ProfileUpdateRequest,
    RoleUpdateRequest,
    UserStatusUpdateRequest,
)
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


def _profile_payload(service: UserService, profile) -> dict:
    data = to_profile_response(profile)
    data["profile_photo_url"] = service.resolve_profile_photo_url(profile.profile_photo)
    return data


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

    clear_middle = body.middle_name == ""
    clear_nick = body.nickname == ""

    service = UserService(db)
    try:
        profile = await service.update_profile(
            user_id=user_id,
            performed_by=current_user.id,
            first_name=body.first_name,
            middle_name=None if clear_middle else body.middle_name,
            last_name=body.last_name,
            suffix=body.suffix,
            phone=body.phone,
            address=body.address,
            nickname=None if clear_nick else body.nickname,
            date_of_birth=body.date_of_birth,
            profile_photo=body.profile_photo,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            clear_middle_name=clear_middle,
            clear_nickname=clear_nick,
            clear_date_of_birth="date_of_birth" in body.model_fields_set and body.date_of_birth is None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    await db.commit()
    user = await service.get_user(user_id)
    return success_response(
        {"profile": _profile_payload(service, profile), "user": to_user_response(user) if user else None},
        "Profile updated",
    )


@router.patch("/{user_id}/email")
async def update_email(
    user_id: UUID,
    body: EmailUpdateRequest,
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if str(current_user.id) != str(user_id) and not current_user.has_permission("users:write"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    service = UserService(db)
    try:
        user = await service.update_email(
            user_id=user_id,
            email=str(body.email),
            performed_by=current_user.id,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await db.commit()
    user = await service.get_user(user_id)
    return success_response(to_user_response(user), "Email updated")


@router.post("/{user_id}/profile/avatar")
async def upload_profile_avatar(
    user_id: UUID,
    request: Request,
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if str(current_user.id) != str(user_id) and not current_user.has_permission("users:write"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    data = await file.read()
    service = UserService(db)
    try:
        profile = await service.upload_profile_avatar(
            user_id=user_id,
            file_data=data,
            mime_type=file.content_type or "image/jpeg",
            filename=file.filename or "avatar.jpg",
            performed_by=current_user.id,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    await db.commit()
    user = await service.get_user(user_id)
    return success_response(
        {"profile": _profile_payload(service, profile), "user": to_user_response(user) if user else None},
        "Profile photo updated",
    )


@router.get("/{user_id}/profile/avatar-url")
async def get_profile_avatar_url(
    user_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if str(current_user.id) != str(user_id) and not current_user.has_permission("users:read"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    service = UserService(db)
    user = await service.get_user(user_id)
    if not user or not user.profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    url = service.resolve_profile_photo_url(user.profile.profile_photo)
    return success_response({"url": url}, "Avatar URL retrieved")


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


@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("users:delete")),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    try:
        user = await service.soft_delete_user(
            user_id=user_id,
            performed_by=current_user.id,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await db.commit()
    return success_response(None, "User removed from the platform")

