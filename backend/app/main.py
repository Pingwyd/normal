from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.auth.router import router as auth_router
from app.content.admin_router import router as content_admin_router
from app.content.router import router as content_router
from app.core.errors import ApiError
from app.core.responses import error_envelope
from app.submissions.admin_router import router as submissions_admin_router
from app.submissions.router import router as submissions_router

app = FastAPI(title="Normal API")
app.include_router(auth_router)
app.include_router(content_router)
app.include_router(content_admin_router)
app.include_router(submissions_router)
app.include_router(submissions_admin_router)


@app.exception_handler(ApiError)
async def handle_api_error(_request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_envelope(exc.code, exc.message),
        headers=exc.headers,
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
