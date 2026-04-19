# Plumb — Deterministic Builder Contracts

Companion to: `00-plumb-launch-full.md` · `01-voice-copy.md` · `02-licensing-contributors.md` · `03-drift-guardrails.md`.

Purpose: ship a set of copy-pasteable briefing templates that let any cold-start builder (human or AI-assisted) pick up any work package from `00-plumb-launch-full.md`, execute it, and hand off a mergeable result. Every template includes the canonical invariants, the voice guide pointer, the WP identifier, and the exit criteria.

No builder should need to re-read the whole plan library to act. Each contract below is self-contained.

---

## How to use this document

1. Pick a work package from `00-plumb-launch-full.md` (e.g., `D02`).
2. Select the matching role contract below (e.g., `R03 — Frontend Surface Builder`).
3. Hand the builder (human or AI) the contract text, filled in with the WP ID.
4. The builder executes, returns the artifacts listed in the contract's "Hand-in" section.
5. Reviewer verifies against the "Acceptance check" list.

## Contract anatomy (applies to every role below)

Every contract has these sections. Builders fill them out in order.

1. **Role scope.** What this role is accountable for.
2. **Context brief.** Pointers to North Star, invariants, voice, and the current app state. Read first.
3. **In-scope.** What work package(s) this role owns.
4. **Out-of-scope.** What this role must not touch.
5. **Required inputs.** Files, docs, and data they consume before writing code.
6. **Artifacts.** What they hand in.
7. **Verification protocol.** How they prove the work works.
8. **Acceptance check.** What the reviewer uses to say yes or no.
9. **Handoff.** Who reviews, what triggers merge.
10. **Deterministic prompt.** A copy-pasteable prompt to feed an LLM-assisted builder to get a consistent execution.

---

## R01 — Shell / Identity Builder

**Scope.** Owns work packages A01, A02, A03, A04, A05, A06, A07, A08, A09. Responsible for the app's public-facing identity surfaces.

**Context brief.** Read in order before starting: `00-plumb-launch-full.md` (especially "North Star," "Non-negotiable invariants," "Current state"), `01-voice-copy.md` in full, `03-drift-guardrails.md` (inviolable principles 1–26, aesthetic posture, voice posture).

**Must know about current state:**
- Shell styles live at `src/design/styles.css`. HomePage is at `src/design/HomePage.tsx` and has a `home.css` file already written at `src/design/home.css` but not imported yet. Import it first thing if picking up A01.
- Footer component is already in `src/design/App.tsx` (function `AppFooter`). Use it as-is; add advisory seats section for A09.
- `LICENSE` exists (AGPL-3.0 canonical text). Do not rewrite.
- `public/manifest.json` has been renamed to Plumb branding but icons still reference the wrong asset (hero-legacy.jpg). Fix in A03.
- `public/sw.js` is an early draft; upgrade in A02.
- `package.json` still has old `@psi/slope-calculator` name; rename in A08.

**In-scope.** All A-group WPs. Touch: `public/`, `src/design/`, `README.md`, new `CONTRIBUTING.md`, new `CODE_OF_CONDUCT.md`, new `GOVERNANCE.md`, `package.json`.

