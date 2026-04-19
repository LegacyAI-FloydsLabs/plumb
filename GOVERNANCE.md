# Governance — Plumb

This document defines how Plumb is maintained, how decisions are made, and how the project stays true to its gift posture.

---

## The advisory seats

Five seats, held by people active in the trade. Seats carry hard veto rights. Seats are unpaid and three-year terms, renewable once (6-year maximum).

| Seat | Role |
|---|---|
| Master plumber | Currently licensed, active, 15+ years in the field |
| Trade-school instructor | Currently teaching at apprenticeship program or technical college |
| Code official | Current or recently-retired plumbing inspector or code-enforcement official |
| Journeyman, non-native-English-speaking | Active journeyman whose first language is not English |
| Youth apprentice | Currently in the first two years of an apprenticeship |

**Seat rights:**
- Hard veto on mission drift. Any advisor may veto a change that violates the invariants in CONTRIBUTING.md. Veto requires citing which invariant is violated.
- Code-accuracy gate. The code official approves seed data for the Code Book and jurisdictional entries.
- Voice-accuracy gate. The master plumber and trade-school instructor review new tool copy and Legacy AI voice alignment.
- Translation-accuracy gate. The non-native-English-speaking journeyman represents translation contributors and reviews Spanish and subsequent translations.

**Seat constraints:**
- No compensation. No equity. No honoraria.
- Must be active in the trade. Professional-board-sitter backgrounds disqualify unless the candidate is also active.
- Disclosure of commercial interests required. Undisclosed conflicts are cause for removal.

**Current status:** All seats are open. Apply via GitHub Discussion.

**Seat removal:** Automatic on term expiration, death, or written resignation. For cause on CoC violation, undisclosed material conflict, or verified abandonment (6+ months of no engagement). Requires unanimous remaining advisor vote plus maintainer confirmation.

---

## Maintainers

**Year 1–3:** Douglas Talley (BDFL) has final technical say but cannot override advisory-seat veto on mission-drift issues.

**After year 3:** Rotate to a 3-person maintainer council. Initial council selected by outgoing BDFL plus advisory seats. Subsequent rotations: 2-year terms, staggered for continuity.

**Maintainer commitments:** merge queue review, CI debugging, release cutting, security disclosure response, voice-bar enforcement on UI PRs.

**Maintainers cannot:**
- Accept a relicensing proposal (requires unanimous advisory + 30-day public-comment window).
- Accept a trademark transfer of "Plumb" or "Legacy AI" marks away from Legacy AI LLC.
- Accept sponsorship requiring feature placement, analytics injection, or account requirements.
- Add proprietary dependencies, telemetry, or account systems.

---

## Decision protocol

1. GitHub Discussion for most disagreements.
2. Advisory seat review for mission-drift questions (tag advisors in the discussion).
3. Unanimous advisory vote required for any change to invariants or licensing.
4. Public 30-day comment window required before any change to licensing or governance.

---

## Capture resistance

- **Relicensing requires** unanimous advisory + 30-day comment + all contributor consents.
- **No buyout path.** The project is unincorporated at the repository level.
- **Legacy AI marks are rights-reserved.** Forks under AGPL must ship without the Plumb wordmark or Legacy AI marks.
- **All governance decisions are public** — no private maintainer slacks.
- **Advisory veto defeats BDFL** on anything touching the invariants.

---

## Funding and sponsorship

**Default:** No sponsorship. The project is not asking for money.

**Hosting costs** for the Commons API are low-cost and covered by Legacy AI.

**If offered money:** Maintainers may accept unrestricted donations via GitHub Sponsors only. Restricted gifts (feature-tagged, exclusivity-tagged) are declined.

**Explicitly refused:**
- Any sponsorship requiring analytics or data access.
- Any sponsorship requiring account/login installation.
- Any sponsorship from a paywalled-reference publisher (IAPMO, ICC) — direct conflict with mission.

**Explicitly accepted:**
- Unrestricted GitHub Sponsors donations.
- Trade-school or union-hall endorsements as attribution only, no financial exchange.
- Translation-services donations (non-exclusive).

---

## Security disclosure

Report security issues to `security@legacyai.space`.

Acknowledgment within 72 hours. Fix commitment within 14 days for critical issues. Public disclosure coordinated with reporter. Default embargo: 90 days or until fix ships, whichever is sooner. Security fixes bypass the normal PR queue.

---

## Sunset clause

If Plumb cannot be maintained (Douglas unavailable, advisory seats vacant, no active maintainer council):

1. Maintainers publish a sunset notice on the repo and footer.
2. The hosted app stays running in read-only mode indefinitely.
3. The repository remains public and under AGPL.
4. Users are pointed at the most-active fork.
5. Legacy AI marks are relinquished from the hosted version after 12 months.

The gift continues, even if the giver steps away.

---

## Changing this document

Changes to governance or license require unanimous advisory vote plus a 30-day public comment window. Nothing in this document changes by a single person's decision.
