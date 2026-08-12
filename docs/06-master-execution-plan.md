# Master Execution Plan — "Is It Normal?" Platform

*Consolidates Phases 1–5 (Requirements, System Design, Data Modeling, API Design, Environment & Tooling) into an ordered build sequence for Phase 6 (Implementation) onward.*

**Source documents** (read the relevant one before starting each step below — this plan gives sequence and scope, the source docs give exact detail):
- `app-concept-spec.md` — product requirements, content model, tone/legal constraints
- `02-system-design.md` — architecture, module boundaries, caching strategy
- `03-data-modeling.md` — full schema, all tables/fields/relationships
- `04-api-design.md` — endpoint contracts, envelope, error codes, auth
- `05-environment-tooling.md` — repo structure, containerization, CI/CD

**Stack**: FastAPI (backend, Render, Docker) + Next.js (frontend, Vercel) + Supabase (Postgres + Auth). Monorepo. Backend-first per module, then frontend for that module, before moving to the next module.

**Standing rule threaded through every step below** (per project convention — not a separate phase): write tests alongside the code for that step, not after (unit tests for logic, integration tests for endpoints touching the DB); run lint + tests via the CI gate on every PR (per `05-environment-tooling.md` §4) before merge; keep an eye on what Phase 10 (Monitoring) will need (structured logging, no swallowed exceptions) as code is written, even though the monitoring tool itself isn't wired up yet.

---

## Step 0 — Foundation (prerequisite to everything)

- Scaffold the monorepo per the structure in `05-environment-tooling.md` §1
- Set up Supabase project, enable `pg_trgm` extension
- Set up GitHub repo, branch protection on `main`, GitHub Actions skeleton (lint + test job, currently empty)
- Configure `render.yaml`, `vercel.json`, `.env.local` templates (no real secrets committed)

**Definition of done**: empty FastAPI app deploys to Render, empty Next.js app deploys to Vercel, both reachable via a health-check route; CI runs (even on nothing yet) on a test PR.

---

## Step 1 — Database Migrations

- Implement every table from `03-data-modeling.md` as Supabase migrations, in dependency order (`categories`/`tags` before `cards`, `accounts` before `favorites`, etc.)
- Apply indexes as specified (trigram on `cards.question`/`submissions.question_text`, btree on FKs and `next_review_due`)
- Apply Supabase row-level security policies for admin-only tables (`review_log`, `admin_users`)

**Definition of done**: full schema exists in Supabase; a seed script can insert one sample row per table without constraint errors.

---

## Step 2 — Auth Module (Backend)

- Wire Supabase Auth for admin login (founder + clinical_reviewer roles)
- JWT verification middleware in FastAPI (validates signature via Supabase JWKS, extracts role claim)
- Implement `admin_users` endpoints (`04-api-design.md` §6) — founder-only create/list/patch/delete
- Role-based route protection helper, reused by every admin endpoint built after this point

**Definition of done**: a founder account can be created directly in Supabase, logged in via API, and receives a token that FastAPI correctly validates and role-checks; unauthorized requests to a protected test route correctly return `UNAUTHORIZED`/`FORBIDDEN`.

---

## Step 3 — Content Module (Backend)

- `GET /v1/cards` (search/filter/paginate, cursor-based, per `04-api-design.md` §2)
- `GET /v1/cards/{slug}` (detail + content_blocks + sources + related)
- `POST/PATCH /v1/admin/cards` (including the `requires_clinical_review` publish gate, `review_log` writes, `next_review_due` calc, on-demand cache revalidation hook)
- `GET /v1/admin/cards/due-for-review`
- Categories/tags admin CRUD

**Definition of done**: a card can be created via the admin API, appears correctly via the public list/detail endpoints, and a `review_log` entry is written on publish.

---

## Step 4 — Content Module (Frontend)

- Public browse/feed page — card grid, category chips, query-param-driven search & filters (URL is source of truth, per earlier decision)
- Card detail page — renders `content_blocks` by type (paragraph/chart/table/etc. block renderer components), sources with tier labels, related cards
- Search-as-you-type autocomplete

