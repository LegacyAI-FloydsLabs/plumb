"""Test harness for the Python reference parser.

Runs every row in test_corpus.jsonl through parse_tool_calls and asserts
the result matches `expected` exactly (after JSON-normalization for numeric
and None/null comparisons).

Usage:
    python src/llm/reference/test_parser.py
    # exits 0 if all pass, non-zero with a failure count if any row fails.

Both the Python and TypeScript parsers must pass this corpus identically.
If you find a case where they diverge, fix both — do not special-case the
corpus. This is the contract between the Plumb browser adapter and the
training session's benchmark.py port.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from functiongemma_parser import parse_tool_calls
except ImportError:  # when run from repo root
    sys.path.insert(0, str(Path(__file__).parent))
    from functiongemma_parser import parse_tool_calls  # type: ignore

CORPUS = Path(__file__).parent / "test_corpus.jsonl"


def normalize(obj):
    """Normalize for comparison: ints and floats are equal if numerically equal."""
    if isinstance(obj, dict):
        return {k: normalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize(v) for v in obj]
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, (int, float)):
        # Treat 0 == 0.0; preserve integer-ness when representable.
        if isinstance(obj, float) and obj.is_integer():
            return int(obj)
        return obj
    return obj


def run() -> int:
    if not CORPUS.exists():
        print(f"FATAL: {CORPUS} not found", file=sys.stderr)
        return 2

    total = 0
    passed = 0
    failures: list[str] = []

    with CORPUS.open(encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            total += 1
            row = json.loads(line)
            case_id = row["id"]
            inp = row["input"]
            expected = row["expected"]

            actual = parse_tool_calls(inp).to_dict()
            actual_n = normalize(actual)
            expected_n = normalize(expected)

            if actual_n == expected_n:
                passed += 1
                continue

            failures.append(
                f"FAIL [{case_id}] line {line_no}\n"
                f"  input:    {inp!r}\n"
                f"  expected: {json.dumps(expected_n, ensure_ascii=False)}\n"
                f"  actual:   {json.dumps(actual_n, ensure_ascii=False)}"
            )

    print(f"Ran {total} cases, {passed} passed, {len(failures)} failed")
    for msg in failures:
        print()
        print(msg)

    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(run())
