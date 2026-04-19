# Contributing to Plumb

Plumb is a gift from Legacy AI to the plumbing trade. Contributions are welcome from anyone who respects the work.

---

## What we accept

### Translations

Plumb ships in English and Spanish at launch. Additional languages are welcome. A language is "complete" when every UI string is translated and at least one tool's FLUM envelope is localized. Partial languages are welcome — they render translated strings where available with English fallback and a visible **"Help translate to [language] → CONTRIBUTING.md"** banner.

To contribute a translation:
1. Open an issue declaring the language and scope (chrome-only, or chrome + specific tool).
2. Submit a PR against `src/design/i18n.ts` for chrome strings; against the tool's `calc.ts` file for FLUM envelope strings.
3. Native-speaker review required. If you're machine-translating, state it in the PR so the community can add the trade-native review layer.

### Jurisdictional code data

Jurisdictions are tracked in `src/tools/code-compliance/jurisdictions.json`. A PR adds or corrects an entry: state/province, adopted-code reference, version, official public-source URL, effective date, amendment notes.

Review: at least one maintainer review and ideally a code-official advisory-seat review.

### Domain corrections

Trade professionals — master plumbers, code officials — may submit corrections to any calc engine, voice copy, or jurisdictional entry via GitHub Issue or Discussion. Maintainers convert these to PRs on the contributor's behalf and credit them in the commit message.

### Accessibility fixes

WCAG 2.2 AA compliance is a hard floor. Accessibility improvements are always welcome. Run `axe` or use your browser's accessibility inspector and open an issue or PR.

### Code improvements

New features, refactors, and bug fixes. See the code contribution protocol below.

---

## What we do not accept

- Analytics, telemetry, or tracking of any kind.
- Account or login systems.
- Paid tiers or feature gating.
- Dependencies incompatible with AGPL-3.0-or-later.
- Dark patterns, cookie interstitials beyond legal minimum, or email capture.
- Contributions from accounts that do not comply with the DCO (see below).

---

## DCO — Developer Certificate of Origin

Every commit merged to `main` must carry a `Signed-off-by: Real Name <email@example.com>` trailer via `git commit -s`.

This binds you to the [DCO v1.1](https://developercertificate.org/) terms, affirming you wrote the code or have the right to contribute it under AGPL-3.0-or-later.

CI rejects commits without a sign-off.

No CLA. DCO only — deliberately. No copyright assignment, no relicensing risk.

---

## Code contribution protocol

1. Fork → feature branch.
2. Implement. Run `npm test` and `npm run build` — both must pass locally.
3. Any user-facing string must match the voice guide (`plans/01-voice-copy.md`) or be translatable-consistent.
4. Submit a PR. PR template requires: DCO sign-off confirmation, invariant compliance checklist, screenshots of any UI change, accessibility check statement, bundle-size impact statement.
5. CI runs: type-check, lint, build, tests, bundle-size budget, i18n key validation, WCAG 2.2 AA automated check (axe-core), DCO check.
6. Review: at least one maintainer approval. UI changes additionally require voice review.
7. Merge: squash-and-merge or rebase-and-merge only. No merge commits to `main`.

---

## Advisory seats

Five seats, held by people active in the trade. Seats carry hard veto rights on any change that violates the project's invariants. Three-year terms, unpaid, renewable once.

To apply, open a GitHub Discussion titled `Seat application — [seat title]` and include your name, trade or role, years active, and one paragraph on why the seat is a fit.

Current open seats:
- **Master plumber** — apply →
- **Trade-school instructor** — apply →
- **Code official** — apply →
- **Journeyman, non-native-English-speaking** — apply →
- **Youth apprentice** — apply →

See [GOVERNANCE.md](GOVERNANCE.md) for the full seat charter.

---

## Invariants

This project has non-negotiable invariants. If a change conflicts with any of these, the change is wrong — not the invariant.

1. No accounts, login, telemetry, tracking, email capture, or paid tiers. Ever.
2. AGPL-3.0-or-later stays the license for all code.
3. Nothing leaves the device unless the user explicitly exports or shares.
4. Every tool works offline after first visit.
5. WCAG 2.2 AA minimum on every surface.
6. English and Spanish reach feature parity at launch.
7. Every printed or shared artifact carries the Plumb wordmark and `legacyai.space` credit.
8. No "in plain English" phrasing — the workforce is substantially non-native-English-speaking.
9. No "coming soon," "in development," or tier-gated features visible in the shipped app.

---

## Tool-page CSS inventory

Tool pages use the `.psi-tool` class family from `src/design/tool.css`. When migrating or adding a tool, use these classes — do not use inline styles for color or spacing.

Classes available:

| Class | Purpose |
|---|---|
| `.psi-tool` | Root wrapper for a tool page |
| `.psi-tool__section` | Major content section |
| `.psi-tool__field` | Form field group |
| `.psi-tool__chip-row` | Horizontal chip/tag row |
| `.psi-tool__chip` | Individual chip or tag |
| `.psi-tool__input` | Text/number input |
| `.psi-tool__button` | Standard action button |
| `.psi-tool__button--primary` | Primary CTA button |
| `.psi-tool__button--ghost` | Ghost/secondary button |
| `.psi-tool__numeric-readout` | Large numeric result display |
| `.psi-tool__table` | Data table |
| `.psi-tool__details` | Collapsible detail section |
| `.psi-tool__warning` | Warning or caution message |
| `.psi-tool__grand-total` | Grand-total banner (amber brand scale) |

All tokens come from `src/design/styles.css` — no hex literals in tool TSX files.

---

## Setup for local development

```bash
git clone https://github.com/legacyai/plumb.git
cd plumb
npm install
npm run dev       # dev server on port 17449
npm test          # unit tests
npm run build     # production build
```

TypeScript strict mode is enforced. No new `any` types. No `@ts-expect-error` without a linked issue.
