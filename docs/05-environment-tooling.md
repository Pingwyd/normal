# Environment & Tooling Setup — "Is It Normal?" Platform

*Development Phase 5 of 11. Follows: API Design. Precedes: Implementation.*

---

## 1. Repo Structure — Monorepo

One repo, hosted on GitHub, containing both applications. Chosen over separate repos because a solo founder building both sides benefits from atomic commits/PRs spanning frontend + backend changes together, with no meaningful deployment downside — both Vercel and Render support building from a subdirectory of a monorepo.

```
normal-app/
├── frontend/                 # Next.js — deployed to Vercel
│   ├── app/                  # public routes + gated /admin route group
│   ├── components/
│   ├── lib/                  # API client, shared utils
│   ├── vercel.json           # frontend infra-as-config (Vercel Root Directory: frontend)
│   └── package.json
├── backend/                  # FastAPI — deployed to Render (Docker)
│   ├── app/
│   │   ├── content/          # cards, categories, tags, search
│   │   ├── submissions/      # submission queue, duplicate-detection
│   │   ├── admin/            # review workflow, roles, review_log
│   │   ├── notifications/    # email (Resend), push
│   │   └── auth/             # Supabase JWT verification
│   ├── Dockerfile
│   └── requirements.txt
├── docs/                     # phase documents (this series)
├── render.yaml                # backend infra-as-config
└── README.md
```

Module boundaries mirror the domains defined in System Design (§3) — no drift between the architecture doc and the actual folder structure.

---

## 2. Environments

**Local (dev) + Production only** — no dedicated staging, by design choice given free-tier/cost priority. This gap is compensated for by:
- **Docker for the backend**, so the exact container that runs on Render can be run locally before ever pushing
- **Vercel's automatic per-PR preview deployments** for the frontend — effectively a temporary staging environment for every branch, at no extra cost
- **Required PRs + CI gate** (§4) before anything reaches `main`/production

Environment variables (Supabase keys, Resend key, VAPID keys for push) managed via `.env.local` (gitignored) locally, and via each platform's environment-variable dashboard in production — never committed to the repo.

---

## 3. Containerization

- **Backend (FastAPI)**: Dockerized. Ensures environment parity between local dev, CI, and Render — eliminates "works on my machine" drift from Python version or system-library differences.
- **Frontend (Next.js)**: **not** Dockerized — deployed via Vercel's native build pipeline, which is purpose-built for Next.js (edge caching, image optimization, on-demand revalidation used for cache invalidation per System Design §5). Wrapping it in Docker would work against the platform rather than with it.

---

## 4. Branch Strategy & CI/CD

- **`main`** — protected, always deployable, reflects production.
- **Feature branches** — one per unit of work.
- **PRs required before merge**, even solo — this is the actual gate that substitutes for a staging environment.

**GitHub Actions** runs on every PR:
1. Lint (`ruff` for backend, `ESLint`/`Prettier` for frontend)
2. Tests (unit/integration — see Phase 7)
3. Build check (both apps)

Merge to `main` triggers each platform's **native auto-deploy** (Vercel and Render both deploy on push to the connected branch) — GitHub Actions' role is the pre-merge gate, not the deploy mechanism itself.

*Note to confirm during setup*: verify whether Render's current free/starter tier includes per-PR preview environments (some plans do, pricing/features may have changed) — if available, adds a backend equivalent to Vercel's preview deploys.

---

## 5. Tooling Defaults

| Concern | Backend | Frontend |
|---|---|---|
| Lint/format | `ruff` | `ESLint` + `Prettier` |
| Dependency management | `pip` + `requirements.txt` | `npm` |
| Package manager rationale | Simple, sufficient at this scale; `poetry`/`uv` reasonable later if dependency complexity grows | No strong reason to reach for `pnpm`/`yarn` given team size of one |

**Infra-as-config**: `render.yaml` and `frontend/vercel.json` checked into the repo — build/environment settings are version-controlled rather than only set via dashboard clicks, so they're reviewable in PRs and reproducible if a service needs to be recreated.

---

## 6. Deferred to Next Phase (Implementation)

- Actual module code, sprint breakdown, order of feature build-out (auth/data-layer-first per general practice)
- Test suite scaffolding (Phase 7 defines the testing approach itself)
