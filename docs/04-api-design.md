# API Design — "Is It Normal?" Platform

*Development Phase 4 of 11. Follows: Data Modeling. Precedes: Environment & Tooling Setup.*

Style: **REST**. Base path: `/v1`. All endpoints return the standard envelope (§2) unless noted.

---

## 1. Conventions

**Versioning**: URL path (`/v1/...`). A breaking change ships as `/v2/...` alongside the old version, not an in-place replacement.

**Pagination**: cursor-based on all list endpoints.
- Request: `?limit=20&after=<cursor>`
- Response `meta`: `{ "next_cursor": "abc123", "has_more": true }`

**Auth**: Supabase-issued JWT, sent as `Authorization: Bearer <token>`. FastAPI verifies signature via Supabase JWKS and reads the `role` claim (`founder` / `clinical_reviewer`). Public endpoints require no token; anonymous users are identified where needed via a `device_id` (client-generated, sent in a custom header `X-Device-Id`).

**Search/filter state**: always expressed as query parameters, never client-only state — so the URL is the single source of truth and refresh/back/share all work correctly.

**Rate limiting**: applied per-IP on anonymous write endpoints. Tighter limits on `submissions` and `report-issue` (land in manual review queue); looser on `like`/`favorite` toggles.

### Response Envelope

Success:
```json
{ "data": { }, "meta": { }, "error": null }
```

Failure:
```json
{ "data": null, "meta": null, "error": { "code": "NOT_FOUND", "message": "That card couldn't be found." } }
```

`message` is always safe to show end users — no internal details, stack traces, or schema/table names. The real exception is logged server-side (feeds Phase 10 monitoring) and never returned to the client.

### Error Code Enum (shared across all endpoints)

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Request body/params failed validation |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `UNAUTHORIZED` | 401 | Missing/invalid auth token |
| `FORBIDDEN` | 403 | Authenticated but not permitted (e.g. wrong role) |
| `RATE_LIMITED` | 429 | Too many requests from this IP/device |
| `CONFLICT` | 409 | e.g. username already taken |
| `DUPLICATE_LIKELY` | 200 | Submission flagged as a likely duplicate (non-blocking, informational) |
| `RECOVERY_EXHAUSTED` | 400 | No unused recovery codes remain |
| `INTERNAL_ERROR` | 500 | Unexpected server error; detail logged, not exposed |

---

## 2. Public — Content

### `GET /v1/cards`
Card feed — search, filter, paginate. Fully query-param driven.

**Query params**: `q` (search text), `category` (slug), `tags` (comma-separated slugs), `limit`, `after`

**Response `data`**: array of card summaries — `id, slug, question, brief, category, save_count, like_count, source_count, last_reviewed_at`

### `GET /v1/cards/{slug}`
Card detail page.

**Response `data`**: full card — summary fields + `content_blocks[]` (ordered, typed), `sources[]`, `related_cards[]` (auto-computed via shared category/tags, unless overridden)

### `POST /v1/cards/{id}/like`
Toggle. Idempotent per `account_id` or `device_id`. Rate-limited (loose).

**Response `data`**: `{ "liked": true, "like_count": 142 }` — actual server state, for optimistic-UI reconciliation.

### `GET /v1/affirmations`
**Query params**: `mood`/`tag` (optional filter), `limit`, `after`

### `GET /v1/quotes`
Same shape as affirmations, plus `attributed_to`.

### `POST /v1/affirmations/{id}/favorite`, `POST /v1/quotes/{id}/favorite`
Same toggle pattern as card like.

---

## 3. Public — Submissions & Feedback

### `POST /v1/submissions`
Rate-limited (strict).

**Request body**: `{ "question_text": "..." }`

**Response `data`**: `{ "id": "...", "status": "submitted" }`. If trigram similarity finds a likely match, response includes `error.code: "DUPLICATE_LIKELY"` alongside the created submission — informational, not blocking; submission is still queued.

### `POST /v1/cards/{id}/report-issue`
Rate-limited (strict).

**Request body**: `{ "description": "..." }`

