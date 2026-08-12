from __future__ import annotations

import threading
from collections import defaultdict
from dataclasses import dataclass, field
from time import monotonic

from fastapi import Request

from app.core.errors import rate_limited


@dataclass
class SlidingWindowLimiter:
    max_requests: int
    window_seconds: float
    _hits: dict[str, list[float]] = field(default_factory=lambda: defaultdict(list))
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def check(self, key: str) -> tuple[bool, int, int]:
        now = monotonic()
        with self._lock:
            window_start = now - self.window_seconds
            hits = [
                timestamp for timestamp in self._hits[key] if timestamp > window_start
            ]
            if len(hits) >= self.max_requests:
                retry_after = max(1, int(hits[0] + self.window_seconds - now) + 1)
                remaining = 0
                return False, retry_after, remaining

            hits.append(now)
            self._hits[key] = hits
            remaining = self.max_requests - len(hits)
            return True, 0, remaining


_limiters: dict[str, SlidingWindowLimiter] = {}
_limiters_lock = threading.Lock()


def get_limiter(
    scope: str, *, max_requests: int, window_seconds: float
) -> SlidingWindowLimiter:
    with _limiters_lock:
        limiter = _limiters.get(scope)
        if limiter is None:
            limiter = SlidingWindowLimiter(
                max_requests=max_requests,
                window_seconds=window_seconds,
            )
            _limiters[scope] = limiter
        return limiter


def reset_rate_limiters() -> None:
    with _limiters_lock:
        _limiters.clear()


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"


def enforce_rate_limit(
    request: Request,
    *,
    scope: str,
    max_requests: int,
    window_seconds: float,
) -> None:
    limiter = get_limiter(
        scope,
        max_requests=max_requests,
        window_seconds=window_seconds,
    )
    client_ip = get_client_ip(request)
    allowed, retry_after, remaining = limiter.check(f"{scope}:{client_ip}")
    request.state.rate_limit_remaining = remaining
    request.state.rate_limit_limit = max_requests
    if not allowed:
        raise rate_limited(retry_after=retry_after, limit=max_requests)
