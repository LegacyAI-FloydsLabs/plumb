import { useState, useEffect, useRef, useCallback } from "react";

interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
}

const TOOLS: Tool[] = [
  { id: "slope", name: "Slope Calculator", description: "Calculate proper drain slope per IPC/UPC", path: "/slope" },
  { id: "pipe-sizer", name: "Pipe Sizer", description: "Right-size drainage pipe by DFU load", path: "/pipe-sizer" },
  { id: "fixture-counter", name: "Fixture Counter", description: "Sum fixture units for building drain sizing", path: "/fixture-counter" },
  { id: "code-compliance", name: "Code Compliance", description: "Check code compliance for any plumbing scenario", path: "/code-compliance" },
  { id: "hydraulic-analyzer", name: "Hydraulic Analyzer", description: "Analyze pressure drops and flow velocity", path: "/hydraulic-analyzer" },
  { id: "drainage-designer", name: "Drainage Designer", description: "Design complete drain and vent systems", path: "/drainage-designer" },
  { id: "permit-navigator", name: "Permit Navigator", description: "Navigate permit requirements by jurisdiction", path: "/permit-navigator" },
  { id: "ada-compliance", name: "ADA Compliance", description: "Verify ADA-compliant fixture placement", path: "/ada-compliance" },
  { id: "material-spec", name: "Material Spec", description: "Compare and specify plumbing materials", path: "/material-spec" },
  { id: "backflow-test", name: "Backflow Test", description: "Calculate backflow prevention requirements", path: "/backflow-test" },
  { id: "bid-generator", name: "Bid Generator", description: "Generate professional plumbing bids", path: "/bid-generator" },
];

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  return q.split("").every((c) => t.includes(c));
}

const RECENT_KEY = "plumb-recent-tools";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const getRecent = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    } catch {
      return [];
    }
  }, []);

  const addRecent = useCallback(
    (id: string) => {
      try {
        const recent = [id, ...getRecent().filter((r) => r !== id)].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      } catch {}
    },
    [getRecent],
  );

  const filtered = query.trim()
    ? TOOLS.filter((t) => fuzzyMatch(query, t.name) || fuzzyMatch(query, t.description))
    : TOOLS;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const navigate = (path: string, id: string) => {
    addRecent(id);
    window.location.hash = path;
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    }
    if (e.key === "Enter" && filtered[selected]) {
      navigate(filtered[selected].path, filtered[selected].id);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--psi-paper, #fff)",
          borderRadius: 12,
          border: "1px solid var(--psi-border, #e2e8f0)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--psi-border, #e2e8f0)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: 16,
              padding: "4px 0",
              background: "transparent",
              color: "var(--psi-ink, #0f172a)",
            }}
            aria-label="Search tools"
          />
        </div>
        <div
          role="listbox"
          style={{ maxHeight: 360, overflowY: "auto", padding: "8px 0" }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                padding: "16px 20px",
                color: "var(--psi-ink-soft, #475569)",
                textAlign: "center",
                fontSize: 14,
              }}
            >
              No tools match &quot;{query}&quot;
            </div>
          )}
          {filtered.map((tool, i) => (
            <div
              key={tool.id}
              role="option"
              aria-selected={i === selected}
              onClick={() => navigate(tool.path, tool.id)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background:
                  i === selected ? "var(--psi-p100, #dbeafe)" : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--psi-ink, #0f172a)",
                  }}
                >
                  {tool.name}
                </div>
                <div
                  style={{ fontSize: 12, color: "var(--psi-ink-soft, #475569)" }}
                >
                  {tool.description}
                </div>
              </div>
              {i === selected && (
                <span style={{ fontSize: 11, color: "var(--psi-accent, #0ea5e9)" }}>
                  ↵
                </span>
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--psi-border, #e2e8f0)",
            fontSize: 11,
            color: "var(--psi-ink-soft, #475569)",
            display: "flex",
            gap: 16,
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
