# slope-calculator SSOT (Single Source of Truth)

**Created:** 2026-04-19T06:24:24-0400
**Last Updated:** 2026-04-19T10:45:00-0400
**Governance:** .supercache/ v1.3.0

> **Compliance Notice:** This file must match the structure at
> `.supercache/templates/ssot-template.md`. This is the authoritative
> document for architecture and programmatic change facts of **slope-calculator**.

---

## Authority

This document is the **single source of truth** for architecture and programmatic change facts of slope-calculator. All other documents must be treated as **potentially flawed** unless their facts are confirmed here.

When a fact in any other document contradicts this SSOT, the SSOT wins. If the SSOT itself is wrong, it is corrected via the **Verification Sweep Protocol** below, not by editing other documents to match.

---

## Verification Sweep Protocol (required on every read)

When an agent reads this SSOT to perform a task:

1. Perform a **line-by-line verification review** of the sections relevant to the current task.
2. For each verified fact, append a verification entry to the **Verification Log** at the bottom of this file with:
   - Timestamp (`YYYY-MM-DD HH:MM TZ`)
   - Section/line reference
   - Evidence source (code path + line, command + output, build log, runtime behavior, etc.)
   - Confidence = 100%
3. If any fact cannot be verified to 100% confidence:
   - Mark it **UNVERIFIED** inline in the section where it appears
   - Add an entry to `Issues/slope-calculator_ISSUES.md` to track the discrepancy
   - Do NOT proceed on the assumption that the fact is true

### Positive Reinforcement (required)

For each fact verified at 100% confidence during a sweep, emit the acknowledgement:

```
Verified as fact (100%): <fact summary>
```

This pattern is deliberate — it reinforces evidence-first thinking and makes the verification record auditable after the fact.

---

## Current State

**Phase:** Active development
**Status:** Active
**Last Agent Session:** 2026-04-19 10:45 EDT

---

## Architecture Facts

- PWA client + optional Cloudflare Worker API. Worker routes all computation through FLUM compute() (One Door In). OpenAPI spec at workers/commons-api/openapi.yaml. Worker is deployable but not yet hosted.
- 3 runtime dependencies only: react, react-dom, react-router-dom. Zero server-side dependencies.
- 11 tools, each with identical structure: `calc.ts` (pure function, no side effects) + `*Page.tsx` (UI) + unit tests.
- FLUM orchestration in `src/llm/flum.ts` is the single compute entry point. No tool has its own API surface.
- Entity extraction in `src/llm/extract.ts` is regex-only. No LLM dependency at runtime.
- `src/sensors/index.ts` exports only the `SensorSource` type (7 string literals). No adapter, no scoring, no runtime sensor integration. The comment says "will be restored when native sensor integration is implemented."
- No jurisdiction database. `permit-navigator/calc.ts` has hardcoded illustrative fee data with comments saying "Fees vary by jurisdiction."
- No violations dataset. `code_compliance` has a violation keyword in `TOOL_KEYWORDS` for routing only.

### Stack

- **Primary language**: TypeScript (ES2022, strict)
- **Framework**: React 18.3 + Vite 5.4 (SPA, no SSR)
- **Runtime**: Node.js 20 (dev/test), browser (production)
- **Module system**: ESM

### Key architectural choices

1. **FLUM One Door In**: All tool compute flows through `compute()` in `src/llm/flum.ts`. `parseIntent()` routes to the right tool handler. No bypass, no alternative entry point.
2. **Pure calc engines**: Every tool's `calc.ts` is a pure function with zero side effects. UI pages consume calc results. Tests test calc functions directly.
3. **Regex-only extraction**: `src/llm/extract.ts` parses diameter, slope, material, fixture, and pipe type from natural language text. No LLM calls, no external services.
4. **Zero-runtime-dep policy**: Only 3 runtime deps (react, react-dom, react-router-dom). All 11 tools are pure TypeScript math.
5. **PWA with service worker**: `public/sw.js` provides precache + runtime cache for offline use. No push notifications, no background sync.

