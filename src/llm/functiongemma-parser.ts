/**
 * FunctionGemma tool-call output parser.
 *
 * VERSION: plumb-fn-parser-v1.1 — must match the Python twin's header marker.
 * If you port this file and the Python twin together, both version strings
 * MUST be equal. Divergence = drift; regenerate the copy from the Plumb
 * source of truth at src/llm/reference/functiongemma_parser.py.
 *
 * Parses the bespoke serialization emitted by google/functiongemma-270m-it
 * and its fine-tunes. The model's chat_template.jinja renders tool calls as:
 *
 *   <start_function_call>call:NAME{key1:value1,key2:value2,...}<end_function_call>
 *   [<start_function_call>... additional calls ...<end_function_call>]*
 *   <start_function_response>
 *
 * Value serialization (per chat_template.jinja format_argument macro):
 *   - Strings:  <escape>content<escape>         (literal <escape> markers, not XML)
 *   - Numbers:  raw digits, may include - and .
 *   - Booleans: true | false
 *   - Null:     None | null
 *   - Dicts:    {key:value,...}                 (keys dictsort-alphabetical)
 *   - Arrays:   [value,value,...]
 *
 * Top-level keys in the call are unescaped (bare identifiers). Keys inside
 * nested dicts are also unescaped because escape_keys=False propagates.
 *
 * The parser is tolerant: malformed input returns an error string rather
 * than throwing, so callers can surface the failure without crashing the
 * canvas composition flow.
 *
 * Canonical test corpus: src/llm/reference/test_corpus.jsonl.
 * Python twin:           src/llm/reference/functiongemma_parser.py.
 * Both implementations must pass every corpus row identically.
 *
 * References:
 *   chat_template.jinja:90-124    — format_argument macro
 *   chat_template.jinja:181-205   — tool_call rendering
 */

