from app.core.rate_limit import SlidingWindowLimiter, reset_rate_limiters


def test_sliding_window_allows_requests_within_limit() -> None:
    reset_rate_limiters()
    limiter = SlidingWindowLimiter(max_requests=3, window_seconds=60)

    allowed_one, _, remaining_one = limiter.check("test-key")
    allowed_two, _, remaining_two = limiter.check("test-key")
    allowed_three, _, remaining_three = limiter.check("test-key")

    assert allowed_one is True
    assert allowed_two is True
    assert allowed_three is True
    assert remaining_one == 2
    assert remaining_two == 1
    assert remaining_three == 0


def test_sliding_window_blocks_requests_over_limit() -> None:
    reset_rate_limiters()
    limiter = SlidingWindowLimiter(max_requests=2, window_seconds=60)

    limiter.check("test-key")
    limiter.check("test-key")
    allowed, retry_after, remaining = limiter.check("test-key")

    assert allowed is False
    assert retry_after >= 1
    assert remaining == 0