---

## 4. Public — Accounts & Preferences

### `POST /v1/accounts`
Signup.

**Request**: `{ "username": "...", "password": "..." }`

**Response `data`**: `{ "account": {...}, "recovery_codes": ["...", ... 8 total] }` — codes shown once only, never retrievable again.

### `POST /v1/accounts/login`
**Request**: `{ "username": "...", "password": "..." }` → returns Supabase session token. Triggers merge-on-login (favorites, push subscription reassignment, theme/layout claim) server-side as part of this flow.

### `POST /v1/accounts/recover`
**Request**: `{ "username": "...", "recovery_code": "...", "new_password": "..." }`. Burns the used code. Returns `RECOVERY_EXHAUSTED` if none remain.

### `POST /v1/accounts/recovery-codes/regenerate`
Auth required. Invalidates old codes, issues 8 new ones (shown once).

### `GET/PATCH /v1/accounts/me`
Auth required. `PATCH` body may include `theme_preference`, `layout_version`.

### `GET/POST /v1/favorites`
Works with or without auth (device-based when anonymous). `POST` merges local IDs into account on login (called internally by the login flow, not typically called directly by the client after that point).

### `POST /v1/push-subscriptions`
**Request**: `{ "endpoint": "...", "keys": {...} }`. Upserts by `endpoint` — reassigns `account_id` if the endpoint already exists under a different account (per the one-subscription-per-browser constraint).

### `POST /v1/newsletter`
**Request**: `{ "email": "...", "enabled": true }`. No auth required — email-based only.

---

## 5. Admin — Review Workflows *(all require valid JWT + role; most require `founder`, review-actions on crisis-adjacent content require `clinical_reviewer` sign-off where flagged)*

### `GET /v1/admin/submissions`
**Query params**: `status`, `limit`, `after`

### `PATCH /v1/admin/submissions/{id}`
**Request**: `{ "status": "...", "resulting_card_id": "...", "decision_notes": "..." }`. Writes a `review_log` entry.

### `GET /v1/admin/reported-issues` / `PATCH /v1/admin/reported-issues/{id}`
Same shape pattern as submissions.

### `POST /v1/admin/cards` / `PATCH /v1/admin/cards/{id}`
Full card + content_blocks + sources payload. On `PATCH` with `status: published` change, triggers: `review_log` entry, `last_reviewed_by`/`last_reviewed_at`/`next_review_due` update, on-demand cache revalidation (per System Design §5). Cards flagged `requires_clinical_review` require the acting user's role to be `clinical_reviewer` (or a recorded clinical sign-off) before `published` is accepted — enforced server-side, not just UI-side.

### `GET /v1/admin/cards/due-for-review`
**Query params**: `before` (date) — cards where `next_review_due` has passed or is approaching.

### `POST/PATCH /v1/admin/affirmations`, `/v1/admin/quotes`
Same CRUD pattern as cards, simpler payload (no content_blocks/sources).

### `GET /v1/admin/review-log`
**Query params**: `entity_type`, `entity_id`, `performed_by`, `limit`, `after`. Read-only, admin-only, never exposed publicly.

---

## 6. Admin — People & Reference Data

### `POST/GET/PATCH/DELETE /v1/admin/admin-users`
`founder`-only. `POST` invites/creates (links a Supabase Auth identity to a role + display_name); `DELETE` revokes access.

### `POST/PATCH/DELETE /v1/admin/categories`
### `POST/PATCH/DELETE /v1/admin/tags`

---

## 7. Admin — Insights

### `GET /v1/admin/analytics`
Internal DB-driven only (no external API calls — Plausible checked separately, deliberately not merged in for v1).

**Response `data`**: top saved cards, top liked cards, submission volume over time, newsletter/push subscriber counts.

---

## 8. Deferred to Next Phase (Environment & Tooling)

- OpenAPI/Pydantic schema definitions (generated from FastAPI, not hand-written separately)
- Repo structure reflecting the module boundaries from System Design
- CI/CD pipeline, environment configs (dev/staging/prod), containerization
