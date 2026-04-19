# Plumb — Licensing & Contributor Framework

Companion to: `00-plumb-launch-full.md`.
Purpose: lock the project's legal and governance posture so that the "gift" framing cannot be reversed by any single person, sponsor, or future maintainer.

---

## License decision: AGPL-3.0-or-later

- **Canonical license text:** `LICENSE` at repo root. Verbatim GNU AGPL-3.0 from `https://www.gnu.org/licenses/agpl-3.0.txt`.
- **SPDX identifier:** `AGPL-3.0-or-later`.
- **Why AGPL (not MIT, not Apache-2.0, not GPL-3.0):**
  - MIT and Apache let a competitor fork, close, and sell. That defeats the gift.
  - GPL-3.0 has a SaaS loophole — someone can host a modified version as a web service without releasing source.
  - AGPL-3.0 closes the SaaS loophole. Any hosted derivative must publish its source. This is the legal expression of "nobody can close it and sell it back."
- **`or-later` clause:** gives future maintainers the option to adopt future FSF-published AGPL versions if FSF improves the license.
- **Per-file headers:** required on every new source file (see template in `03-drift-guardrails.md`).

## What the license binds

Plumb's AGPL covers the shell, all 11 tool implementations, the entity extractor, the command palette, the PWA service worker, the Web Bluetooth sensor bridge, the Commons API worker, all CSS, all i18n data files, all jurisdictional code metadata files.

## What the license does **not** cover

- The Legacy AI wordmark, "Plumb" wordmark, Douglas's likeness, and the legacyai.space logo. These are rights-reserved brand marks. Forks may exist under AGPL but may not use the Plumb wordmark or Legacy AI marks in user-facing surfaces without written permission.
- The jurisdictional code text itself when linked-to. Public-adopted plumbing code is owned by its adopting jurisdiction (many jurisdictions adopt IAPMO's UPC or ICC's IPC by reference; those model codes are copyrighted by IAPMO/ICC). Plumb never mirrors the code text — it deep-links only to publicly-accessible adopted versions.
- External fonts if any are bundled — each font carries its own license (e.g., OFL-1.1 for Inter/Space Grotesk). Compliance documented in `docs/THIRD-PARTY-NOTICES.md`.

## Copyright holders

- Douglas Talley / Legacy AI LLC as the initial copyright holder.
- Contributors retain copyright in their contributions. The DCO sign-off affirms they have the right to submit.
- No CLA (Contributor License Agreement) — deliberately. CLAs concentrate copyright in one entity and enable relicensing; the AGPL-without-CLA arrangement prevents any single future holder from closing the project.

## DCO — Developer Certificate of Origin

Every commit merged to `main` must carry a `Signed-off-by: Real Name <email@example.com>` trailer via `git commit -s`. This binds the contributor to the DCO v1.1 terms (`https://developercertificate.org/`), affirming they wrote the code or have the right to contribute it under the project license.

- **Enforcement:** CI check rejects un-signed commits.
- **No anonymous contributions merged.** Pseudonyms are acceptable if they correspond to a stable identity; fully anonymous sign-offs get bounced.
- **Why this is strong enough:** Every major Linux-kernel-style project ships under DCO. It's the minimum ceremony that provides enforceable provenance without a CLA.

## Contribution paths

Five classes of contribution, each with a protocol. All flow through GitHub PRs unless specified.

### Code contribution

1. Fork → feature branch.
2. Implement in the relevant work package scope (see `00-plumb-launch-full.md`).
3. Run `npm test`, `npm run build` — both must pass locally.
4. Voice check: any user-facing string must match the voice guide (`01-voice-copy.md`) or be translatable-consistent.
5. Submit PR. PR template requires: DCO sign-off confirmation, invariant compliance checklist, screenshots of any UI change, accessibility check statement, bundle-size impact statement.
6. CI runs type-check, lint, build, tests, bundle-size budget, i18n key validation, WCAG 2.2 AA automated check (axe-core), DCO check.
7. Review: at least one maintainer approval. UI changes additionally require voice review (Douglas or designated reviewer).
8. Merge: squash-and-merge or rebase-and-merge only. No merge commits to `main`.

### Translation contribution

1. Open an issue declaring the language and the scope (chrome-only, or chrome + engine N).
2. Submit PR against `src/design/i18n.ts` for chrome strings; against the tool-engine file for FLUM envelope strings.
3. PR must be reviewed by a native speaker who is active in the trade, or must openly state "machine-translated, review sought" so the community can add the trade-native review layer.
4. "Complete" for a language: every chrome string translated + at least one tool's FLUM envelope. At that point the language appears in the language switcher.
5. "Partial" languages are welcome. They render translated strings where available and English fallback elsewhere, with a visible invite-to-contribute banner.

### Jurisdictional code data contribution

