import { useState, useCallback, useRef, useEffect } from "react";
import type { ParsedIntent, ToolId } from "../llm";

interface PsiChatProps {
  onIntent: (intent: ParsedIntent) => void;
  placeholder?: string;
  toolId?: ToolId;
  autoFocus?: boolean;
}

const TOOL_PLACEHOLDER: Record<ToolId, string> = {
  slope: "Describe your slope survey or enter station data...",
  pipe_sizer: "How many fixtures? What building type? Size my pipes...",
  fixture_counter: "Count fixtures for me — bathroom group, kitchen sink...",
  code_compliance: "What's the code requirement for trap arm length?",
  hydraulic_analyzer: "What's the pressure drop for 2-inch copper at 50 feet?",
  drainage_designer: "Size my drainage for a 4-story apartment building...",
  permit_navigator: "What permit do I need for a bathroom remodel in Austin?",
  ada_compliance: "Check ADA clearances for a commercial bathroom...",
  material_spec: "Can I connect copper to PVC? What transition do I need?",
  backflow_test: "What backflow assembly do I need for an irrigation system?",
  bid_generator: "Generate a bid for a 3-bathroom residential remodel...",
};

export function PsiChat({ onIntent, placeholder, toolId, autoFocus }: PsiChatProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="psi-app__chat">
      <input
        ref={inputRef}
        type="text"
        className="psi-app__chat-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? TOOL_PLACEHOLDER[toolId ?? "slope"]}
        aria-label="Natural language command input"
      />
      <button
        className="psi-app__chat-btn"
        onClick={handleSubmit}
        disabled={!input.trim()}
        aria-label="Send command"
      >
        →
      </button>
    </div>
  );
}