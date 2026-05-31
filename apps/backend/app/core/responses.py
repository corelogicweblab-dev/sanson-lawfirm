from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    field: str | None = None
    code: str
    message: str


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "OK"
    data: T | None = None
    meta: dict[str, Any] | None = None
    errors: list[ErrorDetail] | None = None


class PaginationMeta(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int = 0
    total_pages: int = 0


def success_response(
    data: Any = None,
    message: str = "OK",
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data,
        "meta": meta,
        "errors": None,
    }


def error_response(
    message: str,
    errors: list[dict[str, Any]] | None = None,
    code: str = "ERROR",
) -> dict[str, Any]:
    error_list = errors or [{"code": code, "message": message}]
    return {
        "success": False,
        "message": message,
        "data": None,
        "meta": None,
        "errors": error_list,
    }


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size
