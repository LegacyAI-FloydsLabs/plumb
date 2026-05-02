# Plumb canonical benchmark prompts

**Purpose.** This file is the **single source of truth** for the prompt strings
used in both:

1. The Plumb browser smoke test (Gate G7 of the design spec), which runs the
   fine-tuned FunctionGemma ONNX via transformers.js in Chromium and asserts
   each prompt produces a correct tool call.
2. The training workspace's R6 benchmark
   (`/Volumes/SanDisk1Tb/HFModels/Training/plumb-functiongemma/scripts/benchmark.py`),
   which runs the same prompts against the fused f16 HF model and the
   Q4_K_M GGUF for the 3-seed accuracy + quality-delta report.

Both sessions must read prompt strings from this file, not invent their own.
If strings diverge, the sessions' accuracy numbers are not comparable.

---

## Layer-1 only

**Important.** The fine-tuned model is trained on Layer 1 schemas only — the
SLM-safe surface of ≤ 3 required fields per tool. The tools the model sees
in every prompt are derived from `layer1_tools.json`, not `layer2`. This
means:

- Optional Layer 2 fields (`pct`, `pipeDiameterIn`, `code`, `occupancy`,
  `action`, `include_advanced`, etc.) are **not visible** to the model and
  **cannot appear** in its emitted tool calls.
- Every expected-shape example below lists only Layer 1 parameters.
- Prompts must contain enough information for the Layer 1 required fields
  to be filled.

The prior revision of this document included Layer 2 shapes for P1 / P3 /
P5; those expectations are architecturally unreachable by a Layer-1 model
and have been replaced with Layer-1-compliant prompts and shapes.

Revision history at the bottom of this file.

---

## The five prompts

Each row is one benchmark record. The `expected` column is the correct FLUM
tool call (single-tool) or plan (multi-tool).

### P1 — English slope from field stations

**Prompt:**

> Got two stations: at 0 feet, rod reading 4.5, depth 3.2. At 50 feet, rod reading 5.75, depth 4.1.

**Expected behavior:** Route to `slope` with `stations` as a list of two
objects. Each station's fields match the Layer 1 `STATION_SCHEMA`:
`label` (integer), `distance` (feet), `rodReading` (rod value), `depth`
(feet).

**Expected shape:**

```json
{
  "name": "slope",
  "arguments": {
    "stations": [
      {"label": 1, "distance": 0, "rodReading": 4.5, "depth": 3.2},
      {"label": 2, "distance": 50, "rodReading": 5.75, "depth": 4.1}
    ]
  }
}
```

Scoring: `tool_id` must be `slope`; both stations must be present;
numeric values within ±5 %; `label` tolerant (model may use `1/2` or
`"A"/"B"` if the training schema permitted scalar labels — see
schema note in `tool_registry.json`).

### P2 — Fixture counting

**Prompt:**

> 3 bathroom groups, private, count the DFUs

**Expected behavior:** Route to `fixture_counter` with `bathroom_groups: 3`.
`fixtures` is an optional Layer 1 object; omitting it is correct.
`occupancy` is a Layer 2 field — the model will not emit it and that is
correct. The word "private" in the prompt serves as context for the human
verifier, not as a parameter.

**Expected shape:**

```json
{
  "name": "fixture_counter",
  "arguments": {"bathroom_groups": 3}
}
```

### P3 — Spanish slope from field stations (trade-fluent)

**Prompt:**

> Dos estaciones: en 0 pies, lectura de regla 4.5, profundidad 3.2. En 50 pies, lectura de regla 5.75, profundidad 4.1.

**Expected behavior:** Same tool as P1 — `slope` with a `stations` array of
two objects. This prompt exercises the Spanish trade vocabulary head of
the fine-tune. "Regla" is the plumber term for a reading rod; "pies" is
feet; "profundidad" is depth.

**Expected shape:** identical to P1.

Scoring: same as P1. Spanish accuracy must land within 5 pp of English
accuracy on this prompt (gate G3).

### P4 — Multi-tool plan (bathroom remodel)

**Prompt:**

> bathroom remodel in Austin, 3 baths

**Expected behavior:** Emit a plan of multiple tool calls covering the
remodel workflow. The minimum acceptable set in order:

1. `fixture_counter` with `bathroom_groups: 3`
2. `pipe_sizer` with `wsfu` and `dfu` derived from step 1's output
3. `permit_navigator` with `description: "bathroom remodel"`
4. `bid_generator` to assemble the estimate