1. Jurisdictions are tracked in `src/tools/code-compliance/jurisdictions.json`.
2. A PR adds or corrects an entry: state/province, adopted-code reference, version, official public-source URL, effective date, amendment notes.
3. Review: at least one maintainer review + ideally a code-official advisory-seat review. For entries from an active code official, advisory-seat review is sufficient.
4. Contributors must cite the adopting authority's public record (usually state legislature or county ordinance).

### Domain correction contribution (master plumbers, code officials)

1. Trade professionals may submit corrections to any calc engine, voice copy, or jurisdictional entry via GitHub Issue or a Discussion post — not every contributor is comfortable with PRs.
2. Maintainers convert to PR on the contributor's behalf, crediting them in the commit message and `CONTRIBUTORS.md`.
3. Domain contributors who want formal advisory-seat consideration route through the seat-application process.

### Advisory-seat application

1. Open a GitHub Discussion in the `Advisory Seats` category titled `Seat application — [seat title]`.
2. Include: name, trade or role, years active, one paragraph on why the seat is a fit, any public profile (LinkedIn, license record, apprenticeship program affiliation).
3. Existing advisors + maintainers review on a 30-day cycle. Decisions posted publicly in the same thread.
4. Seat charter (below) governs decision rights once seated.

## Advisory seat charter

Five seats, fixed titles:

1. **Master plumber** — currently licensed, active, with ≥ 15 years in the field.
2. **Trade-school instructor** — currently teaching at an apprenticeship program or technical college.
3. **Code official** — current or recently-retired plumbing inspector or code-enforcement official.
4. **Journeyman, non-native-English-speaking** — active journeyman whose first language is not English; represents the workforce-translation priority.
5. **Youth apprentice** — currently in the first two years of an apprenticeship; represents the next-generation perspective.

### Seat rights