**Definition of done**: a visitor can search, filter, browse, and read a full card detail page end-to-end against the real backend — no mock data.

---

## Step 5 — Admin Card-Management UI (Frontend)

- Auth-gated `/admin` route group (role-aware: founder sees everything, clinical_reviewer sees scoped review actions)
- Card create/edit form, including content-block editor (add/reorder/edit typed blocks) and source management
- "Due for review" queue view

**Definition of done**: the founder can, without touching the database directly, create and publish a card end-to-end through the UI — this is the point content production for launch (the ~40–50 cards) can actually begin.

---

### ⟶ True v1 functionally complete at end of Step 5. Steps 6+ are v1.1/v2 per the spec's launch-scope guidance — sequence still matters, but none of these block a minimal public launch. ⟶

---

## Step 6 — Submissions & Moderation

- Backend: `POST /v1/submissions` (rate-limited, trigram duplicate-check, `DUPLICATE_LIKELY` flag), admin queue endpoints, `reported-issues` endpoints
- Frontend: public "suggest a question" form + "report an issue" link on detail pages; admin review-queue UI (approve/reject/draft, duplicate-merge decision)

**Definition of done**: a publicly submitted question lands in the admin queue, duplicate flag works against existing cards, founder can approve it into a published card end-to-end.

---

## Step 7 — Favorites

- Backend: `GET/POST /v1/favorites` (anonymous device-based + account-linked), merge-on-login/signup logic
- Frontend: `localStorage`-based save for anonymous users, save button on cards, favorites list view, merge triggers correctly on login

**Definition of done**: favoriting works with no account, persists across a refresh, and correctly merges into an account on signup/login without duplication.

---

## Step 8 — Likes / Engagement

- Backend: `POST /v1/cards/{id}/like` toggle (idempotent per account/device)
- Frontend: optimistic-UI like button (instant visual toggle, reconciles on server response)

**Definition of done**: repeated clicking toggles cleanly between liked/unliked (never accumulates), state is correct after refresh, and reconciliation handles a failed request gracefully.

---

## Step 9 — Daily Affirmations & Quotes

- Backend: `affirmations`/`quotes` CRUD (admin) + public read endpoints, `affirmation_tags` junction
- Frontend: swipeable card deck UI (Tinder-style), save/share actions tied into the existing favorites system, admin CRUD screens

**Definition of done**: founder can publish an affirmation/quote via admin, it appears in the swipeable deck, can be saved and shared.

---

## Step 10 — Notifications

- Backend: `push_subscriptions` (upsert/reassign logic per the one-subscription-per-browser constraint), `newsletter` subscribe/toggle, Resend integration, `pywebpush` integration
- Frontend: push opt-in prompt, settings/profile page (theme, layout, push, newsletter toggles — works anonymously, syncs on login per earlier design)

**Definition of done**: a test push notification and a test newsletter email both successfully deliver end-to-end; settings persist correctly per-account and reassign correctly per-device for push.

---

## Step 11 — Admin Analytics

- Backend: `GET /v1/admin/analytics` (internal DB aggregates only — no Plausible integration, per earlier decision)
- Frontend: admin insights dashboard view

**Definition of done**: dashboard correctly reflects real saved/liked/submission counts from the live database.

---

## Ongoing Threads (not a step — apply throughout Steps 1–11)

- **Testing**: unit + integration tests written alongside each step's code, not deferred to a separate testing phase
- **Code review**: every PR reviewed before merge (even solo — per `05-environment-tooling.md` §4), CI lint/test gate must pass
- **Deployment**: each step ships via the existing PR → `main` → auto-deploy pipeline; no big-bang deploy at the end
- **Monitoring readiness**: structured logging and clean error handling from Step 1 onward, so Phase 10 (wiring an actual error-tracking tool) is a connection step, not a retrofit

---

## Explicitly Not in This Plan (deferred beyond Implementation)

- Legal documents (ToS, Privacy Policy, disclaimer) — non-technical deliverable, but a hard launch blocker per the spec; track separately, don't let it slip
- Ad network integration — pending policy review, add once selected
- Final content production (the 40–50 launch cards) — content work, not code, but gated on Step 5 being complete
