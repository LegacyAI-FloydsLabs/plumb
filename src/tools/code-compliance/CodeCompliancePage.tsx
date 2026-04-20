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
    <div className="psi-tool">
      <section className="psi-tool__section">
        <div>
          <input
            type="text" value={query}
            onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search: slope, vent sizing, trap arm, backflow..."
            className="psi-input"
          />
          <button className="psi-btn psi-btn--accent" onClick={handleSearch}>Search</button>
        </div>
        <div className="psi-btn-group">
          <select value={code} onChange={(e) => setCode(e.target.value as typeof code)} className="psi-select">
            <option value="both">IPC & UPC</option>
            <option value="ipc-2021">IPC 2021</option>
            <option value="upc-2021">UPC 2021</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="psi-select">
            <option value="">All categories</option>
            {CODE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      {searched && matches.length === 0 && (
        <div>
          No results for &quot;{query}&quot;. Try broader terms: slope, vent, trap, pressure, material.
        </div>
      )}

      {matches.map((section, i) => (
        <div key={i} className="psi-result">
          <div>
            <h3>{section.section}</h3>
            <span>{section.category}</span>
          </div>
          <h4>{section.title}</h4>
          <div className="psi-result__inset">{section.requirement}</div>
          <div className="psi-code-ref">💬 {section.plain_language}</div>
        </div>
      ))}
    </div>
  );
}
