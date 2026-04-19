# Plumb — Drift Guardrails

Companion to: `00-plumb-launch-full.md`.
Purpose: prevent the project from drifting off-mission across many contributors, many passes, and long time horizons. If a PR, issue, or proposal conflicts with anything in this document, the PR/issue/proposal is wrong unless the invariant itself is explicitly revised (which requires the governance path in `02-licensing-contributors.md`).

Every builder, reviewer, translator, and contributor is assumed to have read this document before touching the codebase.

---

## Inviolable principles

These are the hard stops. No PR that violates these gets merged.

### Product posture

1. **No accounts. No login. No sign-up.** Not now, not ever. There is no "optional account for more features."
2. **No telemetry. No analytics. No tracking pixels. No third-party script tags.** Not even Plausible, Fathom, or privacy-respecting alternatives — the appearance of telemetry damages the gift.
3. **No email capture.** No newsletter. No "enter your email to download." No wait-list.
4. **No paid tier. No "Pro" version. No freemium.** The entire app, forever, for everyone.
5. **No feature gating by region, device, or any user property.** Everyone gets everything.
6. **No dark patterns.** No interstitials. No "are you sure you want to leave" confirmations that aren't strictly necessary. No cookie banners beyond what the law requires (and Plumb stores no cookies except its own localStorage key for theme/lang preference).

### Data posture

7. **Nothing leaves the device** without an explicit, user-initiated action (share sheet, print, download, export). The app never silently phones home.
8. **IndexedDB and localStorage only** for state. No cloud sync. If cloud sync ever becomes interesting, it must be opt-in, AGPL-licensed, and shipped separately.
9. **No PII is ever requested** by the app. If a user volunteers "my name" in a job-memory note, that's their choice; the app doesn't ask for it.

### Legal posture

10. **AGPL-3.0-or-later remains the license** for all first-party code in this repository. Relicensing requires the governance path in `02-licensing-contributors.md`.
11. **No CLA. DCO-only.**
12. **No dependencies that are not AGPL-compatible.**

### Accessibility posture

13. **WCAG 2.2 AA minimum** on every surface, every release. Tooling: axe-core in CI, manual screen-reader walkthrough before any launch tag.
14. **Reduced-motion honored.** Any animation must have a `@media (prefers-reduced-motion: reduce)` fallback.
15. **Target size ≥ 24×24 CSS px** on every interactive element (WCAG 2.2 SC 2.5.8). Most targets aim for 44px on touch.
16. **Focus indicator always visible and ≥ 3:1 against adjacent color.**
17. **No color-only signaling.** State (error, warning, success) must carry a text label, an icon, or a rule — never just a color.

### Offline posture

