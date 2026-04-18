import { useState, useCallback } from "react";
import { selectBackflowAssembly, type BackflowOutput } from "./calc";

export function BackflowTestPage() {
  const [application, setApplication] = useState("");
  const [hazardDegree, setHazardDegree] = useState<"low" | "medium" | "high" | "">("");
  const [pipeSize, setPipeSize] = useState("");
  const [result, setResult] = useState<BackflowOutput | null>(null);

  const handleSelect = useCallback(() => {
    if (!application.trim()) return;
    setResult(selectBackflowAssembly({
      application,
      hazard_degree: hazardDegree || undefined,
      pipe_size: pipeSize || undefined,
    }));
  }, [application, hazardDegree, pipeSize]);

  return (
    <div className="psi-slope" style={{ maxWidth: 720 }}>
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="text" value={application} onChange={(e) => setApplication(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSelect()} placeholder="Describe the application: irrigation, fire suppression, medical..." style={{ flex: 1, padding: 12, border: "2px solid var(--psi-input-border, #cbd5e1)", borderRadius: 8, fontSize: 16 }} />
          <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleSelect} style={{ padding: "12px 24px" }}>Select</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <select value={hazardDegree} onChange={(e) => setHazardDegree(e.target.value as typeof hazardDegree)} style={{ padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            <option value="">Auto-detect hazard</option><option value="low">Low hazard</option><option value="medium">Medium hazard</option><option value="high">High hazard</option>
          </select>
          <input type="text" placeholder='Pipe size (e.g. 1, 2, 4)' value={pipeSize} onChange={(e) => setPipeSize(e.target.value)} style={{ padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} />
        </div>
      </section>

      {result && (
        <div style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{result.recommended.abbreviation}</div>
              <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>{result.recommended.name}</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>${result.recommended.estimated_cost.low}–${result.recommended.estimated_cost.high}</div>
              <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Estimated Cost</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: result.recommended.degree_of_hazard === "high" ? "var(--psi-bad, #dc2626)" : result.recommended.degree_of_hazard === "medium" ? "var(--psi-warn, #d97706)" : "var(--psi-good, #16a34a)" }}>{result.recommended.degree_of_hazard.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Hazard Degree</div>
            </div>
          </div>

          <div style={{ padding: "8px 12px", background: "var(--psi-paper, #fff)", borderRadius: 6, marginBottom: 12, fontSize: 13, borderLeft: "3px solid var(--psi-accent, #0ea5e9)" }}>
            {result.recommended.description}
          </div>

          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Applications</summary>
            <ul style={{ fontSize: 12, paddingLeft: 20, marginTop: 8 }}>{result.recommended.applications.map((a, i) => <li key={i} style={{ marginBottom: 2 }}>{a}</li>)}</ul>
          </details>

          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Test Procedure ({result.recommended.pass_criteria.length} checks)</summary>
            <ol style={{ fontSize: 12, paddingLeft: 20, marginTop: 8 }}>{result.recommended.test_procedure.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}</ol>
            <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}>
              <thead><tr><th style={{ padding: 4, textAlign: "left" }}>Check</th><th style={{ padding: 4 }}>Pass Criteria</th></tr></thead>
              <tbody>{result.recommended.pass_criteria.map((c, i) => <tr key={i} style={{ borderBottom: "1px solid var(--psi-border, #e2e8f0)" }}><td style={{ padding: 4 }}>{c.check}</td><td style={{ padding: 4, textAlign: "center", fontWeight: 600 }}>{c.value}</td></tr>)}</tbody>
            </table>
          </details>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Installation Notes</div>
            {result.installation_notes.map((n, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-ink-soft, #475569)", marginBottom: 2 }}>• {n}</div>)}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Testing Requirements</div>
            {result.testing_requirements.map((r, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-ink-soft, #475569)", marginBottom: 2 }}>• {r}</div>)}
          </div>
          {result.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-bad, #dc2626)", marginTop: 8 }}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
