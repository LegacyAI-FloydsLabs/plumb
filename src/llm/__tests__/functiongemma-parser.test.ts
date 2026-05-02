/**
 * Shared test corpus runner for the FunctionGemma parser.
 *
 * Loads src/llm/reference/test_corpus.jsonl and asserts each row parses to
 * the expected output. Both the TypeScript parser (src/llm/functiongemma-parser.ts)
 * and the Python twin (src/llm/reference/functiongemma_parser.py) must pass
 * every row of this corpus identically.
 */

import { describe, it, expect } from "vitest";
import { parseToolCalls } from "../functiongemma-parser";

interface Row {
  id: string;
  input: string;
  expected: {
    tool_calls: Array<{ name: string; arguments: Record<string, unknown> }>;
    stopped: boolean;
    remainder: string;
    error: string | null;
  };
}

async function loadCorpus(): Promise<Row[]> {
  // Resolve the corpus path relative to this test file using import.meta.url.
  // Avoids a hard dependency on @types/node for the test harness.
  const url = new URL("../reference/test_corpus.jsonl", import.meta.url);
  // @ts-expect-error — 'fs' is provided by the Vitest runtime; optional @types/node would allow this import without the suppression.
  const fs = await import("fs");
  const text = fs.readFileSync(url, "utf-8");
  return text
    .split("\n")
    .filter((l: string) => l.trim().length > 0)
    .map((l: string) => JSON.parse(l) as Row);
}

/**
 * Normalize numeric values so 0 === 0.0 and ints/floats compare cleanly.
 * Preserves booleans (which are also numbers in JS) and null.
 */
function normalize(v: unknown): unknown {
  if (v === null) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") {
    return Number.isInteger(v) ? v : v;
  }
  if (Array.isArray(v)) return v.map(normalize);
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = normalize(val);
    }
    return out;
  }
  return v;
}

describe("FunctionGemma parser — shared corpus", async () => {
  const rows = await loadCorpus();

  for (const row of rows) {
    it(`[${row.id}]`, () => {
      const result = parseToolCalls(row.input);
      const actual = {
        tool_calls: result.tool_calls.map((c) => ({
          name: c.name,
          arguments: c.arguments,
        })),
        stopped: result.stopped,
        remainder: result.remainder,
        error: result.error,
      };
      expect(normalize(actual)).toEqual(normalize(row.expected));
    });
  }
});
