from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_current_user,
    get_user_agent,
    require_legal_operator,
    require_permission,
)
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.services.case_migration_service import CaseMigrationService

router = APIRouter()


class LegacyCaseBody(BaseModel):
    title: str
    client_email: str
    legacy_reference: str | None = None
    case_category: str = "CIVIL"
    assigned_lawyer_id: UUID | None = None
    assigned_paralegal_id: UUID | None = None


class BulkCasesBody(BaseModel):
    cases: list[dict] = Field(default_factory=list)


class BulkDocumentsBody(BaseModel):
    documents: list[dict] = Field(default_factory=list)


class AssignBody(BaseModel):
    lawyer_id: UUID | None = None
    paralegal_id: UUID | None = None


class ValidateBody(BaseModel):
    notes: str | None = None
    import_now: bool = True


@router.get("/summary")
async def migration_summary(
    _user: AuthenticatedUser = Depends(require_permission("migration:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = CaseMigrationService(db)
    return success_response(await svc.summary(), "Migration summary")


@router.get("/queue")
async def migration_queue(
    status: str | None = None,
    _user: AuthenticatedUser = Depends(require_permission("migration:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = CaseMigrationService(db)
    return success_response(await svc.list_queue(status), "Migration queue")


@router.post("/legacy-case")
async def new_legacy_case(
    body: LegacyCaseBody,
    request: Request,
    user: AuthenticatedUser = Depends(require_permission("migration:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    svc = CaseMigrationService(db)
    result = await svc.create_legacy_case(
        title=body.title,
        client_email=body.client_email,
        legacy_reference=body.legacy_reference,
        case_category=body.case_category,
        assigned_lawyer_id=body.assigned_lawyer_id,
        assigned_paralegal_id=body.assigned_paralegal_id,
        created_by=user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(result, "Legacy case processed")


@router.post("/bulk-cases")
async def bulk_cases(
    body: BulkCasesBody,
    request: Request,
    user: AuthenticatedUser = Depends(require_permission("migration:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    svc = CaseMigrationService(db)
    result = await svc.bulk_import_cases(
        body.cases, user.id, get_client_ip(request), get_user_agent(request)
    )
    return success_response(result, "Bulk cases imported")


@router.post("/bulk-documents")
async def bulk_documents(
    body: BulkDocumentsBody,
    user: AuthenticatedUser = Depends(require_permission("migration:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    svc = CaseMigrationService(db)
    result = await svc.bulk_import_documents(body.documents, user.id)
    return success_response(result, "Bulk documents queued")


@router.post("/{item_id}/assign")
async def assign_staff(
    item_id: UUID,
    body: AssignBody,
    request: Request,
    user: AuthenticatedUser = Depends(require_permission("cases:assign")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    svc = CaseMigrationService(db)
    result = await svc.assign_staff(
        item_id, body.lawyer_id, body.paralegal_id, user.id, get_client_ip(request), get_user_agent(request)
    )
    return success_response(result, "Assignment updated")


@router.post("/{item_id}/validate")
async def validate_record(
    item_id: UUID,
    body: ValidateBody,
    request: Request,
    user: AuthenticatedUser = Depends(require_permission("migration:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    svc = CaseMigrationService(db)
    result = await svc.validate_record(
        item_id,
        body.notes,
        body.import_now,
        user.id,
        get_client_ip(request),
        get_user_agent(request),
    )
    return success_response(result, "Record validated")
