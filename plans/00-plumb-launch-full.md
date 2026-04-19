# Plumb — One-Act Launch Plan

Owner: Douglas (Legacy AI)
Plan tier: **Launch, single act, no staged tiers.**
Updated: 2026-04-19

---

## North Star

This project is **Legacy AI's gift to the plumbing trade.** It is not a product, not a funnel, not a loss-leader. It is a public-goods artifact that introduces Legacy AI to the trade by doing something the trade has been waiting for nobody to do: give them back the basic tools of their work, free and forever.

The single success test for every decision in this plan:

> **Would a 55-year-old master plumber, opening this on his phone for the first time, set down his coffee and think "whoever made this understands the work"?**

If yes, ship it. If no, fix it or cut it.

## The three pillars

Every work package below rolls up to one or more of these. If a package doesn't serve a pillar, it gets cut.

1. **Respect for the work.** The tool speaks the tech's language, lives on the tech's phone, works in a basement with no signal, never makes the tech feel sold to.
2. **Legacy AI's fingerprint.** The gift card is signed. Every route, every printed output, every shared link says who made it and where to find them.
3. **A posture that proves it's not a trap.** Open source (AGPL-3.0-or-later), no account, no telemetry, no email capture, no "Pro" tier, no dark-pattern dead ends.

## Non-negotiable invariants

These never move. If a work package conflicts with one of these, the work package is wrong, not the invariant.

- **No accounts. No login. No telemetry. No tracking pixels. No email capture.** Ever.
- **AGPL-3.0-or-later** stays the license for all code in this repository.
- **Nothing leaves the device** unless the user explicitly exports or shares.
- **Offline-first.** Every tool must work with no network after first visit.
- **WCAG 2.2 AA minimum** across every surface. Focus, contrast, target size, reduced motion.
- **Language parity: English and Spanish reach feature parity at launch.** Other languages open as contributor work.
- **Every printed or shared artifact carries the Plumb wordmark and `legacyai.space` credit.**
- **No "in plain English"** phrasing anywhere — the workforce is substantially non-native-English-speaking and the product promise is translatability, not English-centered clarity.
- **No "coming soon," "in development," or tier-gated features visible in the shipped app.** Nothing is pending. What's there works.

---

## Current state (factual)

**Tech stack:** React 18.3, Vite 5.4, TypeScript 5.6 strict, React Router 6.30, Vitest 2.1. No runtime CSS-in-JS, no state library. All styles in `src/design/styles.css` (shell) + `src/slope/styles.css` (slope module) + inline. Tokens expressed in OKLCH.

**Project paths:**
- Working dir: `/Volumes/Storage/PSI/tools/slope-calculator`
- Dev server port: **17449** (Legacy AI port-allocation policy; do not bind 3000/5173/8080/8000)
- Tool code: `src/tools/<tool-id>/`
- Slope module: `src/slope/` (drop-in-portable — has its own scoped styles)
- Shell: `src/design/` (App.tsx, HomePage.tsx, PsiChat.tsx, styles.css, home.css, i18n.ts)
- FLUM engine: `src/llm/flum.ts` (keyword router + response envelope)

**Build + tests (as of plan date):** `npm run build` passes at ~88 KB gzipped JS + ~6 KB gzipped CSS. `npm test` passes 83 tests across 11 files.

**What already exists and works:**
- All 11 calc engines (pure functions, unit-tested): slope, pipe_sizer, fixture_counter, code_compliance, hydraulic_analyzer, drainage_designer, permit_navigator, ada_compliance, material_spec, backflow_test, bid_generator.
- Shell design system with OKLCH tokens, light/dark themes, industrial-instrument-panel aesthetic.
- FLUM response envelope (`status`, `result`, `hint`, `actions_available`, `tip`, `metadata`).
- Keyword router (`parseIntent`) that routes free-text to a tool by keyword match.
- Wordmark credit to Legacy AI in header.
- Persistent site-wide footer with AGPL link, Legacy AI credit, Douglas's signoff.
- HomePage component + i18n scaffold (en/es) + voice-input on chat (Web Speech API).
- `LICENSE` file (AGPL-3.0 canonical text).

