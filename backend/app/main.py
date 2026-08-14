from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.accounts.router import router as accounts_router
from app.analytics.admin_router import router as analytics_admin_router
from app.auth.router import router as auth_router
from app.content.admin_router import router as content_admin_router
from app.content.router import router as content_router
from app.core.config import get_cors_origins
from app.core.errors import ApiError
from app.core.responses import error_envelope
from app.favorites.router import router as favorites_router
from app.notifications.admin_router import router as notifications_admin_router
from app.notifications.router import router as notifications_router
from app.reflections.admin_router import router as reflections_admin_router
from app.reflections.router import router as reflections_router
from app.research.admin_router import router as research_admin_router
from app.submissions.admin_router import router as submissions_admin_router
from app.submissions.router import router as submissions_router

app = FastAPI(title="Normal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(get_cors_origins()),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Forwarded-For",
        "X-Device-Id",
    ],
    expose_headers=["Retry-After"],
)

app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(favorites_router)
app.include_router(notifications_router)
app.include_router(notifications_admin_router)
app.include_router(content_router)
app.include_router(content_admin_router)
app.include_router(reflections_router)
app.include_router(reflections_admin_router)
app.include_router(submissions_router)
app.include_router(submissions_admin_router)
app.include_router(analytics_admin_router)
app.include_router(research_admin_router)


def _format_request_validation_errors(exc: RequestValidationError) -> str:
    parts: list[str] = []
    for error in exc.errors():
        location = ".".join(
            str(part) for part in error.get("loc", ()) if part != "body"
        )
        message = str(error.get("msg", "Invalid value"))
        if location:
            parts.append(f"{location}: {message}")
        else:
            parts.append(message)
    return "; ".join(parts) if parts else "Request validation failed."


@app.exception_handler(RequestValidationError)
async def handle_request_validation_error(
    _request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_envelope(
            "VALIDATION_ERROR",
            _format_request_validation_errors(exc),
        ),
    )


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
