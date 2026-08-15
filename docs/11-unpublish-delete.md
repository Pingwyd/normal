# Feature Addendum — Unpublish and Delete

*Fixes a real gap: no working path existed to unpublish or delete content after creation, and status enums were inconsistent across content types. Extends `03-data-modeling.md`, `04-api-design.md`, and the relevant Cursor prompts in `07-cursor-prompts.md`.*

---

## 1. The gap, precisely

- `cards.status` was defined with three values (`draft`, `published`, `unpublished`) back in Data Modeling, but no endpoint, admin UI action, or Cursor prompt ever implements the transition to `unpublished`.
- `affirmations`, `quotes`, and `reflections` only ever got a two-value status (`draft`, `published`) — inconsistent with `cards`, and missing the same capability.
- No delete path exists anywhere, for anything.

---

## 2. Rule

**Unpublish-only for anything that has ever been published. Hard-delete permitted only for content that has never left `draft` status** (verified against `review_log` history, not just current status, since something unpublished after being published must still be blocked from deletion). This preserves audit-trail integrity, protects users who favorited the content, and keeps the action reversible.

---

## 3. Schema Fix

Update `affirmations.status`, `quotes.status`, and `reflections.status` to the same three-value enum `cards.status` already uses: `draft`, `published`, `unpublished`. No new tables required.

---

## 4. API Additions

**Unpublish**: handled via the existing `PATCH` endpoint for each content type (`/v1/admin/cards/{id}`, `/v1/admin/affirmations/{id}`, `/v1/admin/quotes/{id}`, `/v1/admin/reflections/{id}`), setting `status: unpublished`. This must:
- Trigger the same on-demand cache revalidation used on publish, so the page stops being served immediately
- Write a `review_log` entry (`action: unpublished`) for the two types that have a review log (cards; extend `review_log.entity_type` to include `affirmation`, `quote`, `reflection` if not already covered)
- Be excluded from all public read endpoints exactly as `draft` already is (confirm this filter exists, don't assume)
- Be excluded from related-card auto-computation and from search/browse results

**Delete**: `DELETE /v1/admin/cards/{id}` (and equivalents for the other three types). Server-side check: reject with a new error code `CANNOT_DELETE_PUBLISHED_CONTENT` if the item's status is not `draft`, or if `review_log` shows any prior `published` action for it, even if currently `unpublished`. Add this code to the shared error enum in `04-api-design.md`.

**Cascading behavior to handle explicitly, not leave implicit:**
- **Favorites pointing at now-unpublished content**: do not delete the favorite row. The Saved page must show a clear "no longer available" state for that item rather than erroring or silently dropping it — if the content is republished later, it should reappear correctly.
- **`card_related_overrides` pointing at an unpublished card**: the override row can remain in the database, but must be filtered out at query time by the same `status: published` check used everywhere else, so a manually pinned related card never links to a dead page.
- **`submissions.resulting_card_id`**: if that card is later unpublished, the submission's history should still show what it became — no change needed here, this is historical record, not a live link users click.

---

## 5. Admin UI

Add an "Unpublish" action to any published card/affirmation/quote/reflection (with a confirmation step, since it's a meaningful, user-visible action). Add a "Delete" action visible only on items still in `draft` — hidden or disabled with a clear explanation on anything that has ever been published, matching the server-side rule rather than just hiding it for tidiness.

---

## 6. Cursor Build Prompt

```markdown
# BUILD (Full-Stack): Unpublish and Delete
**Repo:** normal-app (backend and frontend, split into one PR each)
**Branch:** feature/unpublish-delete
**PR:** Split PRs (backend first, then frontend)
**Layer:** FastAPI admin routers (content, affirmations, quotes, reflections modules), Next.js admin UI, Saved-page handling
**Goal/Defect:** Implement unpublish and delete across all four publishable content types, closing a real gap where content could be created and published but never taken down, with status enums made consistent across all four types.

---

## ROLE
You are a Full-Stack engineer tasked with closing a real content-lifecycle gap. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/11-unpublish-delete.md` (this document) sections 2 through 5
2. `docs/03-data-modeling.md` (status enums on `cards`, `affirmations`, `quotes`, `reflections`, and the `review_log` table)
3. `docs/04-api-design.md` (existing PATCH endpoints per content type, error code enum)
4. Constraint: delete must be server-side blocked for anything with any `published` history, checked against `review_log`, not just current status. Constraint: unpublish must trigger cache revalidation and be excluded from every public-facing query path (list, detail, search, related-cards).

**HARD STOP 1.** Report: the exact `review_log` check you will run before permitting a delete, and the full list of public query paths you will confirm already exclude non-published content (or will fix if they don't). Wait for approval.

---

## METHOD

### Step 1. Schema fix and unpublish
Migrate `affirmations.status`, `quotes.status`, `reflections.status` to the three-value enum matching `cards`. Wire `status: unpublished` through the existing PATCH endpoints for all four types, triggering cache revalidation and a `review_log` entry (extending `entity_type` to cover all four if needed).

**Acceptance:** unpublishing a previously published item of each of the four types removes it from all public endpoints immediately, and a `review_log` entry records the action; the item remains fully intact in the database.

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Delete, with the published-history guard
Implement `DELETE` endpoints for all four types. Before deleting, check both current `status` and full `review_log` history for the item; reject with `CANNOT_DELETE_PUBLISHED_CONTENT` if it has ever been published, regardless of current status.

**Acceptance:** deleting a pure-draft item (never published) succeeds and fully removes it; attempting to delete anything with any publish history, current or past, is rejected with the correct error code and the item remains untouched.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Admin UI and cascading display fixes
Add the Unpublish action (with confirmation) and the Delete action (visible only on never-published drafts) to the admin panel for all four content types. Fix the Saved page to show a clear "no longer available" state for any favorited item that is now unpublished, rather than erroring. Confirm `card_related_overrides` correctly excludes unpublished cards from rendering.

**Acceptance:** an admin can unpublish and see it disappear from the public site immediately; the Delete option is correctly absent or disabled on anything ever published; a user with a favorited item that gets unpublished sees a clear, non-broken state on their Saved page; related cards never link to an unpublished card.

**HARD STOP 4.** Show the change. Wait for approval.

### Step 4. Verify
1. Publish a card, favorite it as a test user, unpublish it, confirm it disappears from all public views immediately and the Saved page shows a graceful "no longer available" state
2. Republish the same card, confirm it correctly reappears everywhere, including on the Saved page
3. Attempt to delete a card that was ever published (even if currently unpublished), confirm it is rejected with `CANNOT_DELETE_PUBLISHED_CONTENT`
4. Create a pure draft, never publish it, delete it, confirm full removal with no orphaned rows in `content_blocks` or `sources`

**Acceptance:** all four checks pass.

**HARD STOP 5.** Report the verification results. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Never permit deletion of anything with any publish history, regardless of its current status.
```