**What is partial or broken (the launch gap):**
- `src/design/home.css` exists but is not yet imported from `HomePage.tsx` (the landing page has no styles yet).
- `public/sw.js` cache key is `psi-slope-v1`, not `plumb-v1`; no versioned precache manifest.
- `public/manifest.json` icon still references `hero-legacy.jpg` (1214×470, wrong aspect ratio for a PWA icon).
- `package.json` name is `@psi/slope-calculator`; should be `@legacyai/plumb` or similar.
- `README.md` describes the old single-tool scope (PSI Slope Calculator), not the Plumb gift.
- No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, or `GOVERNANCE.md`.
- Entity extraction: the "chat" only routes by keyword; it does not extract numbers, units, materials, or dimensions and pre-fill forms. The trust-gap item.
- Tool pages (10 of 11) use inline styles with hardcoded color fallbacks; no shared `.psi-tool` class layer.
- Spanish translation covers chrome (header, footer, nav, chat placeholders, landing) but no tool output envelope is localized end-to-end.
- No PDF / print export UX wired to any tool (print CSS exists in `home.css`, but no "Share PDF" button).
- No local job memory (IndexedDB).
- No command palette overlay (⌘K).
- No Web Bluetooth sensor bridge.
- No jurisdictional Code Book selection.
- No self-hosted typography commitment (still system-ui stack).
- No Trade Commons HTTP API.

This plan closes every item on that list, in one act.

---

## Work package registry

Every work package has the same contract:

- **Goal** — one sentence. What this delivers for the gift.
- **Fundamentals (finish line)** — what the builder must hand in.
- **Invariants** — what must not break.
- **Depends on** — packages that must land first.
- **Parallel with** — packages that can run simultaneously on separate branches.
- **North-star reminder** — which pillar this serves.

Builders pick up packages by ID. A builder prompt template lives in `04-deterministic-contracts.md`.

### Group A — Shell & Identity Finalization

#### A01 · HomePage mount & default route

- **Goal:** The gift has a front door. `/` renders the manifesto + tool grid, not a redirect to a form.
- **Fundamentals:** Import `home.css` from `HomePage.tsx`. Confirm the route `/` renders HomePage with localized strings, install prompt wiring, tool grid (11 cards), and Douglas's signoff. All 11 tools reachable in one tap from home. Keyboard and screen-reader-navigable.
- **Invariants:** HomePage must not fetch anything, must not require any auth, must render with no network.
- **Depends on:** none (component exists; CSS exists; import is missing).
- **Parallel with:** all other A-group packages.
- **North-star reminder:** Pillar 2 — the gift card is signed. Pillar 3 — no trap.

#### A02 · Service worker offline precache

- **Goal:** The promise "works in a basement with no signal" becomes real.
- **Fundamentals:** Rename cache key to `plumb-v1`. Precache the built asset manifest (index.html, JS/CSS bundles, manifest.json, icons). Runtime cache strategy: stale-while-revalidate for same-origin GETs, network-first for HTML navigations with cache fallback. Cache bust on version change. Registration code in `main.tsx` is already present; the SW itself needs the upgrade. SW must not interfere with hot-reload in dev mode.
- **Invariants:** Post-install, a full page load with airplane mode on must render the complete app including the HomePage, all 11 tool routes, and i18n.
- **Depends on:** none.
- **Parallel with:** all other A-group packages.
- **North-star reminder:** Pillar 1 — works in the basement.

#### A03 · PWA icon set

- **Goal:** When a plumber taps "Add to Home Screen," a proper Plumb mark appears on their phone. Not a stretched hero photo.
- **Fundamentals:** Produce a square icon expressing the Plumb wordmark + Legacy AI fingerprint. Ship at minimum 192×192, 512×512, and a 512×512 maskable variant. Update `manifest.json` icons array. Favicon in `index.html` updated to same mark. Icon must read at 48px (home-screen size) without illegibility.
- **Invariants:** Icon must be visually distinguishable from the iOS default placeholder. No photographic content — this is a wordmark, not a photo.
- **Depends on:** brand direction from Douglas if a custom mark is required. Default: tight monospace "P" glyph on amber field, neutral if icon design punts.
- **Parallel with:** A01, A02, A04–A09.
- **North-star reminder:** Pillar 2 — Legacy AI's fingerprint.

#### A04 · README public rewrite

- **Goal:** The repository's public face matches the gift.
- **Fundamentals:** Replace `README.md` with a Plumb-voiced public README. Sections: (1) the gift (one paragraph), (2) what's in it (11 tools, one-line each), (3) install (as PWA, dev clone, contribute), (4) license + contributors pointer, (5) Legacy AI credit + link. Keep the current technical PWA-integration content as `docs/SLOPE-MODULE-INTEGRATION.md` (move, don't lose).
- **Invariants:** No marketing boilerplate. No feature roadmaps. No screenshots of fake dashboards. Douglas voice (see `01-voice-copy.md`).
- **Depends on:** voice copy (`01-voice-copy.md`).
- **Parallel with:** A01, A02, A03, A05–A09.
- **North-star reminder:** Pillar 3 — the repo is the proof it's not a trap.

