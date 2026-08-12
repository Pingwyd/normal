# Data Modeling — "Is It Normal?" Platform

*Development Phase 3 of 11. Follows: System Design / Architecture. Precedes: API Design.*

Database: **Postgres (via Supabase)**. Extensions used: `pg_trgm` (trigram similarity, for duplicate-detection assist and search), `uuid-ossp` or `gen_random_uuid()` (primary keys).

Convention: all primary keys are `uuid`, all tables have `created_at` / `updated_at` timestamps unless noted otherwise.

---

## 1. Core Content

### `categories`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "Mind & Emotions" |
| slug | text, unique | URL-friendly |
| phase | int | launch phase (1–5, per roadmap) |
| requires_clinical_review | boolean | crisis-adjacent categories (Phase 5) flip this true |

### `tags`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text, unique | shared vocabulary across cards and affirmations |

### `cards`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| category_id | uuid FK → categories | |
| question | text | the "is it normal to..." question |
| brief | text | shown on card face, no click needed |
| slug | text, unique | for URLs |
| save_count | int, default 0 | denormalized counter for display speed (see §5) |
| status | enum(`draft`,`published`,`unpublished`) | |
| last_reviewed_by | uuid FK → admin_users, nullable | |
| last_reviewed_at | timestamptz, nullable | |
| next_review_due | timestamptz, nullable | computed as last_reviewed_at + 12 months, stored for query efficiency |
| requires_clinical_review | boolean | inherited default from category, overridable per card |
| published_at | timestamptz, nullable | |

Indexes: trigram index on `question` (search + duplicate-assist), btree on `category_id`, btree on `next_review_due` (for "cards due for review" admin queries).

### `card_tags` (junction)
| Field | Type |
|---|---|
| card_id | uuid FK → cards |
| tag_id | uuid FK → tags |

PK: (card_id, tag_id)

### `content_blocks`
Ordered, typed blocks composing a card's detail page.

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| card_id | uuid FK → cards | |
| position | int | ordering within the card |
| type | enum(`paragraph`,`chart`,`table`,`pie_chart`,`quote_callout`, ...) | extensible without migration |
| data | jsonb | shape depends on `type` |

Indexes: btree on (card_id, position).

### `sources`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| card_id | uuid FK → cards | |
| title | text | |
| author_or_org | text | |
| url | text | |
| tier | enum(`peer_reviewed`,`expert_written`,`self_report`) | |
| published_date | date, nullable | |
| accessed_date | date | |
| metadata | jsonb | tier-specific extras (DOI, journal, platform context, etc.) |

### `card_related_overrides`
Manual founder override for auto-computed related cards.

| Field | Type |
|---|---|
| card_id | uuid FK → cards |
| related_card_id | uuid FK → cards |
| position | int |

PK: (card_id, related_card_id). *Auto-suggestion (not stored) computed at query time from shared `category_id` / overlapping `tags`; overrides take precedence when present.*

---

## 2. Accounts

### `accounts`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| username | text, unique | |
| password_hash | text | |
| theme_preference | enum(`light`,`dark`,`system`), default `system` | |
| layout_version | enum(`classic`,`new`), default `classic` | |

*No email, no real name — per spec's no-PII stance.*

### `recovery_codes`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → accounts | |
| code_hash | text | |
| used_at | timestamptz, nullable | null = unused |

8 rows generated at signup; a new batch replaces old ones on regeneration.

### `favorites`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → accounts, **nullable** | null handled client-side pre-login (localStorage); server rows only exist once claimed |
| content_type | enum(`card`,`affirmation`,`quote`) | |
| content_id | uuid | polymorphic-by-convention; enforced in application layer since content lives in separate tables per type |
| created_at | timestamptz | |

Unique constraint: (account_id, content_type, content_id).

---

## 3. Submissions & Moderation

### `submissions`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| question_text | text | |
| status | enum(`submitted`,`in_review`,`rejected`,`drafted`,`published`) | |
| likely_duplicate_of | uuid FK → cards, nullable | flagged via trigram similarity, founder-confirmed |
| resulting_card_id | uuid FK → cards, nullable | set once published |
| handled_by | uuid FK → admin_users, nullable | |
| decision_notes | text, nullable | |

