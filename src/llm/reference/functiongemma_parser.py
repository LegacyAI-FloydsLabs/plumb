"""FunctionGemma tool-call output parser — Python twin.

Reference implementation of the parser for the bespoke serialization emitted
by google/functiongemma-270m-it and its fine-tunes. This is the Python
counterpart to src/llm/functiongemma-parser.ts; both implementations must
pass the shared test corpus at src/llm/reference/test_corpus.jsonl
identically.

# VERSION: plumb-fn-parser-v1.1
# MD5 of this file (excluding this header block) will be written in
# test_parser.py; if this file's content changes without incrementing
# VERSION, any sibling session copying this file can detect drift by
# comparing its expected version string with the copy on disk.

Port this into the training workspace's scripts/ directory (e.g.
scripts/parse_function_call.py) and wire it into benchmark.py in place of
the JSON-only parse_tool_call at lines 48-68. The existing JSON parser
will not parse FunctionGemma's native output — see chat_template.jinja
lines 90-124 (format_argument macro) and 181-205 (tool_call rendering).

The chat_template renders a tool call as:

    <start_function_call>call:NAME{key1:value1,key2:value2,...}<end_function_call>
    [...additional calls...]
    <start_function_response>

Value serialization (per format_argument):
  - Strings:  <escape>content<escape>          (literal <escape> markers, NOT XML)
  - Numbers:  raw
  - Booleans: true | false
  - Null:     None | null
  - Dicts:    {key:value,...}                  (keys dictsort-alphabetical, unescaped)
  - Arrays:   [value,value,...]

Top-level and nested keys are unescaped identifiers because escape_keys=False
propagates through the tool_call site.

No external dependencies. Python 3.10+.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

TAG_CALL_OPEN = "<start_function_call>call:"
TAG_CALL_CLOSE = "<end_function_call>"
TAG_RESPONSE = "<start_function_response>"
TAG_ESCAPE = "<escape>"


@dataclass(frozen=True)
class ToolCall:
    name: str
    arguments: dict[str, Any]


@dataclass
class ParseResult:
    tool_calls: list[ToolCall] = field(default_factory=list)
    stopped: bool = False
    remainder: str = ""
    error: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Match the TypeScript parser's serialization for cross-lang test parity."""
        return {
            "tool_calls": [
                {"name": c.name, "arguments": c.arguments} for c in self.tool_calls
            ],
            "stopped": self.stopped,
            "remainder": self.remainder,
            "error": self.error,
        }


class _State:
    __slots__ = ("src", "pos")

    def __init__(self, src: str, pos: int = 0) -> None:
        self.src = src
        self.pos = pos


class _ParseError(Exception):
    pass


# ── Public API ──────────────────────────────────────────────────────────────


def parse_tool_calls(raw: str) -> ParseResult:
    """Parse the model's raw output into ToolCall objects.

    Tolerant: malformed input returns error code rather than raising, so
    callers can surface the failure without crashing.
    """
    calls: list[ToolCall] = []
    pos = 0

    while True:
        response_idx = raw.find(TAG_RESPONSE, pos)
        call_idx = raw.find(TAG_CALL_OPEN, pos)

        # Stop marker appears before any remaining call → done.
        if response_idx != -1 and (call_idx == -1 or response_idx < call_idx):
            return ParseResult(
                tool_calls=calls,
                stopped=True,
                remainder=raw[response_idx + len(TAG_RESPONSE) :],
                error=None,
            )

        if call_idx == -1:
            # No more calls, no stop marker — trailing text is remainder.
            return ParseResult(
                tool_calls=calls,
                stopped=False,
                remainder=raw if len(calls) == 0 else raw[pos:],
                error=None,
            )

        try:
            call, next_pos = _parse_single_call(raw, call_idx)
        except _ParseError as e:
            return ParseResult(
                tool_calls=[],
                stopped=False,
                remainder=raw,
                error=str(e) or "PARSE_ERROR",
            )
        calls.append(call)
        pos = next_pos


# ── Single call ─────────────────────────────────────────────────────────────


def _parse_single_call(src: str, start_idx: int) -> tuple[ToolCall, int]:
    name_start = start_idx + len(TAG_CALL_OPEN)
    brace_idx = src.find("{", name_start)
    if brace_idx == -1:
        raise _ParseError("UNTERMINATED_CALL")
    name = src[name_start:brace_idx].strip()
    if not name:
        raise _ParseError("MISSING_TOOL_NAME")

    state = _State(src, brace_idx)
    args = _parse_dict(state)

    if not _starts_with(state, TAG_CALL_CLOSE):
        raise _ParseError("EXPECTED_END_CALL")
    state.pos += len(TAG_CALL_CLOSE)

    return ToolCall(name=name, arguments=args), state.pos


# ── Value parsers ───────────────────────────────────────────────────────────