#### A05 · CONTRIBUTING.md

- **Goal:** Anyone in the trade or anyone who can code knows in one page how to help.
- **Fundamentals:** Sections: (1) what we accept (new languages, jurisdictional code data, tool refinements, accessibility fixes, domain corrections from trade pros), (2) what we don't accept (ads, analytics, accounts, paid-tier gating, telemetry, proprietary deps incompatible with AGPL), (3) DCO sign-off requirement (`git commit -s`), (4) translation contributor protocol, (5) domain-expert contributor protocol (master plumbers, code officials), (6) code contributor protocol (fork → branch → PR → DCO → green CI → review), (7) scope discipline rules, (8) how to open an advisory seat.
- **Invariants:** No CLA (copyright assignment). DCO only. This is deliberate — no capture path.
- **Depends on:** licensing decisions in `02-licensing-contributors.md`.
- **Parallel with:** A01–A04, A06–A09.
- **North-star reminder:** Pillar 3 — open-source posture.

#### A06 · GOVERNANCE.md

- **Goal:** Publish the trust architecture before anyone asks how capture is prevented.
- **Fundamentals:** Define: (1) the five advisory seats and their charter (master plumber, trade-school instructor, code official, non-native-English-speaking journeyman, youth apprentice), (2) veto rights (advisors can veto any change that violates the invariants), (3) maintainer role (Douglas as BDFL until year 3; then council rotation), (4) decision protocol (consensus preferred; simple majority fallback; advisors have hard veto on mission-drift proposals), (5) capture resistance (no single maintainer can accept a buyout, sponsorship, or relicense; changes to governance or license require unanimous advisory vote), (6) emergency powers (security issues bypass normal flow).
- **Invariants:** No seat gets compensation. Seats are rotational (3-year term, renewable once). Advisors must be active in the trade or adjacent (not professional board-sitters).
- **Depends on:** licensing (`02-licensing-contributors.md`).
- **Parallel with:** A01–A05, A07–A09.
- **North-star reminder:** Pillar 3 — capture resistance as a visible design.

#### A07 · CODE_OF_CONDUCT.md

- **Goal:** Contributors from 11 countries and 5 skill levels feel welcome. Hostile actors don't.
- **Fundamentals:** Adopt Contributor Covenant 2.1 with minor adjustments: explicitly welcome non-native-English contributors and ask for translation generosity; explicitly reject "English-only" enforcement in issue threads; specify the enforcement email (project-owned, not a personal inbox).
- **Invariants:** Don't fork the Contributor Covenant license — include it verbatim with required attribution.
- **Depends on:** none.
- **Parallel with:** all other A-group packages.
- **North-star reminder:** Pillar 1 — respect for the people doing the work.

#### A08 · package.json + project metadata

- **Goal:** The artifact's identity is internally consistent.
- **Fundamentals:** Rename package to `@legacyai/plumb` (or `plumb-field-kit` if scoped naming is problematic). Update `description`, `author`, `license` (`AGPL-3.0-or-later`), `repository`, `homepage`, `keywords`. Add `funding` field pointing to `legacyai.space` with `type: "other"` (since the project is unfunded). Confirm no proprietary license fields anywhere.
- **Invariants:** Version stays pre-1.0 (`0.9.0` recommended for launch) to signal active iteration. No dependencies added that aren't AGPL-compatible.
- **Depends on:** A04 (README) for repository URL consistency.
- **Parallel with:** A01–A07, A09.
- **North-star reminder:** Pillar 2 — consistent signature across metadata.

#### A09 · Footer advisory seats row

- **Goal:** The gift visibly wants the trade inside the project.
- **Fundamentals:** Add a third section to the site-wide footer: "Advisory seats." Lists the five seat titles. Each seat either shows a name (if filled) or a `Seat open · apply →` link to `CONTRIBUTING.md#advisory-seats`. Styled consistently with existing footer columns.
- **Invariants:** Do not fabricate names. Open seats stay visibly open. Applications route through `CONTRIBUTING.md`, not a form.
- **Depends on:** A05 (CONTRIBUTING) for the link target; A06 (GOVERNANCE) for the seat titles.
- **Parallel with:** A01–A08.
- **North-star reminder:** Pillar 1 — the trade is invited in from day one.

