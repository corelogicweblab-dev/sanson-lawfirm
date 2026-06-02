from fastapi import APIRouter

from app.core.config import get_settings
from app.core.responses import success_response

router = APIRouter()
settings = get_settings()


@router.get("/")
async def health_check():
    return success_response(
        {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
        },
        "Service is healthy",
    )


@router.get("/live")
async def liveness_check():
    return success_response({"status": "alive"}, "Service is alive")


@router.get("/ready")
async def readiness_check():
    from app.core.database import check_database_connection
    from app.core.env_validation import validate_environment

    from app.core.database import check_database_connection_detailed

    url_issues = settings.database_url_issues()
    db_error: str | None = None
    if url_issues:
        db_ok = False
        db_error = url_issues[0]
    else:
        db_ok, db_error = await check_database_connection_detailed()

    env = validate_environment(settings)
    storage_backend = "none"
    storage_ok = False
    storage_error: str | None = None
    try:
        from app.services.document_file_storage import DocumentFileStorage

        storage = DocumentFileStorage()
        storage_backend = storage.backend
        if storage.supabase.configured:
            import httpx

            url = f"{storage.supabase._base_url()}/storage/v1/bucket"
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=storage.supabase._headers())
            storage_ok = res.status_code == 200
            if not storage_ok:
                storage_error = f"Storage API returned {res.status_code}"
        elif storage.r2.configured:
            storage_ok = True
        else:
            storage_error = "Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL on Render"
    except Exception as exc:
        storage_error = str(exc)[:200]

    ready = db_ok and (env.valid or settings.environment.lower() == "development")

    host_hint = ""
    if "pooler.supabase.com" in settings.database_url:
        host_hint = "transaction_pooler_port_6543"
    elif "supabase.co" in settings.database_url:
        host_hint = "direct_connection"

    return success_response(
        {
            "status": "ready" if ready else "degraded",
            "environment": settings.environment,
            "database": "connected" if db_ok else "unavailable",
            "database_error": db_error,
            "database_host_mode": host_hint,
            "database_url_issues": url_issues,
            "env_validation": env.to_dict(),
            "storage_backend": storage_backend,
            "storage_ok": storage_ok,
            "storage_error": storage_error,
            "hint": (
                None
                if db_ok
                else "After changing DATABASE_URL on Render, click Manual Deploy (restart required). "
                "Confirm Supabase → Settings → General → Reference ID matches postgres.REF in the URL."
            ),
        },
        "Service is ready" if ready else "Readiness check failed",
    )

