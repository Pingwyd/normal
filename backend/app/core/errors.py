class ApiError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
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