- **Hard veto on mission drift.** Any advisor may veto a proposed change that violates the inviolable invariants in `00-plumb-launch-full.md`. The veto must cite which invariant is violated. Veto is resolvable only by re-proposing without the violation or by a unanimous vote of the remaining advisors.
- **Code-accuracy gate.** The code official seat approves seed data for the Code Book (E02) and jurisdictional entries (E01). No code content ships that they haven't reviewed or explicitly delegated.
- **Voice-accuracy gate.** The master plumber and trade-school instructor seats review new tool copy and Legacy-AI voice alignment for domain accuracy (does it match what's actually said in the field?).
- **Translation-accuracy gate.** The non-native-English journeyman seat represents translation contributors and reviews Spanish and subsequent translations for trade plausibility.

### Seat constraints

- **Unpaid.** Advisors serve without compensation. No equity (there is no equity — Plumb isn't a company). No honoraria. This keeps the seat about mission, not money.
- **Term: 3 years, renewable once.** 6 years maximum. After 6 years, mandatory rotation. This prevents advisory capture by tenure.
- **No board-sitters.** Advisors must be active in the trade. Professional-director backgrounds disqualify unless the candidate is also active in the trade.
- **Disclosure.** Advisors disclose any commercial interest in plumbing-trade software or adjacent businesses. Conflicts of interest don't automatically disqualify, but undisclosed conflicts are cause for removal.
- **Visible.** Seat-holders' names appear in the site-wide footer and `GOVERNANCE.md`. Open seats appear as "Seat open · apply →".

### Seat removal

- Automatic: term expiration, death, written resignation.
- For cause: violation of the Code of Conduct, undisclosed material conflict, or verified abandonment (no engagement for 6+ months). Removal requires unanimous vote of remaining advisors + maintainer confirmation.

### Filling vacant seats

- Maintainer posts a visible "Seat open" call in the footer and on GitHub.
- Applications via GitHub Discussion (above).
- Selection: existing advisors + maintainer collectively nominate and confirm. Aim for breadth: geographic, language, and career-stage diversity.

## Maintainer role

- **Benevolent Dictator** model for the first 3 years (Douglas). BDFL has final technical say but cannot override advisory-seat veto on mission-drift issues.
- **After year 3:** rotate to a 3-person maintainer council. Initial council selected by the outgoing BDFL + advisory seats. Subsequent rotations: 2-year terms, staggered so there's always continuity.
- **Maintainer commitments:** merge queue review, CI debugging, release cutting, security-disclosure response, voice-bar enforcement on UI PRs.
- **Maintainers cannot:**
  - Accept a relicense proposal (requires unanimous advisory + 30-day public-comment window).
  - Accept a trademark transfer of "Plumb" or "Legacy AI" marks away from Legacy AI LLC.
  - Accept sponsorship that requires feature placement, analytics injection, or account requirements.
  - Add proprietary dependencies, telemetry, or account systems.

## Capture resistance

- **Relicensing requires unanimous advisory + 30-day comment.** In practice, with DCO-only contribution and many contributors, relicensing would additionally require all contributor consents, which is intentionally hard.
- **No buyout path.** There is no equity to buy. The project is unincorporated at the repository level.
- **Legacy AI marks are rights-reserved.** If someone forks Plumb under AGPL, they must ship without the Legacy AI marks or wordmark.
- **Advisory veto defeats BDFL.** On anything touching the invariants, advisors override.
- **All governance decisions are visible.** No private maintainer slacks. All decision threads on GitHub Discussions.

## Sponsorship & funding stance

- **Default:** no sponsorship. The project is not asking for money.
- **Hosting costs** for the Commons API (H01) are low-cost and covered by Legacy AI without external funding as a matter of policy.
- **If offered money:** Maintainers may accept unrestricted donations via GitHub Sponsors only. Restricted gifts (feature-tagged, exclusivity-tagged) are declined.
- **Explicitly refused:**
  - Any sponsorship that requires analytics or data access.
  - Any sponsorship that requires account/login installation.
  - Any sponsorship from a paywalled-reference publisher (e.g., IAPMO, ICC) — direct conflict with mission.
- **Explicitly accepted if offered:**
  - Unrestricted GitHub Sponsors donations.
  - Trade-school / union-hall endorsements (as attribution only, no financial exchange).
  - Translation-services donations (non-exclusive — any trade-verified translator may still contribute).

## Third-party dependencies

Every production dependency must:

1. Be AGPL-compatible (MIT, Apache-2.0, BSD-*, ISC, CC0, Unlicense — most permissive licenses work; GPL-compatible copyleft is fine; AGPL itself is fine).
2. Be actively maintained (activity in the last 12 months).
3. Have no known unfixed high-severity CVE.
4. Have a clearly-identified upstream maintainer or foundation.
5. Bring demonstrable value over a hand-rolled implementation (don't add `left-pad`).

Dependency additions require a maintainer review. The PR must include: upstream link, license SPDX, alternatives considered, and bundle-size impact.

## Trademark and attribution

- **"Plumb" (project name), "Field Library," and the Plumb wordmark:** rights-reserved marks of Legacy AI LLC. Permission granted to use the name in factual references ("the Plumb app"), press coverage, academic citations, and documentation about the project. Permission not granted for derivative products, competitive forks, or merchandise.
- **"Legacy AI":** rights-reserved mark of Legacy AI LLC. Same rules.
- **Forks under AGPL:** must ship without the "Plumb" wordmark and Legacy AI marks. The fork must pick its own name. This is a policy choice to keep the "gift from Legacy AI" framing intact — forks are welcome, impersonation is not.
- **Required attribution in derivative works:** every AGPL-compliant derivative must credit Plumb and Legacy AI prominently per AGPL §5 (preserve copyright notices, license text, and attribution strings in source and user-facing documentation).

## Code of Conduct

- Adopts **Contributor Covenant 2.1** verbatim with three additions:
  1. **Welcome non-native-English contributors** explicitly. English is the project's primary language for source comments and maintainer communication, but contributors should not be shamed for grammatical errors, and maintainers will not enforce "English-only" in issue threads — translation aid is welcomed.
  2. **Welcome trade professionals** who may be new to GitHub workflows. Maintainers will convert trade-professional issue reports into PRs on their behalf without penalty.
  3. **Zero tolerance for paywall-defense harassment.** Advocates or employees of paywalled-code publishers may not harass contributors over the project's mere existence. Legitimate licensing discussion is welcome; intimidation campaigns are not.
- **Enforcement contact:** `conduct@legacyai.space` (project-owned, monitored by maintainers collectively — not Douglas's personal inbox).
- **Enforcement actions:** warning → temporary ban → permanent ban, per the Covenant's enforcement ladder.

## Security disclosure

- `.github/SECURITY.md` names a security-disclosure contact.
- Security issues disclosed to `security@legacyai.space` get an acknowledgment within 72 hours and a fix commitment within 14 days for critical issues.
- Public disclosure coordinated with the reporter; default embargo 90 days or until fix ships, whichever is sooner.
- Security fixes bypass the normal PR queue (maintainer discretion).

## Sunset clause

If the project cannot be maintained (Douglas unavailable, advisory seats vacant, no active maintainer council):

1. Maintainers (or last active advisor) publishes a sunset notice on the repo and footer.
2. The hosted app (`legacyai.space`-adjacent hosting) is kept running in read-only mode indefinitely.
3. The repository remains public and under AGPL.
4. Users are pointed at the most-active fork.
5. Legacy AI marks are relinquished from the sunsetted hosted version after 12 months; the sunset repo becomes rename-encouraged.

This clause exists so users never find the app pulled from under them. The gift continues, even if the giver steps away.