18. **Every feature works offline** after first visit. If a feature inherently needs the network (sensor-BLE pairing doesn't; Commons API DOES), it must fail gracefully with a clear offline message, never a broken page.
19. **No network-dependent loading indicators** on core flows.

### Voice posture

20. **No "in plain English"** anywhere.
21. **No "coming soon," "in development," "MVP," "beta,"** or placeholder text visible to users. If a feature isn't ready, it isn't in the shipped app.
22. **No salesman vocabulary.** See the banned-words list in `01-voice-copy.md`.
23. **Every route carries the Legacy AI fingerprint.** Header wordmark + footer credit + printed stamp minimum.

### Aesthetic posture

24. **No emoji in chrome.** Industrial-professional aesthetic. Emoji is acceptable in user-generated notes (job memory) but not in labels, buttons, headings, or action chips.
25. **No hex colors in source files.** All color must come from OKLCH tokens defined in `src/design/styles.css` or `src/design/tool.css`.
26. **Monospace type for numbers** with `font-variant-numeric: tabular-nums`. Numbers are the hero of a calc tool.

---

## Drift-prevention invariants (per layer)

### Design system

- **Tokens only.** All colors, spacings, type scales, radii, shadows, and motion durations live in CSS custom properties defined in the shell. No literal values in components.
- **Token scope.** `--psi-*` namespace for the shell; every token respects light/dark theme.
- **Legacy token scale** (`--psi-p50`, `--psi-p100`, …, `--psi-p900`) is a *stable brand amber* in both modes — never inverts. Colorized backgrounds that need white text depend on this.
- **No per-component token overrides via inline styles.** If a component needs a new token, define it globally.

### Components

- **Class names follow BEM-ish convention:** `.psi-block`, `.psi-block__element`, `.psi-block--modifier`. Existing shell uses `.psi-app__*`, `.psi-slope__*`; new tool-page layer uses `.psi-tool__*`.
- **No inline `style={{}}` objects** in new code for anything a class could handle. Existing inline styles in tool pages are tech debt scheduled for D-group migration.
- **Every interactive element is semantically correct.** `<button type="button">` for actions, `<a>` for navigation, `<form>`+`<input>` for forms. No `<div onClick>` div-buttons.
- **ARIA only where native semantics are insufficient.** Prefer `<button>` over `role="button" aria-pressed`.

### i18n

- **All UI strings go through `t(key, lang)`.** No string literals in JSX that the user reads.
- **Keys are stable.** Once a key is shipped, don't rename it without a fallback.
- **Pluralization** handled explicitly (use `plural.n` keys or a small formatter). Avoid runtime pluralization libraries — adds bytes.
- **FLUM envelope strings** (in tool engines) consume the same `t()` function. Engines accept a `lang` parameter and select the right language for `result`/`hint`/`tip`/`actions_available`.

### Testing

- **Unit tests mandatory** for all calc engines (target ≥ 95% branch coverage).
- **Integration tests** for each tool page happy path (render, fill form, submit, assert on FLUM envelope).
- **Extraction tests** (C02) against a 100-phrase golden set per language, ≥ 95% field-fill accuracy.
- **Accessibility tests** via axe-core in CI. Failures block merge.
- **Bundle-size budget** in CI: ≤ 150 KB gzipped total (JS + CSS, excluding fonts). Fonts budget separately, ≤ 90 KB gzipped combined.
- **i18n key validation** in CI: every key used in source must exist in every supported language's table, or explicitly fall back (marked).

### Security

- **No eval, no Function(), no dynamic import of user content.**
- **Input validation at system boundaries** — calc engines validate their own inputs (already done in existing code).
- **Content Security Policy** headers set by the hosting layer: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';` — `unsafe-inline` for styles only because the slope module injects some inline styles; tighten to nonces post-launch.
- **No third-party script tags.** Even Google Fonts counts. Self-host everything.
- **Secrets never in source** — but also, this app has no secrets. If you find yourself adding a secret, you're violating invariant 2 (no telemetry).

### Performance

- **Core Web Vitals targets** (WebP: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, FCP ≤ 1.5s) achieved on 3G-equivalent throttle, post-install.
- **Dynamic import** heavy libraries only if they become necessary (jsPDF for F01 is a candidate).
- **Font loading:** preload display + body + mono critical weights only. `font-display: swap`.
- **Image optimization:** all images have explicit width/height attributes. Use AVIF or WebP with PNG fallback. The PWA icon set is the only essential imagery.

### Commits and PRs

- **Conventional Commits** format: `type: description`, e.g., `feat: add command palette`, `fix: correct bid total math`.
- **Attribution off** per user preference (global setting). No `Co-Authored-By: Claude` footers.
- **One WP per PR** where feasible. If a PR bundles multiple WPs, the PR description clearly lists them and the review covers each.
- **DCO sign-off required** on every commit. CI rejects un-signed.
- **No merge commits on `main`.** Squash-merge or rebase-merge only.
- **No force push to `main`, ever.** Feature branches may be force-pushed.
- **No `--no-verify` skipping pre-commit hooks** except with explicit maintainer approval in the PR thread.

---

## Forbidden patterns (with explicit rationale)

| Pattern | Why forbidden | Use instead |
|---|---|---|
| `<div onClick={...}>` | Not keyboard-navigable, not screen-reader-announced. | `<button type="button" onClick={...}>` |
| `color: red` for errors with no text label | Color-only signaling fails WCAG 1.4.1. | Color + text label + optionally icon. |
| `style={{ color: "#0ea5e9" }}` | Bypasses token system, breaks theme switch. | Class using `var(--psi-accent)` or similar. |
| `Navigate to="/slope" replace` as the `/` route | Defeats the landing page, erases the gift framing. | `Route path="/" element={<HomePage/>}`. |
| `"in plain English"` | Exclusionary to non-native English speakers. | `"plain language"`, `"jargon-free"`, or describe behavior concretely. |
| `"Coming soon"` | Breaks the "coming now" posture. | Ship it or don't ship the label. |
| Google Fonts CDN (`<link href="fonts.googleapis.com/...">`) | Network dependency + third-party tracking vector. | Self-host via `@fontsource`. |
| `<script src="https://cdn.../analytics.js">` | Violates invariant 2 (no telemetry). | There is no alternative. Don't add it. |
| `localStorage.setItem("user_email", ...)` | No account system exists, shouldn't imply one. | Don't collect. |
| Feature flag that hides a tool by region | Gated feature violates invariant 5. | Ship the same app everywhere. |
| `interface Props { [key: string]: any }` | Bypass of type system. | Define the shape explicitly. |
| `@ts-expect-error` without a reason comment | Future maintainers can't tell if it's intentional. | Include a `TODO(#issue)` or a structured reason. |
| `export * from "./everything"` | Makes dead-code detection impossible. | Named exports of the public API only. |
| Per-route `max-width: 720px` inline | Breaks desktop widescreen fills. Tech-debt already migrated in D-group. | Use the shared `.psi-tool` layer. |
| Hardcoded hex in tool pages (`"#0ea5e9"`) | Breaks dark mode, breaks theme, breaks the brand. | Tokens. |
| Emoji in chrome labels (🔧, 📐, 📋) | Wrong register for industrial trade aesthetic. | Two-letter monospace ticker codes (SL, PS, FX, …). |
| Arrow-function components as `const X: React.FC = …` | `React.FC` adds implicit `children`, confuses prop inference. | `function X(props: XProps) { … }` or named arrow with explicit prop type. |

---

## Mandatory patterns (with rationale)

| Pattern | Why required |
|---|---|
| Per-file AGPL header on every new source file (see below) | License visibility at a glance. |
| `t("key.name", lang)` for every user-facing string | i18n gate. |
| `<button type="button">` explicitly for non-submit buttons | Prevents accidental form submissions. |
| `<form onSubmit={...}>` wraps input-submission flows | Enter-key submission works for free. |
| `aria-live="polite"` on result regions | Screen readers announce calculation results. |
| Explicit focus management on route change | Avoid losing focus to body. |
| `lang` attribute on `<html>` kept in sync with i18n state | Screen readers pronounce correctly. |
| `gap`-based flex/grid spacing | Consistent rhythm, no orphan margins. |
| One calc engine per tool with named exports | Enables H01 (Commons API) to call engines directly. |
| Unit tests colocated under `__tests__/` in each tool | Discoverability. |
| Calc-engine function signatures that return a full FLUM envelope | Uniform response shape for UI and API. |
| OKLCH color definitions (not HSL or RGB) | Perceptual uniformity across theme switch. |

## Per-file source header (required on new source files)

```
/*
 * Plumb — A Legacy AI field tool
 * Copyright (C) 2026 Legacy AI LLC and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 */
```

Existing files grandfathered — add the header on next substantive edit, not as a bulk sweep PR.

---

## Commit message conventions

Format: `<type>: <short imperative>` + optional body.

**Types (Conventional Commits):**
- `feat` — new feature visible to users
- `fix` — bug fix visible to users
- `refactor` — non-user-visible restructuring
- `docs` — documentation only
- `test` — tests only
- `chore` — tooling, CI, deps
- `perf` — performance improvement
- `a11y` — accessibility fix
- `i18n` — translation or i18n plumbing

**Examples of good messages:**
- `feat: add command palette overlay with fuzzy tool search`
- `fix: grand-total banner contrast in dark mode (Bid Writer)`
- `i18n: add Spanish translation for Slope Reader FLUM envelope`
- `a11y: raise dismiss-button target size to 32×32 (SC 2.5.8)`
- `docs: rewrite README for Plumb public identity`

**Examples of bad messages (reject):**
- `update stuff` (no type, no specificity)
- `wip` (not a user-visible change summary)
- `🚀 ship it!` (emoji, non-descriptive)
- `Merge pull request #123` (auto-generated merges disallowed)

## Branch conventions

- `main` — protected, always green, always deployable.
- `feat/<short-name>` — feature branches.
- `fix/<short-name>` — bug fix branches.
- `release/<tag>` — release staging branches.
- No long-running forks off main beyond 2 weeks without rebasing.

## Rejection criteria for PRs

Any PR exhibiting the following is rejected on sight, no "partial credit":

- Violates any inviolable principle (1–26 above).
- Adds a dependency that isn't AGPL-compatible.
- Introduces a `console.log` in production code.
- Introduces a `TODO` without a linked issue.
- Removes a translation key without adding a fallback.
- Changes licensing, governance, or this document without the governance path.
- Adds tracking, analytics, or account scaffolding (invariant 1, 2).
- Adds a route that is not localized.
- Lacks DCO sign-off on any commit.
- Fails CI (lint, type-check, build, tests, bundle-size, i18n-key validation, WCAG audit, DCO).

## Review checklist (maintainers use this, in this order)

1. **Invariant compliance.** Scan for violations of principles 1–26.
2. **Voice check.** Any user-visible string reviewed against `01-voice-copy.md`.
3. **Token purity.** Grep for hex literals, inline styles with color values — reject if found in new code.
4. **Accessibility.** Run axe-core locally or review the CI report.
5. **i18n completeness.** New strings have en + es entries at minimum.
6. **Test coverage.** New functions have tests; calc engine changes have unit tests.
7. **Bundle size.** Check the delta; reject if unreasonable.
8. **Documentation.** If the change affects contributor behavior, CONTRIBUTING updated.
9. **Screenshots.** UI changes include before/after screenshots in the PR.
10. **DCO.** Every commit signed off.

Only after 1–10 are clean does the reviewer approve.

## Escalation path for disagreements

1. PR thread — most discussions land here.
2. Related GitHub Discussion — if the disagreement is philosophical or affects governance.
3. Advisory-seat review — triggered by tagging advisors in the discussion; especially for mission-drift questions.
4. Unanimous-advisory vote required for any proposal that changes invariants or licensing.
5. Public 30-day comment window required for any change to licensing or governance.

Nothing in this document is changed by a single person's decision. Drift happens when one person decides something quietly.
