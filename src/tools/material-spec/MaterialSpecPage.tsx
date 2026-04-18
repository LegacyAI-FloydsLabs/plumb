import { useState, useCallback } from "react";
import { checkMaterial, MATERIALS, type MaterialOutput } from "./calc";

export function MaterialSpecPage() {
  const [materialA, setMaterialA] = useState("copper");
  const [materialB, setMaterialB] = useState("pex");
  const [pipeSize, setPipeSize] = useState("");
  const [jointCount, setJointCount] = useState<number | "">("");
  const [result, setResult] = useState<MaterialOutput | null>(null);

  const handleCheck = useCallback(() => {
    setResult(checkMaterial({ material_a: materialA as typeof MATERIALS[number]["id"], material_b: materialB as typeof MATERIALS[number]["id"], pipe_size: pipeSize || undefined, joint_count: jointCount ? Number(jointCount) : undefined }));
  }, [materialA, materialB, pipeSize, jointCount]);

  return (
    <div className="psi-slope" style={{ maxWidth: 720 }}>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Material A</label>
          <select value={materialA} onChange={(e) => setMaterialA(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Material B</label>
          <select value={materialB} onChange={(e) => setMaterialB(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
          </select>
        </div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Pipe Size (optional)</label><input type="text" placeholder='e.g. 3/4, 2, 4' value={pipeSize} onChange={(e) => setPipeSize(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Joint Count (for BOM)</label><input type="number" min={0} placeholder="e.g. 5" value={jointCount} onChange={(e) => setJointCount(e.target.value ? Number(e.target.value) : "")} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
      </section>

      <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleCheck} style={{ width: "100%", padding: 14, marginBottom: 24 }}>Check Compatibility</button>

      {result && (
        <div aria-live="polite" style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: result.compatibility.compatible ? "var(--psi-good-bg, #f0fdf4)" : "var(--psi-bad-bg, #fef2f2)", color: result.compatibility.compatible ? "var(--psi-good, #16a34a)" : "var(--psi-bad, #dc2626)", fontWeight: 700, fontSize: 16, textAlign: "center" }}>
            {result.compatibility.compatible ? "✅ Compatible" : "❌ Not Compatible"}
          </div>
          <div style={{ padding: "8px 12px", background: "var(--psi-paper, #fff)", borderRadius: 6, marginBottom: 12, borderLeft: "3px solid var(--psi-accent, #0ea5e9)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Transition: {result.compatibility.transition}</div>
            <div style={{ fontSize: 12, color: "var(--psi-ink-soft, #475569)" }}>{result.compatibility.notes}</div>
          </div>
          <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>📋 {result.compatibility.code_reference}</div>

          {result.bom.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Bill of Materials (${result.estimated_cost.low}–${result.estimated_cost.high})</summary>
              <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}>
                <thead><tr><th style={{ padding: 4, textAlign: "left" }}>Item</th><th style={{ padding: 4 }}>Qty</th><th style={{ padding: 4 }}>Cost</th></tr></thead>
                <tbody>{result.bom.map((b, i) => <tr key={i} style={{ borderBottom: "1px solid var(--psi-border, #e2e8f0)" }}><td style={{ padding: 4 }}>{b.description}</td><td style={{ padding: 4, textAlign: "center" }}>{b.quantity} {b.unit}</td><td style={{ padding: 4, textAlign: "center" }}>${b.estimated_cost_low}–${b.estimated_cost_high}</td></tr>)}</tbody>
              </table>
            </details>
          )}
          {result.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-warn, #d97706)", marginTop: 8 }}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
