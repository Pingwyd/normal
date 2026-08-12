class ApiError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int,
        *,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.headers = headers or {}
        super().__init__(message)


def unauthorized(message: str = "Authentication is required.") -> ApiError:
    return ApiError(code="UNAUTHORIZED", message=message, status_code=401)


def forbidden(
    message: str = "You do not have permission to perform this action.",
) -> ApiError:
    return ApiError(code="FORBIDDEN", message=message, status_code=403)


def not_found(message: str = "That resource could not be found.") -> ApiError:
    return ApiError(code="NOT_FOUND", message=message, status_code=404)


def conflict(message: str = "That resource already exists.") -> ApiError:
    return ApiError(code="CONFLICT", message=message, status_code=409)


def validation_error(message: str = "Request validation failed.") -> ApiError:
    return ApiError(code="VALIDATION_ERROR", message=message, status_code=422)


def rate_limited(
    message: str = "Too many requests. Try again later.",
    *,
    retry_after: int = 60,
    limit: int | None = None,
) -> ApiError:
    return ApiError(
        code="RATE_LIMITED",
        message=message,
        status_code=429,
        headers={
            "Retry-After": str(retry_after),
            "X-RateLimit-Limit": str(limit if limit is not None else 0),
            "X-RateLimit-Remaining": "0",
        },
    )


def recovery_exhausted(
    message: str = "No unused recovery codes remain.",
) -> ApiError:
    return ApiError(code="RECOVERY_EXHAUSTED", message=message, status_code=400)
