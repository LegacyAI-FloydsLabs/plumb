# LLM parser reference — cross-session contract

This directory is a **reference implementation and shared test corpus** for
parsing the output of the fine-tuned FunctionGemma-270M model that Plumb
runs in the browser.

## Why this exists

The fine-tuned FunctionGemma model emits tool calls in a bespoke format
defined by its `chat_template.jinja`, not JSON. Two sessions need to parse
it:

1. **Plumb browser adapter** (`src/llm/functiongemma-parser.ts`) — parses
   the model's output at runtime in the user's browser to dispatch FLUM
   tool calls.

2. **Training workspace benchmark** (`/Volumes/SanDisk1Tb/HFModels/Training/plumb-functiongemma/scripts/benchmark.py`)
   — parses the model's output during R6 3-seed benchmarking. The existing
   parser at lines 48–68 is JSON-only and will report 0 % accuracy even on
   a perfectly trained model.

Both parsers must agree exactly on every edge case, or their accuracy
numbers are not comparable. This directory provides:

| File | Purpose |
|---|---|
| `functiongemma_parser.py` | Reference Python implementation. Drop-in replacement for the training workspace's JSON-only parser. |
| `test_corpus.jsonl` | 30 canonical test cases covering strings, numbers, booleans, null, nested dicts, arrays, Unicode, refusals, multi-tool sequences, and malformed inputs. |
| `test_parser.py` | Harness that runs the corpus against `functiongemma_parser.py`. Exits 0 on full pass, non-zero with a failure count otherwise. |
| `../functiongemma-parser.ts` | TypeScript twin; must pass the identical corpus. |
| `../__tests__/functiongemma-parser.test.ts` | Vitest harness for the TypeScript parser over the same corpus. |

## Format being parsed

```
<start_function_call>call:NAME{key1:value1,key2:value2,...}<end_function_call>
<start_function_call>call:OTHER{...}<end_function_call>
<start_function_response>
```

Value serialization (per `chat_template.jinja` `format_argument` macro,
lines 90-124):

| Type | Serialization | Example |
|---|---|---|
| String | `<escape>content<escape>` | `<escape>trap arm length<escape>` |
| Integer | raw digits | `42` |
| Float | raw digits with `.` or `e` | `2.083` or `1.5e-3` |
| Boolean | `true` / `false` | `true` |
| Null | `None` or `null` | `None` |
| Dict | `{key:value,...}` | `{a:1,b:2}` — keys dictsort-alphabetical |
| Array | `[value,value,...]` | `[1,2,3]` |

Keys at every level are **unescaped** (bare identifiers) because
`escape_keys=False` propagates from the top-level `tool_call` site.

## How to port into the training workspace

In `/Volumes/SanDisk1Tb/HFModels/Training/plumb-functiongemma/`:

1. Copy `functiongemma_parser.py` to `scripts/parse_function_call.py`.
2. Copy `test_corpus.jsonl` to `scripts/test_corpus_parser.jsonl`.
3. Copy `test_parser.py` to `scripts/test_parse_function_call.py` (update
   the `from functiongemma_parser import` line to
   `from parse_function_call import`).
4. Run `python scripts/test_parse_function_call.py`. All 30 cases must
   pass before the port is valid.
5. In `scripts/benchmark.py`, replace the body of `parse_tool_call` (lines
   48-68) with:

   ```python
   from parse_function_call import parse_tool_calls

   def parse_tool_call(raw: str) -> dict | None:
       result = parse_tool_calls(raw)
       if result.error or not result.tool_calls:
           return None
       # Preserve original single-call return shape so downstream _param_match
       # at line 83 keeps working.
       call = result.tool_calls[0]
       return {"name": call.name, "arguments": call.arguments}
   ```

6. Re-run the R6 pre-training baseline (`python scripts/benchmark.py
   --model <base> --test-file data/minibench.jsonl`). Expected: ~0-39 %
   (per Google's FunctionGemma benchmarks before task-specific tuning), not
   0 % on all 20 records like the previous JSON-only parser reported.

## Contract

If either parser diverges from the corpus, **fix the parser, not the
corpus**. The corpus is the source of truth for the format. Extending the
corpus is welcome; deleting rows is not. Both parsers must pass every row
identically, forever.

If a future revision of FunctionGemma's `chat_template.jinja` changes the
output format, both parsers and the corpus must be updated together in a
single coordinated change.

## Why this is not in the training workspace

The training workspace is owned by the sibling Claude Code session that
runs the fine-tuning pipeline. Plumb's repo owns the parser because the
parser is consumed by Plumb's browser adapter (the primary production use),
and cross-trade future (construction, telecom, HVAC cartridges) will all
reuse the same format — one parser, many cartridges.
