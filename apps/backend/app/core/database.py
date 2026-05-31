import ssl
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

_engine = None
_session_factory = None


def _connect_args() -> dict:
    args: dict = {"timeout": 15, "command_timeout": 15}
    # Supabase transaction pooler (6543) — disable prepared statement cache
    if "pooler.supabase.com" in settings.async_database_url:
        args["statement_cache_size"] = 0
        args["prepared_statement_cache_size"] = 0
    if settings.requires_database_ssl:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        args["ssl"] = ssl_ctx
    return args


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.async_database_url,
            echo=settings.debug,
            pool_pre_ping=True,
            connect_args=_connect_args(),
        )
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def _sanitize_db_error(exc: Exception) -> str:
    msg = str(exc).split("\n")[0][:280]
    for token in ("password", "postgresql", "asyncpg", "://"):
        if token in msg.lower():
            return "Database connection refused or authentication failed. Reset Supabase DB password, copy fresh pooler URI to Render, then Manual Deploy."
    return msg or "Unknown database connection error"


async def check_database_connection() -> bool:
    ok, _ = await check_database_connection_detailed()
    return ok


async def check_database_connection_detailed() -> tuple[bool, str | None]:
    try:
        factory = get_session_factory()
        async with factory() as session:
            await session.execute(text("SELECT 1"))
        return True, None
    except Exception as exc:
        return False, _sanitize_db_error(exc)


def reset_database_engine() -> None:
    """Drop cached engine after DATABASE_URL changes (requires redeploy on Render)."""
    global _engine, _session_factory
    _engine = None
    _session_factory = None
