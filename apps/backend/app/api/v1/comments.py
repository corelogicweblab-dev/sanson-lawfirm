from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal import CommentCreate
from app.schemas.legal_mappers import to_comment
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.post("/cases/{case_id}")
async def create_comment(
    case_id: UUID,
    body: CommentCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("comments:write")),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role_name not in ("LAWYER", "PARALEGAL", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only internal roles can create comments",
        )
    service = LegalWorkflowService(db)
    comment = await service.create_comment(
        case_id=case_id,
        user_id=current_user.id,
        content=body.content,
        parent_id=body.parent_id,
        mentions=body.mentions,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_comment(comment), "Comment posted")


@router.get("/cases/{case_id}")
async def list_comments(
    case_id: UUID,
    current_user: AuthenticatedUser = Depends(require_permission("comments:read")),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role_name not in ("LAWYER", "PARALEGAL", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only internal roles can view comments",
        )
    service = LegalWorkflowService(db)
    comments = await service.list_comments(case_id)
    return success_response([to_comment(c) for c in comments], "Comments retrieved")

