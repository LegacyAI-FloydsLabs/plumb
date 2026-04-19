import { useState, useCallback, useRef, useEffect } from "react";
import type { ParsedIntent, ToolId } from "../llm";
import { t, type Lang } from "./i18n";

interface PsiChatProps {
  onIntent: (intent: ParsedIntent) => void;
  placeholder?: string;
  toolId?: ToolId;
  autoFocus?: boolean;
  lang?: Lang;
}

// Tool-specific placeholders in the tech's own voice.
// Kept in English only — short strings, translatable later by contributors.
const TOOL_PLACEHOLDER: Record<ToolId, string> = {
  slope: "What run are you reading? Paste stations, or tell me what you saw.",
  pipe_sizer: "How many fixtures, what building, how long a run?",
  fixture_counter: "What's on the floor? I'll count the DFUs.",
  code_compliance: "What's the code say about…?",
  hydraulic_analyzer: "2-inch copper, 50 feet, 40 psi — what do I lose?",
  drainage_designer: "Four stories, two stacks, one building. Size it.",
  permit_navigator: "Bathroom remodel in Austin — what do I file?",
  ada_compliance: "Commercial bathroom — what clearances do I need?",
  material_spec: "Can I connect copper to PVC? What's the transition?",
  backflow_test: "Irrigation system — which assembly goes in?",
  bid_generator: "Three-bathroom remodel, residential — write the bid.",
};

// Minimal SpeechRecognition typing — lib.dom.d.ts doesn't include it.
type SpeechRecognitionResult = { transcript: string };
type SpeechRecognitionResultList = { [index: number]: { [index: number]: SpeechRecognitionResult } };
type SpeechRecognitionEvent = Event & { results: SpeechRecognitionResultList };
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function PsiChat({ onIntent, placeholder, toolId, autoFocus, lang = "en" }: PsiChatProps) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() => typeof window !== "undefined" && !!getSpeechRecognition());
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    onIntent({ tool: toolId ?? "slope", action: "compute", params: {}, confidence: 1, rawInput: input });
    setInput("");
  }, [input, onIntent, toolId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const toggleVoice = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = lang === "es" ? "es-US" : "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(
        { length: (e.results as unknown as ArrayLike<unknown>).length },
        (_, i) => e.results[i][0].transcript,
      ).join(" ");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }, [listening, lang]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const placeholderText =
    placeholder ?? TOOL_PLACEHOLDER[toolId ?? "slope"];

  return (
    <div className={`psi-app__chat ${listening ? "psi-app__chat--listening" : ""}`} role="search">
      <input
        ref={inputRef}
        type="text"
        className="psi-app__chat-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={listening ? t("chat.voice.listening", lang) : placeholderText}
        aria-label={placeholderText}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="send"
      />

      {voiceSupported && (
        <button
          type="button"
          className={`psi-app__chat-voice ${listening ? "psi-app__chat-voice--active" : ""}`}
          onClick={toggleVoice}
          aria-label={listening ? t("chat.voice.listening", lang) : t("chat.voice", lang)}
          aria-pressed={listening}
        >
          <VoiceGlyph listening={listening} />
        </button>
      )}

      <button
        type="button"
        className="psi-app__chat-btn"
        onClick={handleSubmit}
        disabled={!input.trim()}
        aria-label={t("chat.send", lang)}
      >
        <span>{t("chat.send", lang)}</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

/** Industrial mic glyph — concentric rectangles suggesting a meter capsule. */
function VoiceGlyph({ listening }: { listening: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <rect x="5.5" y="2" width="5" height="8" rx="2.5" />
      <path d="M3 8.5c0 2.8 2.2 5 5 5s5-2.2 5-5" />
      <line x1="8" y1="13.5" x2="8" y2="15" />
      {listening && <circle cx="13" cy="3" r="1.5" fill="currentColor" />}
    </svg>
  );
}