### Group B — Typography & Voice

#### B01 · Self-hosted typography commitment

- **Goal:** The gift has its own voice in type, not the browser default.
- **Fundamentals:** Commit to three faces, self-hosted via `@fontsource` npm packages (or equivalent): a distinctive display face (Archivo or Space Grotesk), a readable body face (Inter or IBM Plex Sans), a tabular monospace (JetBrains Mono or IBM Plex Mono). Wire into `--psi-font-sans`, `--psi-font-mono`, and a new `--psi-font-display`. Preload only the single critical weight/style combo (display bold + body regular + mono regular). Include `font-display: swap`. All fonts must work offline (no Google Fonts CDN).
- **Invariants:** Total font payload over wire ≤ 90 KB gzipped combined. No blocking FOIT on first paint.
- **Depends on:** none.
- **Parallel with:** all other packages.
- **North-star reminder:** Pillar 2 — visual voice is part of the signature.

#### B02 · Spanish translation to feature parity

- **Goal:** Launch claims "every language the trade speaks." At launch, English and Spanish must reach feature parity, with one tool's FLUM envelope fully localized as proof of structural support.
- **Fundamentals:** (1) Expand `src/design/i18n.ts` to cover every UI string, including tool descriptions, error states, confidence levels, and action chip labels. (2) Pick Slope Reader as the exemplar tool; localize every FLUM envelope string (result, hint, actions_available, tip) produced by `src/slope/calc.ts`. Envelope responses must not fall back to English when Spanish is active. (3) Add a visible "Help translate to your language" call-to-action on the HomePage that routes to `CONTRIBUTING.md#translations`. (4) Document the envelope-translation contract in CONTRIBUTING so future tools know how to ship translatable.
- **Invariants:** Spanish translations must be reviewed by a native speaker ideally fluent in the trade (not generic translation). For launch, acceptable fallback: human-reviewed ML translation with a visible "community-reviewed" badge and an invitation to correct. Do not ship Spanish that sounds like English under translation.
- **Depends on:** voice copy (`01-voice-copy.md`) for the English originals.
- **Parallel with:** B01, C01–C03, D01, E-group, F-group, G-group, H-group.
- **North-star reminder:** Pillar 1 — respect for the workforce that actually does the work.

### Group C — Interaction Depth

#### C01 · Command palette overlay (⌘K)

- **Goal:** Fast routing between 11 tools from anywhere without returning to the home grid.
- **Fundamentals:** Global keyboard shortcut (Cmd/Ctrl+K on desktop; always-visible button in header on mobile). Opens a focused dialog with: (a) text field with fuzzy search over tool names, descriptions, and synonyms, (b) arrow-key + Enter navigation, (c) voice-input button reusing the existing Web Speech plumbing, (d) escape to close. Results list shows ticker code + localized label + one-line description. Empty-state suggests 3 most-recently-used tools (persisted in localStorage).
- **Invariants:** Must trap focus while open, restore focus to trigger on close (WCAG 2.4.3). Must work on mobile Safari without breaking scroll locking. Must localize.
- **Depends on:** none (additive overlay).
- **Parallel with:** B-group, C02, C03, D01, E-group, F-group, G-group, H-group.
- **North-star reminder:** Pillar 1 — the tool gets out of the tech's way.

#### C02 · Entity extraction — the trust-gap closer

- **Goal:** A tech who types "2-inch copper at 50 feet, 40 psi" lands on the Pressure Reader with those values pre-filled. The chat stops lying about what it does.
- **Fundamentals:** Write an entity-extraction layer (`src/llm/extract.ts`) that parses freeform English and Spanish input and returns structured parameters per tool: numbers with units (inches/feet/meters/psi/gpm/L/min), materials (copper, PVC, PEX, CI, galvanized, brass, cast iron), pipe schedules, fixture names (toilet, lavatory, kitchen sink, urinal), fitting types, jurisdictional hints ("Austin," "Brown County"), and building classes (residential/commercial/industrial). Integrate into `parseIntent` so the router returns both a `tool` and populated `params`. Tool pages consume `params` via a React context or a URL search param to pre-fill form fields. Falls back gracefully when extraction is empty — never lose user input.
- **Invariants:** Extractor must be pure, unit-tested (target ≥ 95% on a golden test set of 100 real-plumber phrases in en and es). No LLM runtime dependency — regex-plus-keyword approach with optional future upgrade path. Extraction must never produce silently wrong values; ambiguous input yields a `requires_clarification` flag.
- **Depends on:** B02 (Spanish strings known) is helpful but not blocking.
- **Parallel with:** B-group, C01, C03, D01, E-group, F-group, G-group, H-group.
- **North-star reminder:** Pillar 1 — respect: don't waste the tech's time.

