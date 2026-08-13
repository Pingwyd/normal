# Visual Design Implementation Prompts — "Normal." Platform

*Derived from `normal-mockup.html` (the working interactive mockup referenced in `app-concept-spec.md`'s Visual Design Direction section). These prompts apply that mockup's design system and layout patterns to the real Next.js implementation from the earlier build prompts, without discarding functionality the mockup doesn't depict.*

**Before running these**: copy `normal-mockup.html` into the repo (e.g. `docs/design/normal-mockup.html`) so Cursor can open and reference it directly rather than working from a description alone.

**Standing rule across every prompt below**: the mockup shows a subset of the real product (browse page, hero, one affirmation deck). It does not show the detail page, admin section, search autocomplete, quotes, or anything account/settings/saved-related. Where a prompt below asks Cursor to place something the mockup doesn't depict, Cursor must not delete or hide any existing functionality to make room — it must find placement consistent with standard UI/UX conventions (e.g. an account icon/menu in the nav, not a removed nav item) and explicitly report where it placed each thing in its Hard Stop report.

---

## PHASE SUMMARY

| Prompt | Covers |
|---|---|
| A | Design tokens, fonts, global shell (nav + footer), placement of features absent from the mockup |
| B | Hero section, typing animation, search bar + autocomplete, category chips |
| C | Card grid system, section-label pattern, ad slot, card component reuse |
| D | Swipeable deck component for Affirmations and Quotes |
| E | Detail page and admin visual consistency, extending the system to what the mockup doesn't show |

---

# PROMPT A

```markdown
# STYLE (Frontend): Design Tokens, Fonts, and Global Shell
**Repo:** normal-app/frontend
**Branch:** feature/design-system-foundation
**PR:** One PR
**Layer:** Global CSS/theme config, Next.js layout (Nav, Footer)
**Goal/Defect:** Establish the color tokens, typography, and global nav/footer shell defined in `normal-mockup.html`, and find correct placement for existing nav-adjacent features (Saved, account/login, settings, admin) that the mockup does not depict.

---

## ROLE
You are a Frontend engineer tasked with applying an approved visual design direction to the existing, already-functional site shell. You are not building new functionality here, you are re-skinning and re-laying-out what already exists. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/design/normal-mockup.html` — the approved visual direction, read the full file including the `<style>` block, do not guess at values
2. The existing Next.js implementation from prior prompts (Nav, Footer, and any account/settings/saved/login entry points already built)
3. `app-concept-spec.md` (Visual Design Direction section) for the stated rationale behind the palette and type choices
4. Constraint: do not delete, hide, or silently drop any existing nav or footer functionality (Saved page, login/account, settings, admin entry point if one exists in nav) that is not shown in the mockup. Find a placement for each using standard UI/UX conventions.

**HARD STOP 1.** Report: the exact color tokens, font families, and font weights you extracted from the mockup's `:root` and `<style>` block, and a specific placement plan for each existing feature not shown in the mockup (e.g. "account/login goes behind a user icon at the top right, replacing the mockup's placeholder 'Save favorites' button, which becomes a dropdown containing Saved, Account, Settings, Log out"). Wait for approval before writing any code.

---

## METHOD

### Step 1. Design tokens and typography
Implement the mockup's CSS custom properties (`--bg`, `--card`, `--ink`, `--ink-soft`, `--sage`, `--sage-deep`, `--peach`, `--periwinkle`, `--line`) as the project's global theme tokens (Tailwind theme extension or CSS variables, matching whatever theming approach the frontend already uses). Load Fraunces (headings), Inter (body), and IBM Plex Mono (labels/tags/source counts/timestamps) exactly as the mockup does, applying them via the same role-based pattern (serif for h1-h3, sans for body, mono for small metadata labels).

**Acceptance:** a visual diff of any existing page against the mockup's palette and type shows matching colors and fonts; no hardcoded color or font-family values remain outside the token system.

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Nav and Footer
Rebuild the nav to match the mockup's sticky, blurred, bordered treatment, with the "normal." logo (peach period) on the left and nav links in the center. Replace the mockup's placeholder single "Save favorites" button with the placement plan agreed in Hard Stop 1 — this is where existing features (Saved, account/login, settings, and, if it currently lives in the public nav, a route to the admin login) get integrated, not discarded. Rebuild the footer to match the mockup's structure: the crisis-resource strip as its own visually prominent element above the standard footer links, followed by the link row (About, sourcing methodology, clinical reviewer credit, Privacy, Disclaimer, Submit a question) and the disclaimer line.

**Acceptance:** nav and footer visually match the mockup's structure and style; every existing nav/footer feature (Saved, account, settings, submit-a-question, admin entry if applicable) is still reachable, and its exact placement is reported clearly; the crisis strip is visually distinct and prominent, not buried among ordinary footer links.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Verify
1. Compare the rebuilt nav and footer side by side against the mockup, confirm visual alignment on color, spacing, and typography
2. Click through every nav and footer item, confirm nothing that existed before this change is now unreachable
3. Confirm the crisis strip renders correctly and prominently on every page that includes the footer, not only the homepage
4. Confirm the mobile/responsive behavior of the nav (per the mockup's `@media(max-width:820px)` breakpoint logic, adapted for the real component) does not break or hide any feature

**Acceptance:** all four checks pass.

**HARD STOP 4.** Report the verification results, including the final placement of every feature not shown in the mockup. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Do not delete or hide existing functionality to make the page match the mockup more closely. Re-home it instead, and say exactly where.
```

---

# PROMPT B

```markdown
# STYLE (Frontend): Hero, Search, Autocomplete, and Category Chips
**Repo:** normal-app/frontend
**Branch:** feature/hero-search-chips
**PR:** One PR
**Layer:** Next.js homepage hero component, search bar component, category chip filters
**Goal/Defect:** Apply the mockup's hero section (including the typing animation), search bar, and category chip row to the real homepage, and extend the search bar to support the search-as-you-type autocomplete feature the mockup does not depict.

---

## ROLE
You are a Frontend engineer tasked with restyling the homepage hero and search entry point, and extending it with a real feature the mockup only implies. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/design/normal-mockup.html` — hero markup, `.searchbar` and `.chips` styles, and the typing/erasing animation script at the bottom of the file
2. The existing browse/feed page implementation (search and filter logic already wired to `GET /v1/cards` with URL-driven query state, per an earlier prompt)
3. `app-concept-spec.md` (Discovery section) for the autocomplete requirement: "Search-as-you-type autocomplete suggestions (helps people who don't know how to phrase their worry)"
4. Constraint: the existing URL-query-param-driven search/filter behavior must not be broken or replaced by this restyle. This prompt changes appearance and adds autocomplete, not the underlying search mechanism.

**HARD STOP 1.** Report: your plan for sourcing the hero's cycling example prompts (e.g. a fixed rotating set of real, representative "is it normal to..." questions rather than the mockup's placeholder array), and your plan for where autocomplete suggestions will come from (a lightweight endpoint or client-side filtering against already-loaded card questions) and how the dropdown will be styled consistent with the mockup's search bar. Wait for approval.

---

## METHOD

### Step 1. Hero section and typing animation
Rebuild the hero to match the mockup: eyebrow label, large serif headline with the animated typed/erased cycling phrase, the fading reassurance line beneath it, matching the mockup's timing and easing. Replace the mockup's placeholder prompt array with real example questions (confirm the specific set with the user if not obvious from existing seeded content).

**Acceptance:** the hero visually and behaviorally matches the mockup (typing speed, erase speed, pause duration, fade-in of the reassurance line); the animation does not block or delay the page's interactivity (search bar and chips are usable immediately, not gated behind the animation finishing).

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Search bar with autocomplete, and category chips
Restyle the search bar to match the mockup, and add a dropdown of live suggestions as the user types, styled consistent with the card/search-bar visual language (not a generic unstyled browser dropdown). Restyle the category chips to match the mockup's pill/active-state treatment, keeping them wired to the existing filter logic.

**Acceptance:** typing in the search bar shows relevant suggestions without a jarring delay; selecting a suggestion or pressing enter correctly updates the URL-driven search state exactly as it did before this restyle; chips visually match the mockup and correctly reflect active/inactive state tied to the real category filter.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Verify
1. Confirm the hero animation matches the mockup's pacing and does not cause layout shift or block interaction
2. Type a partial query and confirm relevant autocomplete suggestions appear, styled consistently with the rest of the page
3. Confirm selecting a chip still correctly filters the real card grid and updates the URL, with no regression from the pre-restyle behavior
4. Test on a narrow viewport and confirm the hero, search bar, and chips all remain usable per the mockup's mobile breakpoint intent

**Acceptance:** all four checks pass.

**HARD STOP 4.** Report the verification results. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Do not weaken or replace the existing URL-driven search/filter mechanism while restyling it.
```

---

# PROMPT C

```markdown
# STYLE (Frontend): Card Grid, Section Labels, and Ad Slot
**Repo:** normal-app/frontend
**Branch:** feature/card-grid-styling
**PR:** One PR
**Layer:** Next.js card component, browse grid layout, ad slot component
**Goal/Defect:** Apply the mockup's card anatomy, 3-column responsive grid, section-label pattern, and inline ad-slot placement to the real browse page.

---

## ROLE
You are a Frontend engineer tasked with restyling the core content-browsing experience to match an approved mockup, without changing what data is shown or how it is fetched. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/design/normal-mockup.html` — `.grid`, `.card`, `.card-foot`, `.actions`, `.ad-slot`, and `.section-label` styles and markup structure
2. The existing browse page implementation (card data already fetched from `GET /v1/cards`, likes already wired per the toggle pattern from an earlier prompt)
3. `docs/02-system-design.md` section on ad placement (browse/category pages only, never detail pages) and `app-concept-spec.md`'s Ads & Monetization section
4. Constraint: the ad slot's placement rule (browse pages only, never detail pages, clearly visually separated from content) must be preserved exactly, matching both the mockup's visual treatment and the written policy.

**HARD STOP 1.** Report: your plan for how often an ad-slot row will be inserted into the grid (the mockup places one after the third card as an example, confirm whether that cadence is intentional or illustrative), and confirm the ad slot will remain a placeholder component (no real ad network wired yet, per the deferred ad-network decision) styled to match the mockup. Wait for approval.

---

## METHOD

### Step 1. Card component and grid layout
Rebuild the card component to match the mockup's anatomy exactly: mono category tag, serif question as heading, sans-serif brief answer, footer row with mono source-count/reviewed label on one side and save (like) + share actions on the other, including the hover lift/shadow treatment. Rebuild the grid to be 3 columns on desktop, collapsing to 1 column on mobile per the mockup's breakpoint.

**Acceptance:** cards visually match the mockup exactly (spacing, type treatment, hover behavior); the existing like-toggle and favorite/save functionality already wired in earlier prompts continues to work correctly through the restyled buttons, with no functional regression.

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Section-label pattern and ad slot
Build the reusable section-label component (serif heading + right-aligned mono metadata, e.g. a live card count) matching the mockup, and apply it above the browse grid. Insert the ad-slot component at the agreed cadence, styled per the mockup (dashed border, "SPONSORED" mono label, clearly visually separated from real cards), confirmed as browse-page-only.

**Acceptance:** the section label correctly displays a real, live count (not a hardcoded number like the mockup's placeholder); the ad slot renders at the correct cadence on browse/category pages and does not appear anywhere on detail pages.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Verify
1. Confirm the restyled grid and cards render correctly against real seeded card data, including cards with long questions/briefs (test text overflow/wrapping, since the mockup only shows short examples)
2. Confirm existing like/save interactions still function correctly through the restyled buttons
3. Confirm the ad slot never renders on a detail page and renders correctly at the agreed cadence on browse pages
4. Test the responsive collapse to single column on a narrow viewport

**Acceptance:** all four checks pass.

**HARD STOP 4.** Report the verification results. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Do not weaken the ad-placement policy (browse-only, never detail pages) while restyling it.
```

---

# PROMPT D

```markdown
# STYLE (Frontend): Swipeable Deck for Affirmations and Quotes
**Repo:** normal-app/frontend
**Branch:** feature/deck-styling
**PR:** One PR
**Layer:** Next.js swipeable-card deck component (shared between Affirmations and Quotes)
**Goal/Defect:** Apply the mockup's dark-panel affirmation deck design to the real, already-functional swipeable deck component, and extend the same treatment to Quotes, which the mockup does not show as a separate section.

---

## ROLE
You are a Frontend engineer tasked with restyling an already-functional interactive component (the swipeable deck built in an earlier prompt) to match an approved visual direction, and extending that direction consistently to a second content type not depicted in the mockup. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/design/normal-mockup.html` — `.affirm-section`, `.deck`, `.aff-card` styles, and the deck-rendering/tap-to-advance script at the bottom of the file
2. The existing swipeable deck implementation from the Affirmations & Quotes frontend prompt (already wired to real data, favorites, and share export)
3. `app-concept-spec.md` (Daily Affirmations and Daily Quotes sections) confirming quotes are a distinct section from affirmations, not merged
4. Constraint: do not merge affirmations and quotes into one deck or one section. They remain distinct per the earlier architectural decision (separate tables, separate resources). This prompt shares a visual component between them, it does not merge the content.

**HARD STOP 1.** Report: your plan for adapting the mockup's dark sage panel treatment to a second, distinct Quotes section (e.g. same panel styling with a different accent detail or icon to visually distinguish first-person affirmations from third-person attributed quotes, since the mockup gives no guidance on this distinction), and confirm the existing tap/swipe, save, and share behavior will be preserved, not rebuilt from scratch. Wait for approval.

---

## METHOD

### Step 1. Restyle the affirmations deck
Rebuild the affirmations panel and stacked-card deck to match the mockup exactly: dark sage-deep background panel, copy on one side with the eyebrow/heading/description/subscribe button, the stacked deck with rotation/scale/offset per card matching the mockup's depth effect, and the tap-to-advance interaction with the slide-and-fade-out animation. Preserve all existing functionality (save ties into the real favorites system, share produces a real exported image/link).

**Acceptance:** the deck visually and behaviorally matches the mockup (stack depth, rotation angles, tap-to-advance animation timing); save and share continue to work exactly as before this restyle, with no functional regression.

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Apply consistent treatment to Quotes
Build the equivalent section for Quotes using the same deck component and panel styling, with the distinguishing detail agreed in Hard Stop 1, and correct copy reflecting quotes are third-person and attributed (matching the actual `attributed_to` field already in the data model). Place this section using standard UI/UX placement (e.g. immediately following or adjacent to the Affirmations section, or reachable via its own nav entry, confirm with the user if the surrounding page structure is ambiguous).

**Acceptance:** the Quotes section is visually consistent with the Affirmations section while remaining clearly distinguishable as a separate feature; each quote card correctly displays its attribution; save and share work correctly for quotes through the same underlying mechanisms as affirmations.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Verify
1. Confirm the restyled affirmations deck matches the mockup's visual and interaction details closely
2. Swipe/tap through both the affirmations and quotes decks, confirm save and share both work correctly and tie into the same underlying favorites system verified in earlier prompts
3. Confirm quotes visually read as distinct from affirmations (not confusable as the same content type) while sharing the same component family
4. Test on a narrow viewport, confirming the deck remains usable and the stacked-card effect degrades gracefully

**Acceptance:** all four checks pass.

**HARD STOP 4.** Report the verification results, including where the Quotes section was ultimately placed in the page/nav structure. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Do not merge affirmations and quotes into a single resource or section while sharing their visual component.
```

---

# PROMPT E

```markdown
# STYLE (Frontend): Detail Page and Admin Visual Consistency
**Repo:** normal-app/frontend
**Branch:** feature/detail-admin-styling
**PR:** One PR
**Layer:** Next.js card detail page, admin route group
**Goal/Defect:** Extend the design system established in Prompts A through D to the card detail page and the admin section, neither of which the mockup depicts, while keeping the admin section's design secondary to function.

---

## ROLE
You are a Frontend engineer tasked with extending an approved design system to parts of the product the source mockup does not show, using the mockup's established tokens and patterns as the basis rather than inventing a new direction. You make no decisions silently. Every step ends in a HARD STOP where you must report your findings or progress and wait for explicit user confirmation before proceeding.

---

## SOURCE OF TRUTH (read in order)
1. `docs/design/normal-mockup.html` — the only available direct visual reference, used here for tone/tokens even though it has no detail-page or admin markup
2. The existing card detail page implementation (content-block renderer, sources, related cards, report-issue link, already functional from earlier prompts)
3. The existing admin implementation (card CRUD, content-block editor, review queues, already functional from earlier prompts)
4. Constraint: the admin section's priority is clarity and function for a single daily user (the founder), not visual polish matching the public site exactly. Apply the same color/type tokens for brand consistency, but do not force admin-specific UI (forms, tables, editors) into the public site's card/grid visual metaphor where it does not fit.

**HARD STOP 1.** Report: your plan for how the detail page will extend the mockup's card visual language (e.g. the same tag/mono-label treatment for source tiers, the same type hierarchy for the question-as-heading pattern), and your plan for how much of the design system will apply to the admin section versus being simplified for functional clarity. Wait for approval.

---

## METHOD

### Step 1. Detail page
Apply the established tokens and typography to the card detail page: the question as a serif heading matching the card's heading treatment, the content-block renderer styled consistently with the card/section visual language (mono labels for source tiers, clear typographic hierarchy for paragraph/chart/table/quote-callout blocks), the sources list with tier labels styled consistently with the mockup's mono-label pattern, the related-cards section reusing the actual card component from Prompt C, and the report-an-issue link styled as a clearly secondary, low-emphasis action consistent with the mockup's overall restrained tone.

**Acceptance:** the detail page reads as visually continuous with the browse page and card grid, using the same tokens, type hierarchy, and mono-label conventions; all existing detail-page functionality (content blocks, sources, related cards, report-issue) continues to work with no regression.

**HARD STOP 2.** Show the change. Wait for approval.

### Step 2. Admin visual consistency
Apply the core tokens (colors, typography) to the admin section for brand consistency, without importing the public site's card-grid metaphor into functional admin UI like the content-block editor, review queues, or forms. Use the same type pairing (Fraunces for headings, Inter for body/UI, IBM Plex Mono for labels/metadata like status tags or timestamps) but prioritize table/list/form clarity over decorative treatment.

**Acceptance:** the admin section is recognizably part of the same product (colors, fonts consistent) without being a literal reskin of the public site's card aesthetic; forms, tables, and editors remain functionally clear and are not compromised for visual consistency.

**HARD STOP 3.** Show the change. Wait for approval.

### Step 3. Verify
1. Navigate from a browse card to its detail page, confirm the visual transition feels continuous, not like a different product
2. Confirm every existing detail-page feature (content blocks of every type, sources, related cards, report-issue link) still renders and functions correctly
3. Navigate through the admin section, confirm brand consistency (colors/fonts) without loss of functional clarity in forms, tables, or the content-block editor
4. Confirm no admin-only content or functionality became reachable from the public, unauthenticated site as a side effect of this styling pass

**Acceptance:** all four checks pass.

**HARD STOP 4.** Report the verification results. Wait for sign-off before opening the PR.

---

## RULES OF ENGAGEMENT
1. Do not make silent assumptions. If something is ambiguous, stop and ask.
2. Follow the project's core conventions: neutral/honest tone, strict user privacy (no personal data collection), and robust error handling.
3. Keep changes minimal and highly targeted. Do not refactor unrelated code.
4. No em dashes anywhere in your responses or code comments.
5. Hard stop at every designated step. Report your progress clearly and wait.
6. Do not sacrifice admin functional clarity for the sake of matching the public site's decorative visual language.
```
