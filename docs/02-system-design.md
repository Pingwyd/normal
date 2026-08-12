# System Design / Architecture — "Is It Normal?" Platform

*Development Phase 2 of 11. Follows: Requirements & Scoping (covered by app-concept-spec.md). Precedes: Data Modeling.*

---

## 1. Architectural Style

**Decoupled client-server**, not monolith-in-one-app and not microservices.

- One **Next.js** application (frontend — public site + internal admin section)
- One **FastAPI** application (backend — single API serving both)
- One **Supabase Postgres** database

This is the simplest architecture that still cleanly separates concerns. Microservices would be premature complexity for a solo-founder, v1-scoped, read-heavy content site — there's no independent-scaling or independent-deployment need that would justify the operational overhead. A single tangled full-stack app (e.g. server-rendered templates with no API boundary) would instead make it harder to later support other clients (native app, if ever pursued) or to keep public/admin concerns cleanly separated.

**Why this fits the spec specifically:**
- v1 scope is deliberately small (cards + search + browse) — architecture should not outrun scope.
- Content is founder-authored and reviewed, not high-volume user-generated — this is a read-heavy system, not a write-heavy one.
- No user PII, anonymous-first — removes a large class of architectural complexity around personal data handling.

---

## 2. Stack

| Layer | Choice | Hosting | Why |
|---|---|---|---|
| Frontend | Next.js | Vercel | Server-rendered/static pages for SEO (explicit long-term channel in spec); built-in Open Graph support for shareable card previews (core to social/TikTok strategy); auto-scaling, generous free tier |
| Backend | FastAPI | Render | Founder's preferred stack; clean REST API layer; auto-scale-capable, avoids classic free-tier "cold sleep" trap |
| Database | Postgres | Supabase | Managed, autoscaling storage, generous free tier; pairs with Supabase Auth |
| Auth (admin only) | Supabase Auth | — | Mature, secure-by-default (hashing, session handling, brute-force protection) — no reason to hand-roll for a 2-user system |
| Email | Resend | — | Transactional email for newsletter/affirmations delivery (v1.1) |
| Push | Native Web Push API + `pywebpush` | — | Free at any volume, no vendor; fits spec's "opt-in, easy to disable" simplicity |
| Analytics | Plausible or Fathom | — | Cookieless, privacy-first — consistent with no-personal-data stance (per spec) |
| Ad network | TBD | — | Pending sensitive-content policy check (per spec) |

**Explicitly excluded (and why):**
- **Content-moderation API** (e.g. OpenAI moderation, Perspective API) — solves a scale problem this product doesn't have; every submission is already manually reviewed by the founder before anything goes live.
- **Dedicated image CDN** (Cloudinary, Imgix) — Vercel's built-in `next/image` optimization covers this at v1 scale (mainly share-card OG images); redundant vendor otherwise.
- **Third-party push service** (OneSignal, etc.) — native Web Push is free and sufficient; avoids an extra vendor and privacy-policy surface.

---

## 3. Component Boundaries (Loose Coupling / High Cohesion / Separation of Concerns)

**Top level**: Next.js and FastAPI communicate only through a defined REST API contract (formal contract defined in the next phase — API Design). Neither side needs to know the other's internals. This is the primary loose-coupling boundary.

**Within FastAPI**, organized by domain rather than as one flat app:

- `content` — cards, categories, search/filtering
- `submissions` — user-submitted question queue, AI duplicate-detection assist
- `admin` — review/approval workflow, role enforcement
- `notifications` — email (Resend) and push delivery
- `auth` — Supabase Auth integration, role/session handling

Each module owns one responsibility. Review-workflow logic does not leak into public content-serving logic, and vice versa — this keeps the public-facing read path simple and fast, and keeps the admin workflow (which is stateful and more complex) contained.

**Within Next.js**, the public site and the admin section are structurally separate (distinct route groups), sharing only common UI primitives and the API client — the admin section is auth-gated and never exposed to anonymous traffic.

