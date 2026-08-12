# App Concept: "Is It Normal?" Platform (working name: "normal.")

## Core Idea
A website/web app built around a database of things that are genuinely "normal" to go through in life — emotional, physical, relational, and life-stage experiences — so people searching "is it normal to..." find accurate, sourced reassurance instead of misinformation, forums, or nothing at all. The founder is personally passionate about this (not purely commercial), and wants to publicize/advertise it themselves.

Monetization: non-obtrusive, actively moderated ads (never predatory categories like crash diets/supplements), to cover running costs.

---

## Audience
- Primary: teens / young adults
- Secondary (expand later): general adult population, new parents, other life-stage groups
- No age-verification gate — instead, content/tone/ad decisions assume the youngest plausible reader could be on any page at any time.

## Tone
Neutral — not clinical/cold, not saccharine/toxic-positivity. Honest above all: if something searched isn't actually typical, the content says so rather than forcing false reassurance ("this isn't normal — here's what to do" is an acceptable, expected answer type).

---

## Content Model

### Structure (per topic)
1. **Brief** — short, immediate reassurance/answer, shown on the card itself (no click needed).
2. **Detail page** (click "more details") — fuller explanation + linked sources.

### Sourcing / credibility
- Sources are tiered/labeled (e.g. peer-reviewed, expert-written, self-report/community-sourced) so trust level is visible at a glance.
- "Last reviewed" date shown per card.
- **Review cadence**: every 12 months per card, plus immediate re-check if new conflicting research appears or a user flags an issue via a lightweight "report an issue" link on detail pages.
- Content-integrity rule: never force a "you're not alone" framing onto something that genuinely isn't typical — honesty over brand consistency.

### Who writes content
- Founder + AI-assisted drafting, but **founder manually fact-checks and approves every single article before publishing** (no auto-publish).
- Exception: crisis-adjacent topics (self-harm, eating disorders, abuse) should NOT be AI-first-drafted — hand-written or reviewed by someone with real clinical training before publishing.
- A counsellor/therapist known to the founder is collaborating as a **clinical advisor/reviewer** (credited publicly, e.g. "clinically reviewed by [name]"). She may also list this work on her own professional site/profile — normal, low-risk, and adds legitimacy to both parties.
  - **Important boundary**: the site should NOT funnel users specifically to her as "the therapist to contact" — that creates impartiality, liability, and scale problems. Instead, crisis/resource links point to general, appropriate services (hotlines, directories, "how to find a therapist" guidance). She's a disclosed advisor, not a personal referral engine — unless a user personally/explicitly asks for a referral outside the platform.

### Category roadmap (phased)
**Phase 1 — Launch: Mind & Emotions** (minus acute-crisis topics)
- Anxiety, stress, overthinking
- Mood swings, feeling "off," numbness
- Motivation, burnout, procrastination
- Loneliness, feeling different/left out
- Identity, self-esteem, comparison

**Phase 2 — Body & Physical Health**
- Puberty changes, body image
- Sleep, energy, fatigue
- Appetite/eating patterns (non-crisis)
- Physical anxiety symptoms

**Phase 3 — Relationships & Social**
- Friendship changes/fallouts, family conflict, romantic relationships/breakups, social media comparison/FOMO, peer pressure

**Phase 4 — Life Transitions**
- School/exam stress, first jobs/career uncertainty, moving/changing schools, identity shifts

**Phase 5 — Sensitive/Crisis-adjacent** (only after review process is solid — target: after ~20-30 "safe" articles live and workflow tested)
- Self-harm thoughts (clear normal-vs-crisis distinction), disordered eating, grief/loss, abuse/unsafe situations
- Every page in this category gets a visible resource block (crisis line etc.) near the top, not buried.

---

## Site Structure & Features

