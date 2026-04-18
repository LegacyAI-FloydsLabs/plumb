import { useState, useCallback } from "react";
import { navigatePermit, type PermitOutput } from "./calc";

export function PermitNavigatorPage() {
  const [description, setDescription] = useState("");
  const [occupancy, setOccupancy] = useState<"residential" | "commercial">("residential");
  const [projectValue, setProjectValue] = useState<number | "">("");
  const [result, setResult] = useState<PermitOutput | null>(null);

  const handleSearch = useCallback(() => {
    if (!description.trim()) return;
    setResult(navigatePermit({ description, occupancy, project_value: projectValue ? Number(projectValue) : undefined }));
  }, [description, occupancy, projectValue]);

  return (
    <div className="psi-slope" style={{ maxWidth: 720 }}>
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Describe the work: bathroom remodel, water heater replacement, gas line..." style={{ flex: 1, padding: 12, border: "2px solid var(--psi-input-border, #cbd5e1)", borderRadius: 8, fontSize: 16 }} />
          <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleSearch} style={{ padding: "12px 24px" }}>Find Permits</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <select value={occupancy} onChange={(e) => setOccupancy(e.target.value as typeof occupancy)} style={{ padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            <option value="residential">Residential</option><option value="commercial">Commercial</option>
          </select>
          <input type="number" placeholder="Project value ($)" value={projectValue} onChange={(e) => setProjectValue(e.target.value ? Number(e.target.value) : "")} style={{ padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} />
        </div>
      </section>

      {result && (
        <div style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>${result.estimated_fees.low}–${result.estimated_fees.high}</div>
              <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Estimated Fees</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{result.inspections.length}</div>
              <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Inspections</div>
            </div>
          </div>

          {result.permits.map((p, i) => (
            <div key={i} style={{ padding: 12, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--psi-ink-soft, #475569)" }}>{p.description}</div>
            </div>
          ))}

          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Required Documents ({result.required_documents.length})</summary>
            <ul style={{ fontSize: 12, paddingLeft: 20, marginTop: 8 }}>{result.required_documents.map((d, i) => <li key={i} style={{ marginBottom: 4 }}>{d}</li>)}</ul>
          </details>

          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Inspections ({result.inspections.length})</summary>
            <ol style={{ fontSize: 12, paddingLeft: 20, marginTop: 8 }}>{result.inspections.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}</ol>
          </details>

          {result.notes.map((n, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-ink-soft, #475569)", marginTop: 8 }}>ℹ️ {n}</div>)}
          {result.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-warn, #d97706)", marginTop: 8 }}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
