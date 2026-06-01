from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

STATIC_DIR = Path(__file__).resolve().parents[1] / "static_web"


def _resolve_static(path: str) -> Path | None:
    if not path or path == "/":
        path = "index.html"
    path = path.lstrip("/")
    if ".." in path:
        return None

    direct = STATIC_DIR / path
    if direct.is_file():
        return direct

    html_file = STATIC_DIR / f"{path.rstrip('/')}.html"
    if html_file.is_file():
        return html_file

    index_in_dir = STATIC_DIR / path.rstrip("/") / "index.html"
    if index_in_dir.is_file():
        return index_in_dir

    root_index = STATIC_DIR / "index.html"
    if root_index.is_file():
        return root_index

    return None


def mount_static_web(app: FastAPI) -> None:
    if not STATIC_DIR.is_dir():
        return

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_static(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        resolved = _resolve_static(full_path)
        if not resolved:
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(resolved)