### Discovery
- Search bar (pinned/fallback)
- **Primary browsing = card-based feed**, filterable by category chips at top
- Cards show: category tag, question, short brief answer, source count/"reviewed" tag, save count, share icon
- Clicking a card → dedicated detail page (full explanation + sources)
- Search-as-you-type autocomplete suggestions (helps people who don't know how to phrase their worry)
- "Related cards" shown at bottom of each detail page

### Accounts
- **Optional accounts, no personal data required.** Default: favorites saved locally (device-based). Optional lightweight account (unique username + self-chosen password, no email/real name required) for cross-device sync — a password is required so accounts can't be accessed by simply guessing/typing someone else's username. Since there's no email on file, password recovery can't work the usual way; at signup the system generates **8 single-use recovery codes** (shown once, downloadable as a .txt file, similar to Google/GitHub-style backup codes). Only hashed versions are stored server-side. Losing a password is recovered by entering one unused code (which is then burned); users are nudged to regenerate a fresh set once they're down to their last code or two. If all codes and the password are lost, the account is unrecoverable by design — this trade-off (privacy over guaranteed recovery) should be stated plainly to users at signup.
- Email is only collected specifically for the affirmations newsletter opt-in (separate, minimal, unsubscribe-able) — not tied to a full account/login.

### User-submitted questions
- Users can suggest new "is it normal to..." questions.
- Flow: submission goes into a **private queue** → founder reviews the question text itself first (reject/edit if inappropriate or crisis-level) → answer is drafted/approved → question + answer go live together (never auto-posted).
- **Duplicate handling**: AI (embedding/semantic similarity) flags likely duplicates against existing cards during review; founder confirms/merges — AI assists, doesn't auto-merge.

### Reactions / social proof
- Simple, lightweight only: a **like button only** (no dislike) at the bottom of each card/page, which drives the "X people found this useful" counter. No open comments/community threads (avoids heavy moderation burden, especially given sensitive topics + minors). A dislike button is deliberately excluded — on personal/vulnerable topics, visible negative counts risk reading as disagreement with someone's experience rather than a content-quality signal. Actual content problems (outdated sourcing, factual errors) are instead handled through the separate, less prominent "report an issue" link on detail pages — not a public dislike count.

### Daily Affirmations
- Swipeable card format (Tinder-style), no login required to view on-site — kept low-friction since it's the reason to return daily.
- Personalization by mood/category (e.g. job stress, motivation, relationships).
- Save/favorite action (tap or swipe gesture) tied into the same favorites system as main content.
- Shareable to other platforms (share button exports as clean image / link with preview) — doubles as free social distribution.
- Optional email subscription for daily delivery (email only, no full account needed).
- Future (not at launch, due to cost): SMS/WhatsApp delivery — deferred until email demand is validated, since both incur per-message costs.
- Content discipline: reviewed by founder like everything else — never unreviewed/auto-generated, to avoid toxic-positivity phrasing slipping through.

### Daily Quotes (separate section)
- Same swipeable/save/share mechanic as affirmations, but distinct in kind: quotes are third-person, attributed to real people (vs. affirmations = first-person "I am/I can" statements).
- Requires the same source-verification discipline as main content — must avoid misattributed/fake quotes (common problem with quote-aggregator content).

### Push notifications
- Browser push (web push API) for daily affirmations/quotes — no native app needed. Opt-in, easy to disable.

### Onboarding
- Brief first-time-visitor onboarding at launch (not deferred) — sets expectations: informational only, not therapy/diagnosis, what the site is and isn't.

---

## Ads & Monetization
- Ads: non-obtrusive, actively moderated, blocklist for predatory/sensitive-exploiting categories (health scams, diet/pharma near sensitive topics, etc.)
- **Placement**: browse/category pages only — never on detail pages (keeps sensitive content ad-free).
- Need to check ad network content policies (e.g. Google AdSense's rules on sensitive/mental-health content) before committing to a network, since this could restrict eligibility.
- Secondary revenue: simple donation/"support us" option (Ko-fi/Buy Me a Coffee style) — added a bit after launch once the site has proven value, not from day one. Soft, optional, non-intrusive — consistent with the ad philosophy.

---

## Platform & Technical Notes
- **Web app only at launch** (mobile-responsive) — no native app for now; avoids app-store review overhead, which is stricter for mental-health content aimed at minors.
- **Analytics**: privacy-first, cookieless tool (e.g. Plausible/Fathom) instead of Google Analytics — consistent with the no-personal-data stance, avoids cookie-consent complexity.
- **Language**: English-only at launch, but store card content in cleanly separated text fields (not baked into layout/images) so translation is possible later without rebuilding.
- **Accessibility**: built in from the start — color contrast, alt text, readable font sizes, keyboard/screen-reader navigation. Not an afterthought.

---

## Legal
- Clear "not medical/professional advice" disclaimer.
- Basic Terms of Service + Privacy Policy required before public launch (even simple versions) — needed regardless of anonymous-first design, since the site runs ads and basic analytics.
- Consider brief legal consultation specifically around crisis-content liability/disclaimer language (not the whole business).
- **Not yet drafted** — founder deferred this, but agreed it must exist before the site goes live publicly, not after.

---

## Competitive Landscape (researched)
Existing related things: *This Is Normal* (podcast, not a full app/site), *Teen Hope* (teens-for-teens site/coping tools), *Luna* (closest overlap — anonymous Q&A with medically reviewed answers, but positioned as parent-facing coaching app), *MindShift*/*Finch* (narrower, anxiety/gamified self-care apps).

**Differentiation**: nobody in this space combines (a) an open, publicly browsable card database, (b) swipeable/shareable social-native format, and (c) general population + teen focus rather than teen-only, gated apps. The shareable card format built for TikTok/Instagram-style discovery is the biggest identified gap/edge.

---

## Launch Strategy
- **Primary channel**: TikTok/Instagram organic content — reuse card content directly as social posts/carousels (cards are near-identical to short-form social assets already).
- **SEO**: build in parallel as a long-term compounding channel (slower to pay off, but valuable once enough cards are indexed).
- **Success metrics to track early**: prioritize **cards saved/shared** over raw pageviews/visitors — better signal of whether content actually resonates.
- **True v1 scope (to avoid over-building before launch)**: core cards + search + browse only. Accounts, affirmations, quotes, push notifications, and submissions are v1.1/v2, added after the core experience is validated.
- **Recommended card volume before public launch**: ~40-50 cards, spread across the first 2-3 categories (e.g. 15-20 Mind & Emotions, 15-20 Body & Health, ~10 Relationships) rather than launching too thin or over-perfecting one category alone.

---

## Visual Design Direction (mockup built)
A working interactive HTML mockup was created reflecting this direction — file: `normal-mockup.html`.

- **Palette**: warm quiet paper background (#F2F1EC), deep pine-ink text (#202B26), muted deep sage as primary (#4B6B5E / #33473D), soft peach/warm accent (#E8A97A), periwinkle as a secondary pop (#7086C9). Deliberately avoided generic "AI design" defaults (cream+terracotta serif, dark+neon, broadsheet).
- **Typography**: Fraunces (serif, display/headlines — warm, human, handwritten-note feel) + Inter (body, clean/readable) + IBM Plex Mono (small labels/tags — used deliberately for source citations and category tags to reinforce a "backed by data/verified" feel).
- **Hero**: live-typing animation cycling through real example worries ("is it normal to feel anxious for no reason?"), fading into a calm one-line reassurance — demonstrates the core experience rather than a generic banner.
- **Cards**: 3-column grid on desktop (collapses to single column on mobile), each showing category tag, question, short brief, source count + "reviewed" label, save count, share icon.
- **Ad slot**: placed inline within the browse grid as its own full-width row, clearly separated from card content — never inside the detail pages.
- **Affirmation deck**: stacked, swipeable card UI — tapping the top card slides it away to reveal the next, demonstrating the Tinder-style interaction.
- **Footer**: separate, visible crisis-resource strip (not buried in normal footer links); credits the clinical reviewer; links to About, sourcing methodology, privacy, disclaimer, and question submission.

---

## Open / Not Yet Decided
- Final site name/domain (deferred — "normal." used as a placeholder in the mockup)
- Legal documents (disclaimer, privacy policy, ToS) — not yet drafted
- Ad network selection (pending policy check for sensitive-content eligibility)
- Exact visual polish/animation refinement beyond the initial mockup direction
