# Feature Addendum — AI Research Pipelines (Content Drafting)

*Extends the Master Execution Plan and API Design docs with two parallel research-to-draft pipelines: one running through Cursor (using your existing subscription), one running through the admin dashboard itself (once you have a direct provider API key). Both produce draft content only — neither auto-publishes, per the site's existing no-auto-publish rule.*

---

## 0. Why the Cursor pipeline does not write directly to production

Supabase's own current guidance on MCP-connected agents is explicit: do not connect an MCP server to a production database, even with permission scoping — their documented safe pattern is read-only mode, or a separate development project with non-production data. Supabase's own hosted MCP server doesn't expose the kind of granular "insert-only, force status=draft" scoping that would make a direct write-to-production setup genuinely safe — its scoping options are project-level and read-only-or-not, nothing finer. Rather than build something that technically works but goes against the platform's own current security recommendation for a real, publicly-traded (if small) application, the Cursor pipeline below produces a **file**, not a direct database write — review and import happen through your existing, already-safe admin backend, which already enforces draft-only status through its own business logic.

---

## 1. Pipeline A — Cursor Agent (uses your existing subscription)

**Flow:**
1. You give a Cursor agent a research task (question + any constraints, using the prompt template in section 1.2)
2. The agent researches (web search, or source material you paste in) using whichever model you select for that session (Sonnet for routine questions, Opus for more complex or sensitive ones)
3. The agent writes a structured draft file into the repo, e.g. `content-drafts/is-it-normal-to-feel-anxious.json`, matching your `cards` schema exactly (question, brief, `content_blocks[]`, `sources[]`)
4. **No database write happens from Cursor.** You (or a small admin feature, section 1.3) import that file through the existing app backend, which creates a `status: draft` row — the same draft state any manually created card starts in
5. You review, verify every source, edit as needed, and publish through the exact same gate as always

### 1.1 Draft file schema

```json
{
  "question": "Is it normal to feel anxious for no reason?",
  "suggested_category": "mind-emotions",
  "suggested_tags": ["anxiety", "stress"],
  "brief": "Yes, it's normal sometimes. If it lasts months, feels unmanageable, or gets in the way of daily life, that's worth checking out.",
  "content_blocks": [
    { "type": "paragraph", "data": { "text": "..." } },
    {
      "type": "chart",
      "data": {
        "title": "Chart title",
        "x_label": "Category",
        "y_label": "%",
        "points": [
          { "label": "Series A", "value": 3 },
          { "label": "Series B", "value": 5 }
        ]
      }
    },
    {
      "type": "pie_chart",
      "data": {
        "title": "Pie chart title",
        "segments": [
          { "label": "Group A", "value": 43 },
          { "label": "Group B", "value": 57 }
        ]
      }
    },
    {
      "type": "table",
      "data": {
        "caption": "Optional caption",
        "headers": ["Column 1", "Column 2"],
        "rows": [["Cell 1", "Cell 2"]]
      }
    }
  ],
  "sources": [
    { "title": "...", "author_or_org": "...", "url": "...", "tier": "peer_reviewed", "published_date": "...", "accessed_date": "..." }
  ]
}
```

This maps onto the `cards`/`content_blocks`/`sources` shape from `03-data-modeling.md`. At import time, missing block `position` values are auto-assigned in file order. Chart and pie_chart blocks may also use a simplified `labels` + `values` pair (import converts them to `points` or `segments`).

### 1.2 Reusable Cursor agent prompt template