Indexes: trigram index on `question_text` (duplicate-detection against `cards.question`).

### `reported_issues`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| card_id | uuid FK → cards | |
| description | text | |
| status | enum(`open`,`in_review`,`resolved`,`dismissed`) | |
| handled_by | uuid FK → admin_users, nullable | |
| resolution_notes | text, nullable | |

---

## 4. Daily Content

### `affirmations`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| text | text | first-person statement |
| status | enum(`draft`,`published`) | founder-reviewed only, never auto-generated live |

### `affirmation_tags` (junction)
| Field | Type |
|---|---|
| affirmation_id | uuid FK → affirmations |
| tag_id | uuid FK → tags |

PK: (affirmation_id, tag_id). *Shares the same `tags` vocabulary as cards.*

### `quotes`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| text | text | third-person |
| attributed_to | text | real person's name |
| source_url | text, nullable | verification link, given misattribution risk |
| status | enum(`draft`,`published`) | |

---

## 5. Engagement

### `card_likes`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| card_id | uuid FK → cards | |
| account_id | uuid FK → accounts, nullable | nullable for anonymous likes |
| device_identifier | text, nullable | fallback idempotency key for anonymous likes (prevents trivial repeat-liking) |
| created_at | timestamptz | |

`cards.save_count` (favorites count) and a like count are denormalized/cached onto `cards` for fast card-feed rendering (avoids a COUNT join on every feed load); source of truth remains `favorites` / `card_likes`, counters updated on write. This is the one other deliberate, justified denormalization beyond `review_log` — read-path performance on a high-traffic public feed, with counts recomputable from source tables if they ever drift.

---

## 6. Admin & Audit

### `admin_users`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| auth_id | uuid | links to Supabase Auth identity |
| role | enum(`founder`,`clinical_reviewer`) | |
| display_name | text | used for public "clinically reviewed by [name]" credit |

### `review_log`
Insert-only audit trail. Admin-access only (Supabase RLS scoped to `admin_users`; never exposed on public API).

| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| entity_type | enum(`card`,`submission`,`reported_issue`) | |
| entity_id | uuid | |
| action | enum(`created`,`edited`,`approved`,`published`,`unpublished`,`duplicate_merged`,`reviewed`, ...) | |
| performed_by | uuid FK → admin_users | |
| performed_by_name_snapshot | text | **deliberately denormalized** — preserves historical accuracy even if `admin_users.display_name` later changes |
| notes | text, nullable | |
| timestamp | timestamptz | |

---

## 7. Notifications & Preferences

### `newsletter_subscriptions`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text, unique | |
| enabled | boolean, default true | toggle, not delete-on-unsubscribe |
| unsubscribe_token | text, unique | for one-click email unsubscribe links |

*Deliberately not linked to `accounts` — per spec, fully decoupled.*

### `push_subscriptions`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| account_id | uuid FK → accounts, nullable | **reassignable** — see note below |
| endpoint | text, unique | browser push subscription endpoint; one active subscription per browser per site |
| keys | jsonb | push encryption keys |
| enabled | boolean, default true | |

**Reassignment logic** (application-layer, not just schema): on enabling push, check for an existing row with this `endpoint`. If found, update its `account_id` to the currently logged-in account (or null, if anonymous) rather than inserting a duplicate — reflects the real constraint that a browser has exactly one active push registration per site.

---

## 8. Normalization Summary

- **1NF**: all multi-valued attributes (tags, sources, content blocks) live in their own tables/junctions rather than repeating groups or array fields on a parent row.
- **2NF**: junction tables (`card_tags`, `affirmation_tags`, `card_related_overrides`) carry no attributes that depend on only part of their composite key.
- **3NF**: lookups (category, tags, admin identity) are referenced by FK rather than copied, avoiding update anomalies.
- **Deliberate exceptions** (documented, not oversights): `review_log.performed_by_name_snapshot` (audit history must stay accurate even if current data changes) and `cards.save_count` / like counts (read-path performance cache on a high-traffic public feed, recomputable from source tables).

---

## 9. Deferred to Next Phase (API Design)

- Exact endpoint shapes for reading/writing each entity
- Pagination/filtering contracts for the card feed and search
- Versioning strategy
- Request/response schemas for the merge-on-login flow (favorites, push, theme/layout preference)