#### C03 · Local job memory (IndexedDB)

- **Goal:** The second time a tech calculates at `1421 Oak St`, the app remembers what they did last time.
- **Fundamentals:** Per-device job store keyed by a user-entered `job_id` or auto-derived address+date. Every tool's successful computation writes to the store (inputs + FLUM response). A "Recent jobs" affordance on every tool page lets the tech recall a prior calc into the current form. An "All jobs" view under `/jobs` lists recent jobs across tools. Export all data as JSON (for tech portability). Delete-all option. Default retention: infinite (user-controlled).
- **Invariants:** Data **never leaves the device.** No sync, no cloud, no API call. IndexedDB only. Implement an abstraction so future `file://` or OPFS storage can replace it without rewriting tool code.
- **Depends on:** D01 (shared tool layer provides a consistent "recent jobs" hook).
- **Parallel with:** B-group, C01, C02, E-group, F-group, G-group, H-group.
- **North-star reminder:** Pillar 3 — proof it's not a trap (data stays with the tech).

### Group D — Tool Page Unification

#### D01 · Shared `.psi-tool` layer

- **Goal:** Retire the accidental pattern where tool pages inherit from `.psi-slope` and style themselves with inline `style={{ ... }}` objects. Give every tool page a consistent, token-consuming wrapper with shared building blocks.
- **Fundamentals:** Create `src/design/tool.css` with `.psi-tool`, `.psi-tool__section`, `.psi-tool__field`, `.psi-tool__chip-row`, `.psi-tool__chip`, `.psi-tool__input`, `.psi-tool__button`, `.psi-tool__numeric-readout`, `.psi-tool__table`, `.psi-tool__details`, `.psi-tool__warning`. All tokens come from the shell system (`--psi-*`). Migrate one tool (Bid Writer, the densest example) fully to this layer as the reference. Document the class inventory in `CONTRIBUTING.md` so future tool contributors don't reinvent.
- **Invariants:** Zero hex color literals in any tool's JSX/TSX. All color, spacing, and typography must come from tokens. Class names follow the existing BEM-ish `psi-tool__block`/`--modifier` convention.
- **Depends on:** none.
- **Parallel with:** B-group, C-group, E-group, F-group, G-group, H-group.
- **North-star reminder:** Pillar 2 — consistency is part of signature.

#### D02 · Bid Writer migration + grand-total fix

- **Goal:** The Bid Writer looks finished and professional in both themes. Grand-total banner never fails contrast.
- **Fundamentals:** Migrate `BidGeneratorPage.tsx` off inline styles onto the `.psi-tool` layer (D01). Replace the `background: var(--psi-p900, #0c4a6e)` grand-total banner with a `.psi-tool__grand-total` class using the brand-stable amber scale. Ensure white text on the banner is ≥ 4.5:1 in both themes. Add PDF export button (see F01).
- **Invariants:** All math unchanged. All unit tests still pass. No regressions in the FLUM envelope the tool returns.
- **Depends on:** D01.
- **Parallel with:** D03–D11, E-group, F-group, G-group, H-group.
- **North-star reminder:** Pillar 2 — every surface the tech uses reads as made-by-pros.

#### D03–D11 · Per-tool polish migrations

One work package per remaining tool:

- **D03 Pipe Sizer** · migrate to `.psi-tool`; add results export (F01).
- **D04 Drain Layout** · ditto.
- **D05 Pressure Reader** · ditto; prepare sensor input target (G02).
- **D06 Code Book** · ditto; prepare jurisdiction selector target (E01).
- **D07 Fixture Counter** · ditto.
- **D08 ADA Check** · ditto.
- **D09 Permit Finder** · ditto.
- **D10 Material Match** · ditto.
- **D11 Backflow Log** · ditto.

- **Goal (all):** All 11 tool pages look and feel unified. No tool stands out as "less finished" than another.
- **Fundamentals:** Per-tool: inline styles → token classes, matching shared design language, no hex literals, visible focus states, WCAG AA contrast, PDF-exportable output.
- **Invariants:** Math untouched. Existing tests pass. FLUM envelope unchanged.
- **Depends on:** D01.
- **Parallel with:** each other and with all non-D packages.
- **North-star reminder:** Pillar 2 — the signature is everywhere, uniform.

