from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_submissions_preflight_allows_local_frontend() -> None:
    response = client.options(
        "/v1/submissions",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert (
        response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    )
    assert "POST" in (response.headers.get("access-control-allow-methods") or "")


def test_submissions_preflight_rejects_unknown_origin() -> None:
    response = client.options(
        "/v1/submissions",
        headers={
            "Origin": "http://evil.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.headers.get("access-control-allow-origin") != "http://evil.example"
