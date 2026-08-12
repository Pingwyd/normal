from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.accounts.router import router as accounts_router
from app.auth.router import router as auth_router
from app.content.admin_router import router as content_admin_router
from app.content.router import router as content_router
from app.core.config import get_cors_origins
from app.core.errors import ApiError
from app.core.responses import error_envelope
from app.favorites.router import router as favorites_router
from app.submissions.admin_router import router as submissions_admin_router
from app.submissions.router import router as submissions_router

app = FastAPI(title="Normal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(get_cors_origins()),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Forwarded-For"],
    expose_headers=["Retry-After"],
)

app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(favorites_router)
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