### Group E — Domain Depth

#### E01 · Jurisdictional Code Book

- **Goal:** The Code Book stops being a generic lookup and starts being a specific free alternative to paywalled codes.
- **Fundamentals:** Jurisdiction picker (US states + territories, Canadian provinces as stretch). Each jurisdiction maps to the adopted plumbing code (IPC year, UPC year, local amendments summary). For jurisdictions that publish the adopted code free online, deep-link to the official public source. Jurisdiction selection persists in localStorage. UI: dropdown or searchable list with "Detect from IP" option explicitly disabled (privacy) — the tech chooses.
- **Invariants:** Never scrape or mirror paywalled code text. Only deep-link to publicly-adopted versions the jurisdiction provides free. Dataset lives in a committed JSON file (`src/tools/code-compliance/jurisdictions.json`) so contributors can PR corrections.
- **Depends on:** D06.
- **Parallel with:** E02, E03, F-group, G-group, H-group.
- **North-star reminder:** Pillar 3 — the free alternative is the gift.

#### E02 · Top-50 common violations seed

- **Goal:** The Code Book's headline value: quick lookup of the 50 violations actually cited in the field.
- **Fundamentals:** Seed dataset (`src/tools/code-compliance/common-violations.json`) of the 50 most-cited residential and small-commercial plumbing violations, with: code section (IPC/UPC), violation description in trade language, common causes, remediation steps, and FLUM envelope output. Advisory board (A06) reviews the seed list pre-launch. UI: search + category filter (drains, vents, supply, fixtures, backflow, cleanouts).
- **Invariants:** Entries must cite code sections correctly (verified by a code official per A06). No fabricated code citations.
- **Depends on:** D06, E01.
- **Parallel with:** E03, F-group, G-group, H-group.
- **North-star reminder:** Pillar 1 — respect by solving the actual problem.

#### E03 · Slope Reader sensor/belly visualization upgrade

- **Goal:** The namesake tool ships with a visualization that makes the belly viscerally obvious.
- **Fundamentals:** SVG profile chart: horizontal distance on X, pipe invert on Y, with every station plotted. Segments that belly (downstream invert higher than upstream) render in the `--psi-bad` color with a pulsing aria-live annotation. Shows the code-minimum slope reference line for the configured pipe diameter. Mobile-legible. PDF-exportable (F01).
- **Invariants:** Math untouched — this is visualization only. Must render correctly at 320px viewport.
- **Depends on:** D01.
- **Parallel with:** E01, E02, F-group, G-group, H-group.
- **North-star reminder:** Pillar 1 — the tech sees the answer instantly.

### Group F — Export & Sharing

#### F01 · PDF export on every tool