---

## Key Decisions

| Date | Decision | Rationale | Decided By |
|---|---|---|---|
| 2026-04-19T06:24:24-0400 | Initialized SSOT | Governance compliance | FLOYD v4.6 |
| 2026-04-19T10:45:00-0400 | Port 17449 (was 17448) | Port 17448 claimed by legacy-ai-website in port-registry.json | FLOYD v4.6 |
| 2026-04-19T10:45:00-0400 | GitHub org LegacyAI-FloydsLabs/plumb | Public repo under Legacy AI org | Douglas Talley |

---

## Dependencies

| Dependency | Version | Purpose | Criticality |
|---|---|---|---|
| react | ^18.3.1 | UI framework | critical |
| react-dom | ^18.3.1 | DOM renderer | critical |
| react-router-dom | ^6.30.3 | Client-side routing | critical |
| typescript | ^5.6.3 | Type checking | dev-only |
| vite | ^5.4.10 | Build tool + dev server | dev-only |
| vitest | ^2.1.4 | Test runner | dev-only |
| @vitejs/plugin-react | ^4.3.3 | React Fast Refresh | dev-only |

---

## Deployment

| Environment | URL / Location | Status | Last Deploy |
|---|---|---|---|
| production | https://legacyai.space (TBD) | not yet deployed | TBD |
| local | http://localhost:17449 | dev | N/A |
| GitHub | https://github.com/LegacyAI-FloydsLabs/plumb | live | 2026-04-19 |

---

## Known Patterns & Lessons

| Pattern | Trigger | Fix | Confidence |
|---|---|---|---|
| Unicode in source | Editing source with bash heredocs/sed | Use write/edit tools, never bash string ops. The ″ (double prime) character was corrupted in SlopeCalculator.tsx during 2026-04-18 session, causing TS1127/TS1002. | 1.0 |
| Fraction regex ambiguity | parseDiameter encounters bare fractions like "3/4" | Require unit suffix for fractions ("3/4 inch" ok, bare "3/4" rejected). Bare fraction could be a slope ratio. | 1.0 |
| Entity multi-match | Multiple fixtures/pipes in one input | Use scanMultiMatch() with offset tracking for non-overlapping matches. Single-match parsing misses additional entities. | 1.0 |
| Port conflict | Dev server won't start on expected port | Check port-registry.json first. Project uses 17449 (adjacent to legacy-ai-website on 17448). | 1.0 |

---

## Verification Log (append-only)

Every sweep of this SSOT must append one or more entries here. Never edit or remove existing entries.

| Timestamp | Section / Line | Fact Verified | Evidence Source | Confidence |
|---|---|---|---|---|
| 2026-04-19T06:24:24-0400 | Authority | Document initialized as SSOT | bootstrap.sh --init created from template | 100% |
| 2026-04-19T10:45:00-0400 | All sections | Full SSOT population with code-verified facts | grep, read, git log, node -e across all src/ files | 100% |

---

## Change Log (append-only)

- 2026-04-19T06:24:24-0400 — Initialized SSOT.
- 2026-04-19T10:45:00-0400 — Populated all sections with code-verified architecture facts. Removed placeholder comments.

---

## Mandatory execution contract

For EACH requested item:
1) Show exact action taken
2) Show direct evidence (file/line/command/output)
3) Show verification result
4) Mark status only after proof

## Forbidden behaviors

- Declaring "done" without evidence
- Collapsing multiple requested items into one vague summary
- Skipping failed steps without explicit blocker report

## Required output structure

A) Requested items checklist
B) Per-item evidence ledger
C) Verification receipts
D) Completeness matrix (item -> done/blocked -> evidence)

## Hard gate

If any requested item has no evidence row, final status MUST be INCOMPLETE.