**Out-of-scope.** Tool-page internals (that's R03). Calc engines (that's R04). i18n string changes beyond what A01–A09 require (that's R05).

**Required inputs.**
- `01-voice-copy.md` sections: Header wordmark, Landing hero, Landing pillars, Footer, Footer advisory seats row, README opener, surface string banks.
- `02-licensing-contributors.md` sections: License decision, DCO, Advisory seat charter, Code of Conduct.
- `03-drift-guardrails.md` full document.
- Existing app state (read `App.tsx`, `HomePage.tsx`, `home.css`, `styles.css`, `LICENSE`, `public/manifest.json`, `public/sw.js`, `package.json`).

**Artifacts.**
- Import wiring for `home.css`.
- Updated `public/sw.js` with `plumb-v1` cache key, precache of bundled assets, stale-while-revalidate runtime strategy, navigation fallback.
- New PWA icon files under `public/icons/` (192, 512, 512-maskable) + `manifest.json` icons array updated + favicon in `index.html` pointing at the new mark.
- New `README.md` in voice (see `01-voice-copy.md` § README opener).
- Former technical README content moved to `docs/SLOPE-MODULE-INTEGRATION.md`.
- New `CONTRIBUTING.md` covering the five contribution paths in `02-licensing-contributors.md`.
- New `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 with the three additions from `02-licensing-contributors.md`).
- New `GOVERNANCE.md` documenting the five advisory seats and their charter.
- `package.json` renamed, metadata updated (name, description, author, license SPDX, repository, homepage, keywords).
- `AppFooter` component in `src/design/App.tsx` updated with advisory seats row (A09).
- Any required i18n keys added to `src/design/i18n.ts` for new visible strings (en + es).

**Verification protocol.**
1. `npm run build` passes.
2. `npm test` passes (R01 should not change any engine tests; if they fail, something's wrong).
3. Open `/` in dev server — landing page renders with all sections from `01-voice-copy.md § Landing hero`, `§ Landing pillars`, `§ Landing tool grid heading`, `§ Landing signoff`.
4. Visual check in both themes (light/dark) and both languages (en/es).
5. Install PWA to desktop Chrome — icon should be the new mark, not the hero photo.
6. Install PWA to iOS Safari (Add to Home Screen) — icon displays correctly on the home grid.
7. Airplane mode test: after first load, reload the app with network off — every route renders.
8. Lighthouse PWA audit ≥ 90 mobile + desktop.
9. Lighthouse Accessibility ≥ 95.
10. Cross-reference every string added to `01-voice-copy.md` — no deviations.

**Acceptance check.**
- [ ] HomePage renders with styled manifesto, pillars, tool grid, signoff.
- [ ] Footer carries: Plumb block, License block, Made-by block, Sign line, Advisory seats row (with "Seat open · apply →" links on unfilled seats).
- [ ] Wordmark in header reads "Plumb" with "A Legacy AI field tool" subtitle (hides on ≤520px).
- [ ] PWA installs on three browsers; icon is the new mark; app works offline post-install.
- [ ] README reads like Douglas wrote it. No AI-vibe prose. Invariants section present.
- [ ] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `GOVERNANCE.md` exist and align with `02-licensing-contributors.md`.
- [ ] `package.json` renamed. All metadata fields correct. License SPDX matches.
- [ ] No "coming soon," "in development," "in plain English" anywhere in diffs.

**Handoff.** Maintainer (Douglas) reviews README and voice-bearing copy. Merged after green CI + voice review.

**Deterministic prompt:**
```
You are executing Plumb work package {WP}. Read this entire contract before acting.

Authority docs (read in this order):
1. plans/00-plumb-launch-full.md — the whole document
2. plans/01-voice-copy.md — the whole document
3. plans/03-drift-guardrails.md — the whole document
4. plans/02-licensing-contributors.md — sections listed in the R01 contract

Current app state: running React 18 + Vite + TypeScript project under
/Volumes/Storage/PSI/tools/slope-calculator. HomePage component exists
at src/design/HomePage.tsx. home.css written but not imported. Footer
exists in App.tsx as function AppFooter. Hero image used for PWA icon
is the wrong aspect ratio and must be replaced.

Your task: execute work package {WP} as defined in 00-plumb-launch-full.md.

Invariants: see 03-drift-guardrails.md principles 1–26. Any PR that
violates these is wrong. Voice for all user-visible strings comes from
01-voice-copy.md verbatim or, for new strings, in the same voice.

Do not touch: anything in src/tools/, src/slope/, or the calc engines.
Those are other roles' scope.

Hand in: the artifacts listed in the R01 contract. Verify against the
R01 acceptance check before declaring done. No "done" without green
build, green tests, and the Lighthouse audits reaching the thresholds.
```

---

## R02 — Design System / Tool Unification Builder

**Scope.** Owns D01 (the shared `.psi-tool` layer) and provides the foundation for D02–D11 migrations.

**Context brief.** Read: `00-plumb-launch-full.md § Current state`, § Group D; `03-drift-guardrails.md § Design system`, § Aesthetic posture.

**Must know about current state:**
- 10 of 11 tool pages use `<div className="psi-slope" style={{ maxWidth: ..., ... }}>` with inline styles for chips, buttons, tables.
- The slope module (`src/slope/`) has its own scoped CSS that works fine — don't touch it. It's drop-in-portable for other PWAs.
- The shell system (`src/design/styles.css`) defines all OKLCH tokens and the `--psi-p50..--psi-p900` brand scale.

**In-scope.** Create `src/design/tool.css` with the `.psi-tool` family of classes. Migrate Bid Writer (D02) as the reference tool. Document the class inventory in `CONTRIBUTING.md` so downstream migrators (R03) know what to use.

**Out-of-scope.** Other D-group migrations (D03–D11) — hand off to R03 once D01+D02 are merged. Calc engine changes. Anything non-tool.

**Required inputs.**
- `src/design/styles.css` — to understand available tokens.
- `src/tools/bid-generator/BidGeneratorPage.tsx` — as the reference migration target.
- All 10 other tool page TSX files — scan for inline style patterns you need to support.
- `03-drift-guardrails.md § Design system`.

**Artifacts.**
- `src/design/tool.css` with at minimum these classes: `.psi-tool`, `.psi-tool__section`, `.psi-tool__field`, `.psi-tool__chip-row`, `.psi-tool__chip`, `.psi-tool__input`, `.psi-tool__button`, `.psi-tool__button--primary`, `.psi-tool__button--ghost`, `.psi-tool__numeric-readout`, `.psi-tool__table`, `.psi-tool__details`, `.psi-tool__warning`, `.psi-tool__grand-total`.
- Migration of `BidGeneratorPage.tsx` to consume the layer (zero inline styles remaining).
- Section added to `CONTRIBUTING.md` named "Tool-page CSS inventory" listing every class and its intended use.
- Snapshot tests or storybook entries that keep the reference appearances from regressing (optional but encouraged).

**Verification protocol.**
1. Bid Writer visual match in both themes — no color regression vs. current acceptable state.
2. No hex literals remaining in `BidGeneratorPage.tsx` (`grep -n '#[0-9a-fA-F]\{3,6\}' src/tools/bid-generator/BidGeneratorPage.tsx` returns nothing).
3. Bundle size unchanged or reduced.
4. All existing bid-generator tests pass.
5. Grand-total banner white-on-banner contrast ≥ 4.5:1 in both themes (measure with axe or a contrast checker).

**Acceptance check.**
- [ ] `src/design/tool.css` exists with documented class inventory.
- [ ] Bid Writer has no inline style objects except position/layout that genuinely requires inline computation (rare).
- [ ] `CONTRIBUTING.md` updated with the inventory.
- [ ] No regression on bid-generator unit tests.
- [ ] Grand-total banner passes AA contrast in both themes.

**Handoff.** R03 (Tool Polish) takes the baton for D03–D11 once D01+D02 are green.

**Deterministic prompt:**
```
You are executing Plumb work package D01 and D02.

Read first: plans/00-plumb-launch-full.md § Group D, and
plans/03-drift-guardrails.md § Design system.

Current state: 10 of 11 tool pages use inline style objects with
hex color fallbacks. Token system is healthy under .psi-app. Bid
Writer is the densest example; migrate it as the reference.

Your task:
1. Define src/design/tool.css with a consistent class inventory.
2. Migrate BidGeneratorPage.tsx off inline styles onto the class
   inventory. Zero hex literals remain.
3. Document the class inventory in CONTRIBUTING.md so R03 can
   migrate the other tools without reinvention.

Invariants: tokens only, no hex, no inline styles for color,
semantic HTML, AA contrast. White-on-banner grand-total in both
themes.

Do not touch src/slope/. That module is drop-in-portable and its
styles are deliberately scoped.

Hand in: tool.css, migrated BidGeneratorPage.tsx, CONTRIBUTING.md
section. Verify via the R02 acceptance check.
```

---

## R03 — Tool Polish Builder

**Scope.** Owns D03–D11 (per-tool migrations), plus E03 (slope-reader visualization).

**Context brief.** Read: `00-plumb-launch-full.md § Group D, § E03`; `03-drift-guardrails.md` full document; the class inventory section R02 added to `CONTRIBUTING.md`.

**Must know about current state:**
- R02 has merged `src/design/tool.css` and Bid Writer reference migration.
- 9 tool pages (Pipe Sizer, Drain Layout, Pressure Reader, Code Book, Fixture Counter, ADA Check, Permit Finder, Material Match, Backflow Log) still carry inline styles.
- E03 (slope visualization) can run in parallel — it lives inside the slope module; you'll also touch the slope module's scoped styles.

**In-scope.** Migrate each tool page's inline styles to the `.psi-tool` layer; preserve all math and FLUM behavior; add the PDF export button hook (F01 target); implement E03 slope visualization.

**Out-of-scope.** Entity extraction (C02 — different builder). Jurisdictional code data (E01, E02 — different builder). API worker (H01 — different builder).

**Required inputs.**
- `src/design/tool.css` and the inventory section in `CONTRIBUTING.md`.
- Each tool's current TSX + engine file under `src/tools/<id>/`.
- `03-drift-guardrails.md § Design system`, § Aesthetic posture.

**Artifacts.**
- Migrated TSX for each of: PipeSizerPage, DrainageDesignerPage, HydraulicAnalyzerPage, CodeCompliancePage, FixtureCounterPage, AdaCompliancePage, PermitNavigatorPage, MaterialSpecPage, BackflowTestPage.
- SVG pipe-invert profile chart added to `src/slope/SlopeCalculator.tsx` (E03).
- Visible focus states, ARIA labels, and keyboard support on every interactive element.

**Verification protocol.**
1. All 83 existing tests continue to pass. Any new tests added for visualization.
2. No hex literals remaining in any tool TSX (`grep -rn '#[0-9a-fA-F]\{3,6\}' src/tools/*.tsx`).
3. Visual inspection at 320px, 768px, 1024px, and 1440px viewport in both themes.
4. axe-core reports zero violations on every tool route.
5. Keyboard-only navigation works on every form field and button.

**Acceptance check.**
- [ ] Every migrated tool uses `.psi-tool` classes exclusively for styling.
- [ ] No color regression vs. reference Bid Writer migration.
- [ ] Slope visualization renders legibly at 320px, with belly segments clearly marked in `--psi-bad` plus a textual `aria-live` announcement.
- [ ] Screen-reader walkthrough of each tool announces fields, values, and results cleanly.
- [ ] Bundle size still under budget.

**Handoff.** To R07 (PDF Export) for F01 per-tool integration once each migration merges.

**Deterministic prompt:**
```
You are executing Plumb work packages {D-group} and E03.

Read first: plans/00-plumb-launch-full.md § Group D and § E03;
plans/03-drift-guardrails.md; and the "Tool-page CSS inventory"
section in CONTRIBUTING.md (added by R02).

Current state: src/design/tool.css and Bid Writer reference
migration are merged. Your task is to replicate that pattern
across the remaining 9 tools and add an SVG visualization to
Slope Reader.

Strict rules: tokens only, no hex, no inline style color,
every interactive element has a visible focus state and a
semantic HTML match, axe-core must report zero violations.
Math and FLUM envelope behavior must not change.

Hand in: migrated TSX for each assigned tool, plus the new
SVG profile chart in src/slope/SlopeCalculator.tsx. Verify via
the R03 acceptance check.
```

---

## R04 — Calc Engine / FLUM Author

**Scope.** Owns any calc engine work. For launch, the largest engine item is any corrections advisors surface (from A06 seat reviews), plus ensuring all engines return FLUM envelopes accepting a `lang` parameter and returning localized `result`/`hint`/`tip`/`actions_available` strings.

**Context brief.** Read: `src/llm/flum.ts` (engine contract and envelope shape); each tool's `calc.ts` file under `src/tools/<id>/`; `01-voice-copy.md § The eleven tools` (sample FLUM hints); `03-drift-guardrails.md § Testing`.

**In-scope.** Engine-logic corrections. FLUM envelope localization. Unit-test expansion to ≥ 95% branch coverage per engine.

**Out-of-scope.** UI. Styling. Routing. Chat/command palette. PDF export.

**Required inputs.**
- Existing engine code + tests.
- Advisory-seat-sourced corrections (arrive as issues or PRs).
- Voice copy for FLUM envelope samples.
- i18n infrastructure (`src/design/i18n.ts`) — extend as needed for engine-local string tables.

**Artifacts.**
- Updated engines returning `lang`-parameterized FLUM envelopes.
- Added unit tests to hit ≥ 95% branch coverage.
- Any corrections fixed with the advisor name in the commit message credit.

**Verification protocol.**
1. `npm test -- --coverage` shows ≥ 95% branch coverage per engine.
2. Every engine function accepts an optional `lang: Lang` parameter and returns localized envelope strings; English is the default fallback.
3. No regression on existing math-truth tests.

**Acceptance check.**
- [ ] Every engine returns a FLUM envelope whose strings honor `lang`.
- [ ] Coverage floor met.
- [ ] No math regressions.

**Handoff.** To R05 (i18n) for translation of the new envelope strings.

**Deterministic prompt:**
```
You are executing Plumb calc-engine work.

Read first: src/llm/flum.ts, plans/00-plumb-launch-full.md
§ Current state, and plans/03-drift-guardrails.md § Testing.

Current state: every calc engine is a pure function with unit
tests. FLUM envelope strings are currently English-only. Must
be parameterized by language.

Your task: take each engine function signature to
`({...params, lang?: Lang}) => FlumResponse` and ensure every
string in the returned envelope is sourced from a language-aware
string table. English default on missing keys.

Do not change math. Do not change the calc signature for
numerical inputs. Do not introduce external runtime
dependencies.

Hand in: updated engines + expanded unit tests. Verify 95%
branch coverage and zero math regressions.
```

---

## R05 — i18n Contributor / Translator

**Scope.** Owns B02 (Spanish feature parity), and ongoing translation infrastructure. Primary work: filling the en/es tables exhaustively, localizing Slope Reader's FLUM envelope end-to-end as the exemplar.

**Context brief.** Read: `src/design/i18n.ts`; `01-voice-copy.md` in full; `02-licensing-contributors.md § Translation contribution`; `03-drift-guardrails.md § i18n`.

**In-scope.** Extend `i18n.ts` string tables. Localize Slope Reader envelope in engine code (coordinate with R04). Add a "Help translate" banner when the user's `navigator.language` doesn't match the selected app language.

**Out-of-scope.** UI layout. Routing. Calc logic.

**Required inputs.**
- All user-visible strings identified in `01-voice-copy.md`.
- Slope Reader engine (`src/slope/calc.ts`) for envelope localization.
- Access to a native-Spanish-speaking trade professional reviewer (advisory-seat or volunteer).

**Artifacts.**
- Updated `i18n.ts` with complete en + es tables.
- Localized Slope Reader FLUM envelope strings.
- "Help translate" banner component and routing.
- CONTRIBUTING section on translation protocol (if not already present from R01).

**Verification protocol.**
1. Every key used in source (`grep -rhE 't\("([^"]+)"' src | sort -u`) exists in both en and es tables.
2. Spanish UI walkthrough by a native speaker; readability confirmed.
3. Slope Reader with `?lang=es` renders FLUM result, hint, tip, actions_available all in Spanish.

**Acceptance check.**
- [ ] Language switcher cycles en ↔ es.
- [ ] All chrome strings present in both.
- [ ] Slope Reader envelope fully Spanish when `lang=es`.
- [ ] Help-translate banner appears when appropriate.

**Handoff.** To Douglas (voice reviewer) for final en review; to trade-Spanish reviewer for es review.

**Deterministic prompt:**
```
You are executing Plumb translation work B02.

Read first: plans/01-voice-copy.md in full, src/design/i18n.ts,
and plans/03-drift-guardrails.md § i18n.

Current state: i18n scaffold exists with partial en + es tables.
Slope Reader FLUM envelope is English-only.

Your task: (1) expand i18n.ts to cover every visible string;
(2) localize Slope Reader's FLUM envelope end-to-end by
coordinating with R04 on engine signatures; (3) add the
"Help translate to your language" banner routed to
CONTRIBUTING.md#translations; (4) document the translation
protocol in CONTRIBUTING.md if R01 didn't already.

Rules: key stability (once shipped, don't rename); no machine-
only translations for visible UI; trade-native review for es.
Fall back to English silently on missing keys.

Hand in: expanded i18n.ts, localized slope-reader strings,
help-translate banner, CONTRIBUTING section. Verify via the
R05 acceptance check.
```

---

## R06 — Interaction Depth Builder (Chat, Palette, Memory)

**Scope.** Owns C01 (command palette), C02 (entity extraction), C03 (local job memory).

**Context brief.** Read: `00-plumb-launch-full.md § Group C`; `03-drift-guardrails.md` in full; `src/llm/flum.ts` for the router contract; `src/design/PsiChat.tsx` for the existing chat.

**Must know about current state:**
- PsiChat has voice input wired via Web Speech API.
- The current router is keyword-match only (no entity extraction).
- Tool pages accept params via their own local state; no URL-param or context pre-fill mechanism exists yet.

**In-scope.** Build the command palette overlay, the entity extractor, and the IndexedDB job memory layer. Wire them to tool pages via a React context or URL-search-param convention.

**Out-of-scope.** UI styling beyond the palette surface (use existing shell tokens). Calc engines. Per-tool migrations.

**Required inputs.**
- Existing router (`src/llm/flum.ts`).
- All 11 tool pages' param shapes.
- Testable golden-set phrases (ideally sourced from advisors).

**Artifacts.**
- `src/design/CommandPalette.tsx` + styles.
- `src/llm/extract.ts` (entity extractor) + unit tests (≥ 95% on golden set).
- `src/storage/jobMemory.ts` IndexedDB abstraction with `save(jobId, toolId, input, output)`, `recent(toolId?, n?)`, `get(jobId, toolId)`, `exportAll()`, `clearAll()`.
- Tool pages accept an optional `initialParams` prop that pre-fills the form.
- Header / HomePage gets the palette trigger (⌘K badge on desktop).

**Verification protocol.**
1. Golden set of 100 phrases (en and es combined) achieves ≥ 95% correct tool + ≥ 95% field fill on relevant numeric/material fields.
2. Command palette opens on ⌘K, closes on Escape, traps focus, returns focus on close.
3. IndexedDB save + recall works in all three primary browsers (Chrome, Safari, Firefox).
4. `exportAll()` produces a JSON the tech can re-import (schema documented in `docs/JOB-MEMORY-SCHEMA.md`).
5. `clearAll()` actually clears.

**Acceptance check.**
- [ ] Palette accessible, keyboard-navigable, works in both themes and both languages.
- [ ] Extraction golden set coverage verified.
- [ ] Typing a realistic sentence in the palette lands the tech on the right tool with the right fields pre-filled (video or screenshots in the PR).
- [ ] Job memory persists locally; no network call. Airplane mode verified.

**Handoff.** To R07 if job-memory export should integrate with PDF export.

**Deterministic prompt:**
```
You are executing Plumb work packages C01, C02, C03.

Read first: plans/00-plumb-launch-full.md § Group C,
plans/03-drift-guardrails.md in full, src/llm/flum.ts,
src/design/PsiChat.tsx.

Current state: keyword router only; no entity extraction;
no command palette; no local job memory; tool pages manage
their own state.

Your task: ship all three — palette overlay with ⌘K trigger
and fuzzy search, entity extractor (pure + unit-tested against
a 100-phrase golden set in en + es), IndexedDB job-memory
abstraction with save/recent/get/exportAll/clearAll. Wire tool
pages to accept initialParams that prefill forms.

Rules: no network for any of these; IndexedDB only for memory;
palette must trap/restore focus; extractor must flag ambiguous
cases rather than guess wrong.

Hand in: CommandPalette.tsx + styles, extract.ts + tests,
jobMemory.ts + schema doc, tool-page prop changes. Verify via
the R06 acceptance check.
```

---

## R07 — Export / Sharing Builder

**Scope.** Owns F01 (PDF export) and F02 (share-sheet integration).

**Context brief.** Read: `00-plumb-launch-full.md § Group F`; `01-voice-copy.md § PDF share`; `src/design/home.css` (which already contains the print CSS).

**Must know about current state:**
- Print CSS is already written and tested in `home.css` — produces Plumb-branded PDF output on `window.print()`.
- No per-tool "Share" button wired up.
- No PDF-generation library added yet.

**In-scope.** Add a "Share" button to each tool's result area. On desktop: trigger `window.print()`. On mobile + modern browsers: use `navigator.share` with a generated PDF blob. Graceful fallback to `mailto:`.

**Out-of-scope.** Tool page layouts (R03's scope). Voice or chat (R06).

**Required inputs.**
- `home.css` print styles.
- Tool pages' result structure (post-R03 migration).
- Web Share API support matrix.

**Artifacts.**
- `src/design/Share.tsx` — a reusable Share button component.
- `src/design/pdf.ts` — lightweight PDF-generation helper (html2canvas + jspdf only if strictly required; prefer browser-native `window.print()` where possible).
- Integration in each tool's FLUM result area.
- Footer stamp on every generated PDF: "Plumb — A Legacy AI field tool · legacyai.space · AGPL-3.0".

**Verification protocol.**
1. Print preview of every tool produces a single-page, legible, Plumb-branded PDF.
2. `navigator.share` fires on Chrome Android and iOS Safari from a tool result.
3. Fallback to `mailto:` works when Web Share is unavailable.
4. Bundle-size impact ≤ 30 KB gzipped for the PDF layer.

**Acceptance check.**
- [ ] Every tool has a visible "Share" button in its result area.
- [ ] PDFs carry the Plumb + Legacy AI + AGPL footer stamp.
- [ ] No share fires without a user tap.

**Handoff.** Merge after voice + a11y reviews.

**Deterministic prompt:**
```
You are executing Plumb work packages F01 and F02.

Read first: plans/00-plumb-launch-full.md § Group F,
plans/01-voice-copy.md § PDF share, src/design/home.css
(print styles).

Current state: print CSS is already written and produces
Plumb-branded output on window.print(). No Share button
is wired into any tool.

Your task: add a reusable Share button component, wired
into each of the 11 tools' result area. Desktop uses
window.print(); mobile uses navigator.share with a
generated PDF blob; fallback mailto: for unsupported
browsers.

Rules: no share without user tap; every generated PDF
carries the footer stamp with legacyai.space + AGPL;
bundle impact ≤ 30 KB gzipped.

Hand in: Share.tsx, pdf.ts, integration in each tool,
test evidence (screenshots + share-sheet video).
```

---

## R08 — Typography Builder

**Scope.** Owns B01 (self-hosted type commitment).

**Context brief.** Read: `00-plumb-launch-full.md § B01`; `03-drift-guardrails.md § Performance`; `src/design/styles.css` font tokens.

**In-scope.** Pick three faces, vendor them self-hosted via `@fontsource` or equivalent, wire into tokens, measure perf.

**Out-of-scope.** Anything else.

**Artifacts.**
- `@fontsource/*` npm deps added for chosen display + body + mono.
- Imports in `main.tsx` or a small font-bootstrap module.
- Updated `--psi-font-sans`, `--psi-font-mono`, new `--psi-font-display` tokens.
- `<link rel="preload">` hints for the critical weights only.
- A `docs/THIRD-PARTY-NOTICES.md` line per font listing its license (typically OFL-1.1).

**Verification protocol.**
1. Fonts work offline after first load.
2. No Google Fonts network requests.
3. Total font payload ≤ 90 KB gzipped combined.
4. No blocking FOIT; text is readable throughout load.

**Acceptance check.**
- [ ] Three faces chosen, self-hosted, documented.
- [ ] Perf budget met.
- [ ] License attribution in THIRD-PARTY-NOTICES.

**Handoff.** Merge; no downstream.

**Deterministic prompt:**
```
You are executing Plumb work package B01.

Read first: plans/00-plumb-launch-full.md § B01,
plans/03-drift-guardrails.md § Performance.

Current state: fonts are system-ui stack, no character.

Your task: commit to three faces — a display face
(Space Grotesk or Archivo), a body face (Inter or IBM
Plex Sans), a mono face (JetBrains Mono or IBM Plex
Mono). Self-host via @fontsource. Wire into tokens.
Preload critical weights only. Add attribution to
docs/THIRD-PARTY-NOTICES.md.

Rules: offline-capable, OFL-1.1 compatible, ≤ 90 KB
gzipped combined, no FOIT.

Hand in: dep additions, imports, token updates,
preload hints, notices file.
```

---

## R09 — Sensor Bridge Builder

**Scope.** Owns G02 (Web Bluetooth laser-distance-meter integration).

**Context brief.** Read: `00-plumb-launch-full.md § G02`; BLE GATT profiles for the target devices (Leica Disto D-series primary); `03-drift-guardrails.md` full.

**Must know about current state:** no sensor plumbing exists. Web Bluetooth is supported in Chrome Android + desktop Chrome; not in Firefox or Safari. Graceful-hide expected.

**In-scope.** Implement `src/sensors/laserMeter.ts` with a clean pair/read/disconnect API. Wire into Slope Reader and Pressure Reader as the form field's "Connect meter" target.

**Out-of-scope.** Any other sensor. Non-BLE pairing.

**Artifacts.**
- `src/sensors/laserMeter.ts` with pure TypeScript types and a small connection manager.
- UI integration in Slope Reader + Pressure Reader (buttons gated on `navigator.bluetooth` presence).
- Device identifiers never persisted unless user opts in via a "Remember this meter" toggle.
- Docs: `docs/SENSOR-BRIDGE.md` listing supported devices and pairing steps.

**Verification protocol.**
1. Pair with a Leica Disto D-series meter on Chrome Android — reading populates the field.
2. On Firefox/Safari desktop, no "Connect meter" button appears (feature-flag via capability detection, no broken UI).
3. Disconnect leaves app in clean state.

**Acceptance check.**
- [ ] Feature-detected; no UI cost when unsupported.
- [ ] Readings populate fields correctly.
- [ ] No device identifier leaks.

**Deterministic prompt:**
```
You are executing Plumb work package G02.

Read first: plans/00-plumb-launch-full.md § G02,
Web Bluetooth GATT profile docs for Leica Disto D-series,
plans/03-drift-guardrails.md § Data posture.

Current state: no sensor integration; the Slope Reader
and Pressure Reader expect typed input.

Your task: implement a BLE client (src/sensors/laserMeter.ts)
that pairs, subscribes to measurement notifications, and
surfaces readings to the form fields. Feature-gate on
navigator.bluetooth. Document supported devices and steps.

Rules: no auto-connect; user pairs per session; device
identifier only persisted on explicit "Remember" toggle;
offline-safe (feature works without network).

Hand in: laserMeter.ts, UI integration, docs, pairing video.
```

---

## R10 — Infrastructure Builder (Commons API, CI)

**Scope.** Owns H01 (Trade Commons HTTP API) and H02 (GitHub setup).

**Context brief.** Read: `00-plumb-launch-full.md § Group H`; `02-licensing-contributors.md § DCO, § Code contribution`; calc engines in `src/tools/*/calc.ts` and `src/slope/calc.ts`.

**In-scope.** Stand up a Cloudflare Worker or Vercel Edge Function that exposes the 11 calc engines over HTTP. Set up GitHub issue templates, PR template, CI workflow, branch protection, DCO bot.

**Out-of-scope.** Anything user-facing in the app.

**Artifacts.**
- `workers/commons-api/` subdirectory with worker source importing the shared calc engines.
- OpenAPI spec at `workers/commons-api/openapi.yaml`.
- Deploy scripts.
- `.github/ISSUE_TEMPLATE/*` (bug, translation, jurisdictional correction, advisory application, security-private).
- `.github/PULL_REQUEST_TEMPLATE.md` with the 10-step review checklist from `03-drift-guardrails.md § Review checklist`.
- `.github/workflows/ci.yml` running lint, type-check, build, test, bundle-size, i18n validation, axe-core, DCO.
- `.github/CODEOWNERS` with advisory-gated paths (`LICENSE`, `plans/02-licensing-contributors.md`, `GOVERNANCE.md`).
- `.github/SECURITY.md` with disclosure contact.

**Verification protocol.**
1. `curl -X POST https://commons.example/api/v1/slope -d '...'` returns a FLUM envelope.
2. Rate limit triggers at 60 req/min per IP.
3. CI runs on every push and blocks merges on red.
4. DCO check rejects un-signed commits.

**Acceptance check.**
- [ ] API deployed, publicly accessible, rate-limited, documented.
- [ ] GitHub setup complete.
- [ ] CI runs and blocks bad merges.

**Deterministic prompt:**
```
You are executing Plumb work packages H01 and H02.

Read first: plans/00-plumb-launch-full.md § Group H,
plans/02-licensing-contributors.md § DCO.

Current state: local-only project, no CI beyond what was
scaffolded for slope-calculator before. Calc engines are
pure TS and can be imported from a worker.

Your task: (H01) stand up an HTTP worker exposing the 11
calc engines at /api/v1/<tool>, no auth, rate-limited, with
OpenAPI docs; (H02) set up GitHub issue templates, PR
template, CI with DCO enforcement, branch protection,
CODEOWNERS, SECURITY.md.

Rules: zero auth, no request-body persistence, AGPL-licensed
deps only, CI bundle-size + i18n + axe gates.

Hand in: workers/commons-api, .github/*, CI workflow, deploy
evidence.
```

---

## R11 — Advisory Reviewer (Domain Expert)

**Scope.** Reviews content (not code) for trade accuracy. Applies to E01 (jurisdictional data), E02 (common violations), calc engine outputs, voice copy for domain realism.

**Context brief.** Read: `01-voice-copy.md`, `02-licensing-contributors.md § Advisory seat charter`, the specific tool engine or data file under review.

**In-scope.** Accuracy reviews. Voice realism reviews. Code-section citation verification. Translation realism reviews (for the seat-holder whose language it is).

**Out-of-scope.** Code changes beyond documentation suggestions (maintainers convert reviewer comments into PRs).

**Artifacts.**
- Review comments on PRs and issues, signed with the seat title.
- Occasional published "trade review" documents in `docs/TRADE-REVIEWS/` attesting to domain accuracy of major surfaces.

**Verification protocol.**
- Maintainers confirm reviewer is the current seat-holder.
- Reviewer signs comments `— Master plumber (advisory seat)` etc.

**Deterministic prompt:**
```
You are an advisory-seat reviewer for Plumb.

Read first: plans/01-voice-copy.md, plans/02-licensing-contributors.md
§ Advisory seat charter, and the specific PR/issue you're reviewing.

Your task: verify accuracy from your trade perspective. Call out
anything that sounds wrong, misleading, or code-incorrect. Suggest
specific corrections. Sign your comments with your seat title.

You are not writing code. Maintainers will convert your domain
corrections into PRs on your behalf.
```

---

## R12 — Voice Reviewer (Douglas or designate)

**Scope.** Reviews user-visible copy across surfaces (UI strings, FLUM envelopes, READMEs, PR templates, social launch copy).

**Context brief.** Read: `01-voice-copy.md` in full; the PR or surface under review.

**In-scope.** Copy. Voice. Branding consistency. Banned-phrase enforcement (`"in plain English"`, `"coming soon"`, etc.).

**Out-of-scope.** Technical review.

**Artifacts.**
- Inline comments on PRs with voice-bar decisions.
- Signed-off approvals on UI-touching PRs.

**Verification protocol.**
- Reviewer maintains the living voice guide (`01-voice-copy.md`) when new surfaces need canonical strings.

**Deterministic prompt:**
```
You are Plumb's voice reviewer.

Read first: plans/01-voice-copy.md in full.

Your task: review user-visible copy in the PR. Flag anything
that doesn't match Douglas's voice. Flag banned phrases.
Approve only when the copy either matches the canonical
surface strings or is plausibly in the same voice.

Sign your approval line with "Voice review: approved" or
"Voice review: blocked — [reason]".
```

---

## Cross-role handoff rules

- Every PR lists the WP IDs it addresses, the role(s) that touched it, and the reviewers required.
- Merges require at minimum: green CI, DCO sign-off, one maintainer review, voice review for UI-touching, advisory review for content-touching.
- No PR merges the day it's opened unless it's a trivial doc fix. 24-hour review window default.
- Launch-tag cut requires all acceptance checks across all WPs to show complete in the PR history.

## Builder drift signals

If a builder starts exhibiting any of these, pause and re-brief:

- Violates an invariant in service of "shipping faster."
- Expands scope into another role's territory without explicit handoff.
- Introduces "coming soon" or placeholder copy.
- Adds an analytics library "just for telemetry to see if it works."
- Argues with the voice bar instead of matching it.
- Tries to convince reviewers a CLA would be better than DCO.

Any of these = escalate to maintainers + advisory seats per the escalation path in `03-drift-guardrails.md`.

## Closing note

This document is long because the shortcut is to read it once and stop re-reading it. Every builder gets the contract, the voice guide, the guardrails, and the plan. Any deviation is observable. Any drift is preventable at review.

The gift only works if every contributor understood what the gift was. That understanding lives in these five plan files.

— Douglas · Legacy AI