```markdown
# TASK: Research and Draft — "Is it normal to..." Card

## Question
[insert the question here]

## Role
You are researching a single "is it normal to..." question for a mental-health-adjacent, honesty-first platform aimed partly at teens. Your output is a DRAFT ONLY — it will be fact-checked and approved by a human before anything goes live. You are not publishing anything.

## Rules
1. Every source must be a real, currently accessible URL. Never invent a citation, a study, or a statistic. If you are not confident a source is real and says what you are citing it for, say so explicitly instead of including it.
2. Classify each source honestly by tier: `peer_reviewed` (published, peer-reviewed research), `expert_written` (credentialed professional writing, not peer-reviewed), or `self_report` (community/anecdotal, lowest confidence). Do not round up a source's tier to make the card look more credible than it is.
3. If the honest answer is "no, that's not actually typical," write that. Do not force a reassuring answer onto a question that doesn't deserve one.
4. **`brief` is the card-face teaser only**: 1-2 short sentences (about 25-40 words max). Give the honest headline answer in plain language. Put nuance, stats, and context in `content_blocks`, not in `brief`.
5. Keep tone neutral: not clinical and cold, not falsely cheerful.
6. If you include a chart, table, or pie_chart block, the underlying data must come from a real source in your sources list, not be invented or estimated by you.
7. Output the draft as a single JSON file at `content-drafts/<slug>.json`, matching the schema in `docs/10-ai-research-pipelines.md` section 1.1. Do not write to any database. Do not modify any other file.

## Output
Write the draft file, then stop and report: the sources you found, your confidence level in each one, and any part of the question you were unable to answer with a real source.
```

### 1.3 Admin "Import Draft" feature (small addition)

A lightweight admin feature that reads a `content-drafts/*.json` file (uploaded or selected from the repo) and creates a `cards` row (plus `content_blocks` and `sources`) with `status: draft` — going through no different a path than a card you typed by hand. No new database permissions, no new risk surface: this is just a structured alternative to manually retyping the JSON into the existing card form.

```markdown
# BUILD (Full-Stack): Draft Import Tool
**Repo:** normal-app (backend and frontend, split into one PR each)
**Branch:** feature/draft-import
**PR:** Split PRs (backend first, then frontend)
**Layer:** FastAPI admin endpoint, Next.js admin upload UI
**Goal/Defect:** Let the founder import a Cursor-agent-produced draft JSON file directly into the existing card-draft system, without any new database write path or permission surface.

---

## ROLE
You are a Full-Stack engineer tasked with building a convenience import tool that must not introduce any new way for content to reach `published` status. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/10-ai-research-pipelines.md` section 1.1 (draft file schema)
2. `docs/04-api-design.md` section 5 (existing `POST /v1/admin/cards` contract, which this reuses)
3. Constraint: this feature must call the existing `POST /v1/admin/cards` endpoint internally (or share its exact validation logic), not introduce a second, parallel path for creating cards. Constraint: imported cards must always land as `status: draft`, regardless of anything in the uploaded file.

**HARD STOP 1.** Report: your plan for validating the uploaded JSON against the schema before creating anything, and confirm you will force `status: draft` server-side regardless of the file's content. Wait for approval.

---

## METHOD

### Step 1. Backend import endpoint
Implement an admin-only endpoint that accepts the draft JSON, validates it against the schema (question, brief, content_blocks, sources all present and well-formed), and creates the card via the same logic `POST /v1/admin/cards` already uses, with `status` forced to `draft` regardless of input.

**Acceptance:** a valid draft file creates a correct draft card, editable and publishable through the normal admin flow afterward; a malformed file is rejected with a clear `VALIDATION_ERROR`, not a partial or corrupted row.

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Admin upload UI
Build a simple file-upload control in the admin panel that submits to the import endpoint and opens the resulting draft directly in the existing card editor for review.

**Acceptance:** uploading a valid draft file lands the founder directly in the familiar card editor, pre-filled, ready for source-by-source review, exactly as if she had typed it by hand.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Verify
1. Import a valid draft file, confirm it lands as `status: draft` and opens correctly in the editor
2. Attempt to import a file with `status: published` set inside it, confirm the system still forces `draft`
3. Attempt to import a malformed file, confirm a clear rejection with no partial data created
4. Confirm the imported card publishes correctly through the existing gate, including the clinical-review check if the category requires it

**Acceptance:** all four checks pass.