export interface ToolCall {
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export interface ParseResult {
  readonly tool_calls: ToolCall[];
  /** True if <start_function_response> stop marker was seen. */
  readonly stopped: boolean;
  /** Text after the stop marker, or trailing text after the last call. */
  readonly remainder: string;
  /** Error code if parse failed; null on success. */
  readonly error: string | null;
}

const TAG_CALL_OPEN = "<start_function_call>call:";
const TAG_CALL_CLOSE = "<end_function_call>";
const TAG_RESPONSE = "<start_function_response>";
const TAG_ESCAPE = "<escape>";

interface State {
  readonly src: string;
  pos: number;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function parseToolCalls(raw: string): ParseResult {
  const calls: ToolCall[] = [];
  let pos = 0;

  while (true) {
    const responseIdx = raw.indexOf(TAG_RESPONSE, pos);
    const callIdx = raw.indexOf(TAG_CALL_OPEN, pos);

    // Stop marker appears before any remaining call → we're done.
    if (responseIdx !== -1 && (callIdx === -1 || responseIdx < callIdx)) {
      return {
        tool_calls: calls,
        stopped: true,
        remainder: raw.slice(responseIdx + TAG_RESPONSE.length),
        error: null,
      };
    }

    if (callIdx === -1) {
      // No more calls, no stop marker — trailing text is remainder.
      return {
        tool_calls: calls,
        stopped: false,
        remainder: calls.length === 0 ? raw : raw.slice(pos),
        error: null,
      };
    }

    // Parse the next call.
    const parsed = parseSingleCall(raw, callIdx);
    if (parsed.error) {
      return {
        tool_calls: [],
        stopped: false,
        remainder: raw,
        error: parsed.error,
      };
    }
    calls.push(parsed.call!);
    pos = parsed.nextPos;
  }
}

// ── Single call parser ──────────────────────────────────────────────────────

interface SingleParse {
  call: ToolCall | null;
  nextPos: number;
  error: string | null;
}

function parseSingleCall(src: string, startIdx: number): SingleParse {
  const nameStart = startIdx + TAG_CALL_OPEN.length;
  const braceIdx = src.indexOf("{", nameStart);
  if (braceIdx === -1) {
    return { call: null, nextPos: src.length, error: "UNTERMINATED_CALL" };
  }
  const name = src.slice(nameStart, braceIdx).trim();
  if (!name) {
    return { call: null, nextPos: src.length, error: "MISSING_TOOL_NAME" };
  }

  const state: State = { src, pos: braceIdx };
  let args: Record<string, unknown>;
  try {
    args = parseDict(state);
  } catch (e) {
    return { call: null, nextPos: src.length, error: errCode(e) };
  }

  // Expect <end_function_call> immediately after the dict.
  if (!startsWith(state, TAG_CALL_CLOSE)) {
    return { call: null, nextPos: src.length, error: "EXPECTED_END_CALL" };
  }
  state.pos += TAG_CALL_CLOSE.length;

  return { call: { name, arguments: args }, nextPos: state.pos, error: null };
}

// ── Value parsers ───────────────────────────────────────────────────────────

function parseValue(state: State): unknown {
  skipWs(state);
  const { src, pos } = state;
  if (pos >= src.length) throw new Error("UNEXPECTED_EOF");

  if (startsWith(state, TAG_ESCAPE)) return parseString(state);
  const c = src[pos];
  if (c === "{") return parseDict(state);
  if (c === "[") return parseArray(state);
  if (startsWith(state, "true")) { state.pos += 4; return true; }
  if (startsWith(state, "false")) { state.pos += 5; return false; }
  if (startsWith(state, "None")) { state.pos += 4; return null; }
  if (startsWith(state, "null")) { state.pos += 4; return null; }
  return parseNumber(state);
}

function parseString(state: State): string {
  state.pos += TAG_ESCAPE.length;
  const end = state.src.indexOf(TAG_ESCAPE, state.pos);
  if (end === -1) throw new Error("UNTERMINATED_STRING");
  const value = state.src.slice(state.pos, end);
  state.pos = end + TAG_ESCAPE.length;
  return value;
}

function parseDict(state: State): Record<string, unknown> {
  if (state.pos >= state.src.length || state.src[state.pos] !== "{") {
    throw new Error("EXPECTED_OPEN_BRACE");
  }
  state.pos++;
  const out: Record<string, unknown> = {};
  skipWs(state);
  if (state.pos >= state.src.length) throw new Error("UNTERMINATED_CALL");
  if (state.src[state.pos] === "}") {
    state.pos++;
    return out;
  }

  while (true) {
    skipWs(state);
    const key = parseKey(state);
    skipWs(state);
    if (state.pos >= state.src.length) throw new Error("UNTERMINATED_CALL");
    if (state.src[state.pos] !== ":") throw new Error("EXPECTED_COLON");
    state.pos++;
    skipWs(state);
    out[key] = parseValue(state);
    skipWs(state);
    if (state.pos >= state.src.length) throw new Error("UNTERMINATED_CALL");
    const nextChar = state.src[state.pos];
    if (nextChar === ",") {
      state.pos++;
      continue;
    }
    if (nextChar === "}") {
      state.pos++;
      return out;
    }
    throw new Error("EXPECTED_COMMA_OR_CLOSE_BRACE");
  }
}

function parseKey(state: State): string {
  // A key is either <escape>…<escape> or a bare identifier up to the next :
  if (startsWith(state, TAG_ESCAPE)) return parseString(state);

  const { src } = state;
  let end = state.pos;
  while (end < src.length) {
    const ch = src[end];
    if (ch === ":" || ch === "," || ch === "}" || ch === "{" ||
        ch === "[" || ch === "]" || ch === " " || ch === "\n" ||
        ch === "\r" || ch === "\t") break;
    end++;
  }
  if (end === state.pos) throw new Error("MISSING_KEY");
  const key = src.slice(state.pos, end);
  state.pos = end;
  return key;
}

function parseArray(state: State): unknown[] {
  if (state.pos >= state.src.length || state.src[state.pos] !== "[") {
    throw new Error("EXPECTED_OPEN_BRACKET");
  }
  state.pos++;
  const out: unknown[] = [];
  skipWs(state);
  if (state.pos >= state.src.length) throw new Error("UNTERMINATED_CALL");
  if (state.src[state.pos] === "]") {
    state.pos++;
    return out;
  }
  while (true) {
    skipWs(state);
    out.push(parseValue(state));
    skipWs(state);
    if (state.pos >= state.src.length) throw new Error("UNTERMINATED_CALL");
    const nextChar = state.src[state.pos];
    if (nextChar === ",") {
      state.pos++;
      continue;
    }
    if (nextChar === "]") {
      state.pos++;
      return out;
    }
    throw new Error("EXPECTED_COMMA_OR_CLOSE_BRACKET");
  }
}

function parseNumber(state: State): number {
  const { src } = state;
  const start = state.pos;
  if (src[state.pos] === "-" || src[state.pos] === "+") state.pos++;
  let sawDigit = false;
  while (state.pos < src.length && isDigit(src[state.pos])) {
    sawDigit = true;
    state.pos++;
  }
  if (src[state.pos] === ".") {
    state.pos++;
    while (state.pos < src.length && isDigit(src[state.pos])) {
      sawDigit = true;
      state.pos++;
    }
  }
  // Optional exponent (Python floats can include e).
  if (src[state.pos] === "e" || src[state.pos] === "E") {
    state.pos++;
    if (src[state.pos] === "-" || src[state.pos] === "+") state.pos++;
    while (state.pos < src.length && isDigit(src[state.pos])) {
      state.pos++;
    }
  }
  if (!sawDigit) throw new Error("EXPECTED_NUMBER");
  const text = src.slice(start, state.pos);
  const n = Number(text);
  if (Number.isNaN(n)) throw new Error("INVALID_NUMBER");
  return n;
}

// ── Small helpers ───────────────────────────────────────────────────────────

function skipWs(state: State): void {
  const { src } = state;
  while (state.pos < src.length) {
    const ch = src[state.pos];
    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
      state.pos++;
      continue;
    }
    break;
  }
}

function startsWith(state: State, needle: string): boolean {
  return state.src.startsWith(needle, state.pos);
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

function errCode(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return "PARSE_ERROR";
}
