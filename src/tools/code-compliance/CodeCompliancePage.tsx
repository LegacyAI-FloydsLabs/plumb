import { useState, useCallback } from "react";
import { lookupCode, CODE_CATEGORIES, type CodeSection } from "./calc";

export function CodeCompliancePage() {
  const [query, setQuery] = useState("");
  const [code, setCode] = useState<"ipc-2021" | "upc-2021" | "both">("both");
  const [category, setCategory] = useState("");
  const [matches, setMatches] = useState<CodeSection[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    const result = lookupCode({ query, code, category: category || undefined });
    setMatches(result.matches);
    setSearched(true);
  }, [query, code, category]);

  return (
    <div className="psi-slope" style={{ maxWidth: "none", width: "100%" }}>
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type="text" value={query}
            onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search: slope, vent sizing, trap arm, backflow..."
            style={{ flex: 1, padding: 12, border: "2px solid var(--psi-input-border, #cbd5e1)", borderRadius: 8, fontSize: 16 }}
          />
          <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleSearch} style={{ padding: "12px 24px" }}>Search</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={code} onChange={(e) => setCode(e.target.value as typeof code)} style={{ padding: 8, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 13 }}>
            <option value="both">IPC & UPC</option>
            <option value="ipc-2021">IPC 2021</option>
            <option value="upc-2021">UPC 2021</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 8, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 13 }}>
            <option value="">All categories</option>
            {CODE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      {searched && matches.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: "var(--psi-ink-soft, #475569)" }}>
          No results for &quot;{query}&quot;. Try broader terms: slope, vent, trap, pressure, material.
        </div>
      )}

      {matches.map((section, i) => (
        <div key={i} style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 16, marginBottom: 12, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{section.section}</h3>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "var(--psi-p100, #dbeafe)", color: "var(--psi-p700, #0369a1)" }}>{section.category}</span>
          </div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>{section.title}</h4>
          <div style={{ fontSize: 13, color: "var(--psi-ink, #0f172a)", padding: "8px 12px", background: "var(--psi-paper, #fff)", borderRadius: 6, marginBottom: 8, borderLeft: "3px solid var(--psi-accent, #0ea5e9)" }}>
            {section.requirement}
          </div>
          <div style={{ fontSize: 13, color: "var(--psi-ink-soft, #475569)" }}>
            💬 {section.plain_language}
          </div>
        </div>
      ))}
    </div>
  );
}