Acceptable variants:
- Order 1 → 2 → 4 → 3 (permits after the bid is drafted)
- Adding `code_compliance` lookups between steps
- Including `drainage_designer` if the model infers full rough-in scope

Unacceptable:
- Single-tool response (treat as wrong routing)
- Skipping either `fixture_counter` or `bid_generator`

Each tool call must satisfy its own Layer 1 required fields:
- `fixture_counter` — no required fields (both `fixtures` and
  `bathroom_groups` optional at Layer 1)
- `pipe_sizer` — `wsfu` AND `dfu` required
- `permit_navigator` — `description` required
- `bid_generator` — no required fields

### P5 — Code-book lookup

**Prompt:**

> look up trap arm length

**Expected behavior:** Route to `code_compliance` with a `query` parameter.
`code` is a Layer 2 field — the model will not emit it.

**Expected shape:**

```json
{
  "name": "code_compliance",
  "arguments": {"query": "trap arm length"}
}
```

A correct call must include `query` with a string that captures the
intent of the user's question. Exact string match is not required —
any semantically equivalent phrasing is acceptable (e.g., `"trap arm
maximum length"`, `"IPC trap arm length"`).

---

## How the prompts are scored

Both sessions use the same tolerance policy:

| Check | Pass criterion |
|---|---|
| Tool ID | Exact match to `name` field |
| Required Layer 1 params | All present per tool's `required[]` in `layer1_tools.json` |
| Numeric param values | Within ±5 % (floating-point tolerance) |
| String enum param values | Exact match |
| Free-text string params | Semantic match via 24B-verifier (yes/no) |
| Multi-tool plan (P4 only) | Tool sequence contains the minimum required set, order flexible per "acceptable variants" above; each call satisfies its own Layer 1 required fields |

**Out-of-schema emissions (Layer 2 fields):** the model should not emit
Layer 2 fields. If it does (e.g., outputs `pct` on a slope call), the
call is still scored by Layer 1 requirements — extra fields do not fail
a call, but they also do not earn credit.

Output parsing for both sessions uses the **shared parser** at
`src/llm/reference/functiongemma_parser.py` (Python reference) and
`src/llm/functiongemma-parser.ts` (TypeScript twin). Both parsers are
validated against the corpus at `src/llm/reference/test_corpus.jsonl`.

---

## Revision history

**2026-04-22 16:00 PDT — r2 (current).** Layer-1-compliant rewrite.
- P1 changed from "2.1% on 50 foot 4 inch lateral — code compliant?"
  (Layer 2 `pct` + `pipeDiameterIn` expectation, architecturally
  unreachable by a Layer-1 model) to an explicit two-station prompt.
- P3 changed from a Spanish slope-percent phrasing to an explicit
  two-station Spanish prompt so it tests the same tool call shape as P1,
  only in Spanish. Spanish trade vocabulary preserved.
- P5 changed from "what does IPC say about trap arm length" to "look up
  trap arm length" so the expected shape contains only `query` (Layer
  1). The `code` parameter removed from expected shape since it is
  Layer 2.
- Scoring policy section clarifies that Layer 2 fields are invisible to
  the model and excess fields do not fail a call.

**2026-04-22 15:32 PDT — r1 (superseded).** Initial draft. Contained
Layer 2 expectations for P1, P3, P5 that the Layer-1-trained model
could not emit. Corrected after training session (sibling) flagged the
mismatch in its 2026-04-22 parser port report.

---

## Changing this file

Adding prompts is welcome; deleting existing prompts is not. When you
revise a prompt, increment the revision history at the top with your
change and rationale. Do not silently edit prompts — benchmark runs
reference this file's content at a point in time, and silent edits make
historical comparisons invalid.

## Why these five and not more

Five prompts stratify the key dimensions the fine-tune must cover:

- **P1**: English single-tool with numeric extraction to a required array
- **P2**: Layer-1-friendly prompt with only an optional scalar field
- **P3**: Spanish trade vocabulary on the same tool as P1 → direct
  English/Spanish accuracy delta is measurable
- **P4**: multi-tool orchestration; exercises the Canvas composition path
- **P5**: lookup-style routing (query field, no numeric extraction)

Together they cover English vs Spanish, single-tool vs multi-tool, numeric
extraction vs string query, and the Plumb canvas flow's two primary
patterns (direct classification and plan-approve-execute).

The R6 full benchmark runs a larger stratified test set with more
variants; these five are the canonical smoke set that both the browser
smoke test and the benchmark-report summary use for quick cross-session
comparability.