def _parse_value(state: _State) -> Any:
    _skip_ws(state)
    if state.pos >= len(state.src):
        raise _ParseError("UNEXPECTED_EOF")

    if _starts_with(state, TAG_ESCAPE):
        return _parse_string(state)
    ch = state.src[state.pos]
    if ch == "{":
        return _parse_dict(state)
    if ch == "[":
        return _parse_array(state)
    if _starts_with(state, "true"):
        state.pos += 4
        return True
    if _starts_with(state, "false"):
        state.pos += 5
        return False
    if _starts_with(state, "None"):
        state.pos += 4
        return None
    if _starts_with(state, "null"):
        state.pos += 4
        return None
    return _parse_number(state)


def _parse_string(state: _State) -> str:
    state.pos += len(TAG_ESCAPE)
    end = state.src.find(TAG_ESCAPE, state.pos)
    if end == -1:
        raise _ParseError("UNTERMINATED_STRING")
    value = state.src[state.pos : end]
    state.pos = end + len(TAG_ESCAPE)
    return value


def _parse_dict(state: _State) -> dict[str, Any]:
    if state.pos >= len(state.src) or state.src[state.pos] != "{":
        raise _ParseError("EXPECTED_OPEN_BRACE")
    state.pos += 1
    out: dict[str, Any] = {}
    _skip_ws(state)
    if state.pos >= len(state.src):
        raise _ParseError("UNTERMINATED_CALL")
    if state.src[state.pos] == "}":
        state.pos += 1
        return out

    while True:
        _skip_ws(state)
        key = _parse_key(state)
        _skip_ws(state)
        if state.pos >= len(state.src):
            raise _ParseError("UNTERMINATED_CALL")
        if state.src[state.pos] != ":":
            raise _ParseError("EXPECTED_COLON")
        state.pos += 1
        _skip_ws(state)
        out[key] = _parse_value(state)
        _skip_ws(state)
        if state.pos >= len(state.src):
            raise _ParseError("UNTERMINATED_CALL")
        nxt = state.src[state.pos]
        if nxt == ",":
            state.pos += 1
            continue
        if nxt == "}":
            state.pos += 1
            return out
        raise _ParseError("EXPECTED_COMMA_OR_CLOSE_BRACE")


def _parse_key(state: _State) -> str:
    if _starts_with(state, TAG_ESCAPE):
        return _parse_string(state)

    src = state.src
    end = state.pos
    stop_chars = set(":,}{[] \n\r\t")
    while end < len(src) and src[end] not in stop_chars:
        end += 1
    if end == state.pos:
        raise _ParseError("MISSING_KEY")
    key = src[state.pos : end]
    state.pos = end
    return key


def _parse_array(state: _State) -> list[Any]:
    if state.pos >= len(state.src) or state.src[state.pos] != "[":
        raise _ParseError("EXPECTED_OPEN_BRACKET")
    state.pos += 1
    out: list[Any] = []
    _skip_ws(state)
    if state.pos >= len(state.src):
        raise _ParseError("UNTERMINATED_CALL")
    if state.src[state.pos] == "]":
        state.pos += 1
        return out
    while True:
        _skip_ws(state)
        out.append(_parse_value(state))
        _skip_ws(state)
        if state.pos >= len(state.src):
            raise _ParseError("UNTERMINATED_CALL")
        nxt = state.src[state.pos]
        if nxt == ",":
            state.pos += 1
            continue
        if nxt == "]":
            state.pos += 1
            return out
        raise _ParseError("EXPECTED_COMMA_OR_CLOSE_BRACKET")


def _parse_number(state: _State) -> float | int:
    src = state.src
    start = state.pos
    if src[state.pos] in ("-", "+"):
        state.pos += 1
    saw_digit = False
    while state.pos < len(src) and src[state.pos].isdigit():
        saw_digit = True
        state.pos += 1
    is_float = False
    if state.pos < len(src) and src[state.pos] == ".":
        is_float = True
        state.pos += 1
        while state.pos < len(src) and src[state.pos].isdigit():
            saw_digit = True
            state.pos += 1
    if state.pos < len(src) and src[state.pos] in ("e", "E"):
        is_float = True
        state.pos += 1
        if state.pos < len(src) and src[state.pos] in ("-", "+"):
            state.pos += 1
        while state.pos < len(src) and src[state.pos].isdigit():
            state.pos += 1
    if not saw_digit:
        raise _ParseError("EXPECTED_NUMBER")
    text = src[start : state.pos]
    try:
        return float(text) if is_float else int(text)
    except ValueError:
        raise _ParseError("INVALID_NUMBER")


# ── Helpers ─────────────────────────────────────────────────────────────────


def _skip_ws(state: _State) -> None:
    src = state.src
    while state.pos < len(src) and src[state.pos] in (" ", "\n", "\r", "\t"):
        state.pos += 1


def _starts_with(state: _State, needle: str) -> bool:
    return state.src.startswith(needle, state.pos)
