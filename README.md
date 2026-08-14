# Normal ("Is It Normal?")

Monorepo for the Normal platform: Next.js frontend (Vercel) and FastAPI backend (Render).

## Structure

- `frontend/` - Next.js application
- `backend/` - FastAPI application
- `docs/` - Phase planning documents

## Prerequisites

- Node.js 20+ (`frontend/.nvmrc`)
- Python 3.12+
- Docker (optional, for backend container builds)

## Backend (local)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
# Copy .env.example to .env and fill in values (loaded automatically on startup)
uvicorn app.main:app --reload
```

Health check: `curl http://localhost:8000/health` returns `{"status":"ok"}`.

## Backend (Docker)

```bash
docker build -t normal-backend ./backend
docker run --rm -p 8000:8000 normal-backend
```

Health check: `curl http://localhost:8000/health` returns `{"status":"ok"}`.

## CI

GitHub Actions runs on every pull request to `main`:

- Backend: `ruff` lint/format, `pytest`, Docker build
- Frontend: ESLint, Prettier, Vitest (empty suite), production build

## Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 for the default page.

## Environment variables

Copy `.env.example` to `.env.local` in each app directory. Never commit secrets or `.env.local` files.
