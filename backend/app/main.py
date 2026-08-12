from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.auth.router import router as auth_router
from app.core.errors import ApiError
from app.core.responses import error_envelope

app = FastAPI(title="Normal API")
app.include_router(auth_router)


@app.exception_handler(ApiError)
async def handle_api_error(_request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_envelope(exc.code, exc.message),
    )


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