**HARD STOP 4.** Report the verification results. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Never allow this import path to create anything other than a `draft`-status card.
```

---

## 2. Pipeline B — Admin Dashboard, Direct API Key (for when you have one)

**Flow:** you type a question into the admin dashboard itself; the backend calls a real research API (Perplexity, Anthropic with web search, etc.) server-side, using a key that never reaches the browser; the result is stored as a job, and once complete, converts into a `status: draft` card the same way as Pipeline A's import step.

Because real research (especially anything resembling "deep research") can take minutes, this needs to be async, not a single blocking request — a synchronous call risks timing out well before the research finishes.

### 2.1 Data model addition

`research_jobs`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| question | text | |
| status | enum(`pending`,`complete`,`failed`) | |
| provider | text | which API/model was used, for later comparison |
| result | jsonb, nullable | the structured draft, same shape as section 1.1, once complete |
| error_message | text, nullable | safe, non-technical message if failed |
| requested_by | uuid FK → admin_users | |
| created_at / completed_at | timestamptz | |

### 2.2 API additions

- `POST /v1/admin/research-jobs` — starts a job, returns immediately with `{ "id": "...", "status": "pending" }`
- `GET /v1/admin/research-jobs/{id}` — poll for status/result
- `POST /v1/admin/research-jobs/{id}/create-draft` — converts a completed job's result into a `status: draft` card, reusing the exact same creation logic as the import tool in section 1.3

### 2.3 Cursor build prompt

```markdown
# BUILD (Backend): Admin Research Pipeline API
**Repo:** normal-app/backend
**Branch:** feature/research-pipeline-api
**PR:** One PR
**Layer:** FastAPI router (admin module), async job handling, external research API integration
**Goal/Defect:** Let the founder trigger AI-assisted research from the admin dashboard itself, using a real provider API key kept server-side only, producing a draft card through the existing draft-creation path.

---

## ROLE
You are a Backend engineer tasked with wiring an external research API into the admin dashboard as an async job, without ever exposing the API key to the frontend and without introducing any path to `published` status that bypasses the existing review flow. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/10-ai-research-pipelines.md` sections 2.1 and 2.2 (schema and endpoints)
2. `docs/04-api-design.md` section 5 (`POST /v1/admin/cards`, reused by the create-draft step)
3. Constraint: the research API key must be stored as a server-side environment variable, never sent to or readable by the frontend. Constraint: `POST .../create-draft` must produce a `status: draft` card through the same logic as any other draft creation, never `published`.

**HARD STOP 1.** Report: which provider/API you are integrating first, your plan for the async job execution (background task, queue, or equivalent given the current infrastructure), and confirmation the API key will be read only from a server-side environment variable. Wait for approval.

---

## METHOD

### Step 1. Job creation and async execution
Implement `POST /v1/admin/research-jobs`, creating a `pending` job and kicking off the actual API call in the background (not blocking the request). The background task calls the configured research API with the question, structures the result into the schema from section 1.1, and updates the job to `complete` with the result, or `failed` with a safe error message if something goes wrong.

**Acceptance:** submitting a question returns immediately with a `pending` job id; polling the job later shows `complete` with a well-formed result, or a clean `failed` state with no raw exception leaked to the response.

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Job polling and draft creation
Implement `GET /v1/admin/research-jobs/{id}` and `POST /v1/admin/research-jobs/{id}/create-draft`, the latter reusing the exact draft-creation logic from the import tool (section 1.3), forcing `status: draft` regardless of job content.

**Acceptance:** a completed job can be converted into a draft card, editable and publishable through the normal admin flow; attempting to create a draft from an incomplete or failed job is rejected clearly.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Verify
1. Submit a real question, confirm the job completes and produces a well-formed, schema-matching result
2. Confirm the API key never appears in any frontend-visible response, log, or network payload reaching the browser
3. Convert a completed job into a draft, confirm it is editable and goes through the same publish gate as any other card
4. Simulate a failed API call, confirm the job shows a clean `failed` status with a safe message, not a raw error

**Acceptance:** all four checks pass.

**HARD STOP 4.** Report the verification results. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Never let the API key reach the frontend, and never let this pipeline create anything other than a `draft`-status card.
```

---

## 3. Shared Safety Principles (apply to both pipelines)

- **No AI-produced source is trusted until a human clicks through and confirms it.** Current data on AI-generated citations is genuinely bad even from the best tools — fabricated references in published work are rising sharply, and even leading research tools tested still failed to cite correctly a meaningful fraction of the time. This isn't a one-time caution, it should be a literal per-source checkbox in the draft-review UI, not just a general reminder.
- **Neither pipeline can produce a `published` card.** Both are enforced, structurally, to only ever create `status: draft` — the founder's existing review-and-publish flow is the only path to the live site, unchanged.
- **Crisis-adjacent questions still require clinical review**, exactly as they do for any manually written card — neither pipeline bypasses the `requires_clinical_review` gate.