- **Goal:** Every calculation can become a branded document in two taps.
- **Fundamentals:** Each tool page exposes a "Share" button in its result area. On desktop, triggers `window.print()` using the print CSS (already written in `home.css`). On mobile, additionally attempts Web Share API with a generated PDF blob (using `html2canvas` + `jspdf`, or native `showSaveFilePicker` where supported, or fallback to print). PDFs include: tool name, input summary, result, FLUM hint, tip, and a footer stamp ("Plumb — A Legacy AI field tool · legacyai.space · AGPL-3.0").
- **Invariants:** Every export must carry the wordmark + Legacy AI + AGPL credit. Every export must be generated client-side; zero server round-trip.
- **Depends on:** D02–D11 (each tool's page structure must be stable).
- **Parallel with:** F02, G-group, H-group.
- **North-star reminder:** Pillar 2 — every exported PDF is a calling card.

#### F02 · Share-sheet integration

- **Goal:** A tech emails a slope report to a homeowner from the truck in three taps.
- **Fundamentals:** Wire Web Share API (`navigator.share`) with the generated PDF + a text summary. Fall back to mailto: with text-only summary on browsers without Share API. The share text always includes a one-liner about Plumb + Legacy AI at the bottom.
- **Invariants:** Never share without user-initiated tap. No automatic or background shares.
- **Depends on:** F01.
- **Parallel with:** G-group, H-group.
- **North-star reminder:** Pillar 2 — distribution from every job.

### Group G — Input Modalities

#### G01 · Voice intent routing

- **Goal:** Voice input is not just dictation into a field. Voice intents land on the right tool with the right fields filled.
- **Fundamentals:** Extend the existing Web Speech API voice-input on PsiChat (already wired) so that the transcribed text flows through the entity extractor (C02) and then through `parseIntent`. The result: saying "slope reader four inch cast iron eighty feet at one percent" navigates to `/slope` with the fields pre-populated. Supports both `en-US` and `es-US` speech recognition based on current app language. Visual feedback during recognition (pulsing border, already styled in `home.css`).
- **Invariants:** No audio is recorded, stored, or transmitted. Web Speech API results go through the device's OS-level handler; the app only receives the final transcript. Always show the transcript before executing so the tech can correct.
- **Depends on:** C02 (entity extraction).
- **Parallel with:** G02, H-group.
- **North-star reminder:** Pillar 1 — respect for a tech on a ladder with no free hands.

#### G02 · Web Bluetooth sensor bridge (laser distance meter)

- **Goal:** A laser distance meter reading lands in the slope reader or pressure reader with no typing.
- **Fundamentals:** Implement a Web Bluetooth GATT client targeting the common BLE profile for laser distance meters (Leica Disto D-series is the reference; Bosch GLM 50C is the stretch). Discover + connect + subscribe to measurement notifications. Display reading in the tool's form field, with a "Confirm reading" tap to accept. Graceful degradation: the feature is hidden on browsers that don't support Web Bluetooth (Firefox, Safari desktop — Chrome Android is the primary target). Clear "Connect meter" button when supported; zero UI cost when not.
- **Invariants:** No auto-connect. User pairs every session. Device identifiers are not persisted across sessions unless the user explicitly opts in via a "Remember this meter" toggle.
- **Depends on:** D05 (Pressure Reader) and D01 (shared layer) for field integration points.
- **Parallel with:** G01, H-group.
- **North-star reminder:** Pillar 1 — "I will never uninstall this" moment.

### Group H — Public Infrastructure

#### H01 · Trade Commons HTTP API

- **Goal:** The calc engines become a public utility that any trade app can call. The moat is no longer the math — it's that everyone standardized on ours.
- **Fundamentals:** Expose the 11 calc engines as a free, rate-limited, zero-auth HTTP API. Deploy target: Cloudflare Workers or Vercel Edge Functions (both have generous free tiers and are AGPL-compatible to use). Endpoints: `/api/v1/<tool-id>` accepting POST with tool-specific params, returning the FLUM envelope. Rate limit: 60 req/min per IP. No API keys, no accounts, no logs of call content (only aggregate counts for monitoring). Source for the API worker lives in `workers/commons-api/` within this repo. Document usage in `docs/COMMONS-API.md` with code samples in curl, fetch, and Python.
- **Invariants:** Zero auth, zero account. Calls are transient — never persist request bodies. All endpoints publicly documented with OpenAPI spec.
- **Depends on:** D-group (tool engines must be stable).
- **Parallel with:** H02.
- **North-star reminder:** Pillar 3 — gift scales beyond this app.

#### H02 · GitHub repo setup

- **Goal:** A new contributor lands on the repo and knows what to do in 60 seconds.
- **Fundamentals:** Issue templates: "Bug in a tool," "Translation offer," "Jurisdictional code correction," "Advisory seat application," "Security (private)." PR template: DCO checklist + voice-guide checklist + invariant checklist. GitHub Actions CI: lint, type-check, build, tests, gzip budget (fail if bundle exceeds 150 KB gzipped total). DCO enforcement via Probot or equivalent. CODEOWNERS file for advisory-gated paths (licensing, governance). A `.github/SECURITY.md` with responsible-disclosure contact.
- **Invariants:** No closed-source GitHub Actions. CI runs only in-repo scripts. Branch protection on `main` requires green CI + DCO + one review.
- **Depends on:** A04, A05, A06, A07.
- **Parallel with:** H01.
- **North-star reminder:** Pillar 3 — capture resistance continues beyond v1.

---

## Dependency graph (ASCII)

```
A01 ── A04 ── A05 ── A06 ── A09
 │      │      │      │
 │      │      A07    │
 │      │             │
 │      └──────── A08 │
 │                    │
 A02   A03            │
                      │
 B01 ── (ships with own font payload; no blockers)
 B02 ── needs voice-copy.md
                      │
 D01 ── D02 ── F01 ── F02
   │    D03    │
   │    D04    │
   │    D05 ── G02
   │    D06 ── E01 ── E02
   │    D07
   │    D08
   │    D09
   │    D10
   │    D11
   │    E03 ── F01
   │
 C01   C02 ── G01
       C03 (depends on D01)
                      │
 H01 ── depends on D-group stability
 H02 ── depends on A04/A05/A06/A07
```

## Parallelization plan

Assuming 5 builders + 1 Douglas for voice review + 1 advisory reviewer:

**Wave 1 (kick off in parallel):**
- Builder α: A01, A02, A03, A04, A08, A09, B01 (all shell finalization + typography)
- Builder β: D01 (shared tool layer — blocks D02–D11)
- Builder γ: C01 (command palette — independent)
- Builder δ: C02 (entity extraction — independent)
- Builder ε: H02 (GitHub setup — independent)
- Douglas: drafts of voice-copy.md are already done; reviews A04's README rewrite and B02's Spanish chrome.

**Wave 2 (as D01 lands):**
- Builder α: D02 (Bid Writer migration)
- Builder β: D03, D04 (Pipe Sizer, Drain Layout)
- Builder γ: D05, D06 (Pressure Reader, Code Book)
- Builder δ: D07, D08 (Fixture Counter, ADA Check)
- Builder ε: D09, D10, D11 (Permit, Material, Backflow)
- Advisory: E02 content review kicks off (code official seat).

**Wave 3 (as tools stabilize):**
- Builder α: F01 + F02 (PDF + share sheet)
- Builder β: E01 + E02 (jurisdictional code book)
- Builder γ: C03 (local job memory)
- Builder δ: G01 + G02 (voice routing + Web Bluetooth)
- Builder ε: H01 (Trade Commons API)
- Douglas: B02 Spanish envelope review for Slope Reader.

**Wave 4 (integration):**
- Single builder: final integration, all-routes smoke test, PWA install test on iOS Safari + Chrome Android + desktop Chrome/Firefox, accessibility audit, Lighthouse run. Cut launch tag.

A single builder working serially can reasonably complete this in one extended session given the LLM-assisted code generation model. For multi-builder parallelization, the wave structure above avoids merge conflicts.

---

## Single-ship launch criteria

No launch until every item below is green. Any red item blocks launch. No exceptions.

1. `npm run build` passes. Bundle ≤ 150 KB gzipped (JS + CSS combined, excluding fonts).
2. `npm test` passes 100%. Entity extractor unit tests ≥ 95% accuracy on the 100-phrase golden set.
3. Lighthouse PWA audit scores ≥ 90 on mobile + desktop.
4. Lighthouse Accessibility ≥ 95 on every route.
5. All 11 tool routes render in both themes, both languages, and at 320px viewport without layout breaks.
6. PWA install works on: iOS Safari (Add to Home Screen), Chrome Android (install prompt), desktop Chrome (install button).
7. Offline smoke test: post-install, airplane mode, every route + calc works.
8. Print preview of every tool's result emits a Plumb-branded PDF.
9. Voice input lands on the correct tool with correct fields filled for all 100 golden-set phrases in both en and es.
10. README, CONTRIBUTING, GOVERNANCE, CODE_OF_CONDUCT, LICENSE, package.json all Plumb-branded and consistent.
11. Advisory seats row renders in footer; at least 3 seats have "Seat open" links wired.
12. `legacyai.space` link appears in footer, HomePage signoff, and every printed PDF.
13. Commons API (H01) is deployed and answers with correct FLUM envelopes for all 11 tools.
14. No occurrences of the phrase "in plain English" in any file (enforce via CI grep).
15. No occurrences of "coming soon," "in development," or "MVP" in any shipped UI string.
16. No dependency added without AGPL-compatibility verification.
17. DCO sign-off enforced on every merged commit.
18. All 5 plan documents in `plans/` reference this launch criteria section.
19. Douglas reviews and approves the launch tag personally.

## Rollback plan

- Every merged PR gets tagged. Launch tag is `v0.9.0`.
- If a critical issue is discovered post-launch, revert the specific PR and publish `v0.9.1` within 24 hours.
- PWA service worker (A02) includes a kill-switch endpoint that, when requested from the app itself via a settings action, unregisters the SW and clears the cache on the device. No remote kill switch — users control uninstall.
- If a security issue is found in a calc engine, the affected tool is disabled at runtime (feature flag in tool registry) until a fix is published. The flag defaults to enabled; disabling requires a patch release.

---

## Cross-references

- Douglas's voice, ad copy, and surface-by-surface string specs: `01-voice-copy.md`
- Licensing framework, DCO, advisory seat protocol: `02-licensing-contributors.md`
- Invariants, forbidden patterns, mandatory practices: `03-drift-guardrails.md`
- Per-role builder prompt templates: `04-deterministic-contracts.md`