---

## 4. Access Control

Two roles, enforced at two layers (defense in depth — inexpensive at this scale, worth doing anyway given the sensitivity of the content):

- **Founder** — full access: publish/edit/unpublish anything, manage all workflow, manage roles.
- **Clinical reviewer** — scoped access: review/comment/approve specifically on crisis-adjacent drafts, per the spec's explicit boundary that she is a disclosed advisor/reviewer, not a general admin or personal referral point.

Enforced via:
1. Supabase row-level security (data layer)
2. FastAPI route/permission checks (application layer)

MFA (TOTP) enabled on both admin accounts — the founder account is effectively the sole publish-gate for the entire site, worth hardening beyond password-only.

No accounts, auth, or PII exist for regular site visitors — consistent with the spec's anonymous-first, no-personal-data design.

---

## 5. Scalability & Performance

**Read-heavy, edit-rarely pattern**: cards are reviewed on a 12-month cadence or on an explicit "report an issue" flag — not continuously edited. This is a caching-friendly access pattern, and the architecture leans into it rather than over-engineering for write-heavy scale it won't see.

- **Edge/CDN caching** (via Vercel) for all public card pages.
- **Cache invalidation**: on-demand, instant, triggered directly by the publish/edit action in the admin panel (a single revalidation call at the end of the existing save flow — not a separate system, not time-based polling). Chosen over a delayed/batch approach because the primary edit trigger is often a user-flagged content issue on sensitive health/emotional-wellbeing content read by teens — the cost of stale incorrect content staying live is disproportionate to the near-zero engineering cost of instant invalidation.
- **Horizontal scaling story**: Vercel and Render both auto-scale beyond free tier under sustained load (relevant given the TikTok-driven launch strategy could produce traffic spikes); Supabase Postgres scales storage/compute independently as a managed service.
- **Indexing strategy**: deferred to Data Modeling (next phase) for specifics, but the architectural principle is set now — index on the fields users actually search/filter by (category, tags, question text).

---

## 6. CAP Theorem — Assessed, Not Applicable

CAP trade-offs (consistency vs. availability under network partition) matter for systems running their own distributed database across multiple nodes, where the *application* has to choose a trade-off during a partition event. This system runs on Supabase — a single managed Postgres instance with replication/failover handled by the provider. There is no distributed-systems trade-off for this architecture to make; that concern has been outsourced to the hosting layer. Noted here explicitly rather than silently omitted — this would become relevant again only if the system moved to multi-region or a distributed database, which is not in scope for this build.

---

## 7. Data Structure Philosophy (High-Level Only)

One open question is carried forward deliberately rather than resolved here: whether a "card" is best modeled as a rigid relational row or needs flexible/semi-structured sub-fields (e.g. variable source-citation formats, tiered source labels). This is a real decision, but it's made properly *with the schema in front of us* — it belongs in Data Modeling, not decided in the abstract here.

---

## 8. Third-Party Integration Summary

| Integration | Purpose | Status |
|---|---|---|
| Resend | Transactional email (newsletter, affirmations delivery) | Planned, v1.1 |
| Native Web Push + pywebpush | Browser push notifications | Planned, v1.1 |
| Ad network | Monetization | Pending policy review (per spec) |
| Plausible / Fathom | Privacy-first analytics | Planned, launch |

No content-moderation API, no image CDN, no third-party push service — deliberately excluded per reasoning in Section 2.

---

## 9. Explicitly Deferred to Later Phases

- Full database schema, table design, indexing specifics, relational vs. JSONB decisions → **Data Modeling**
- Endpoint contracts, request/response shapes, versioning → **API Design**
- Repo structure, CI/CD, environments, containerization → **Environment & Tooling Setup**
- Ad network final selection (pending sensitive-content policy check) → ongoing, outside pure technical build
