import { useState, useCallback } from "react";
import { generateBid, MATERIAL_CATALOG, TASK_TIMES, type BidOutput } from "./calc";

export function BidGeneratorPage() {
  const [projectType, setProjectType] = useState<"new_construction" | "remodel" | "repair" | "emergency">("remodel");
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, number>>({});
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [laborRate, setLaborRate] = useState<number | "">("");
  const [overheadPct, setOverheadPct] = useState(20);
  const [permitFees, setPermitFees] = useState<number | "">("");
  const [result, setResult] = useState<BidOutput | null>(null);

  const toggleTask = useCallback((task: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(task)) next.delete(task); else next.add(task);
      return next;
    });
    setResult(null);
  }, []);

  const adjustMaterial = useCallback((item: string, delta: number) => {
    setSelectedMaterials((prev) => {
      const next = { ...prev, [item]: Math.max(0, (prev[item] ?? 0) + delta) };
      if (next[item] === 0) delete next[item];
      return next;
    });
    setResult(null);
  }, []);

  const handleCompute = useCallback(() => {
    setResult(generateBid({
      project_type: projectType,
      material_quantities: selectedMaterials,
      tasks: [...selectedTasks],
      labor_rate_override: laborRate ? Number(laborRate) : undefined,
      overhead_pct: overheadPct,
      permit_fees: permitFees ? Number(permitFees) : undefined,
    }));
  }, [projectType, selectedMaterials, selectedTasks, laborRate, overheadPct, permitFees]);

  return (
    <div className="psi-slope" style={{ maxWidth: "none", width: "100%" }}>
      <section style={{ marginBottom: 24 }}>
        <h2 className="psi-slope__section-title" style={{ fontSize: 14 }}>Project Type</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["new_construction", "remodel", "repair", "emergency"] as const).map((t) => (
            <button key={t} onClick={() => setProjectType(t)} style={{ flex: 1, padding: 10, borderRadius: 6, border: projectType === t ? "2px solid var(--psi-accent, #0ea5e9)" : "1px solid var(--psi-border, #e2e8f0)", background: projectType === t ? "var(--psi-p100, #dbeafe)" : "var(--psi-paper, #fff)", cursor: "pointer", fontSize: 13, fontWeight: projectType === t ? 600 : 400 }}>{t.replace(/_/g, " ")}</button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 className="psi-slope__section-title" style={{ fontSize: 14 }}>Tasks</h2>
        <div style={{ display: "grid", gap: 4 }}>
          {Object.entries(TASK_TIMES).map(([key, task]) => (
            <button key={key} onClick={() => toggleTask(key)} type="button" aria-pressed={selectedTasks.has(key)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 6, cursor: "pointer", background: selectedTasks.has(key) ? "var(--psi-p100, #dbeafe)" : "transparent", border: selectedTasks.has(key) ? "1px solid var(--psi-accent, #0ea5e9)" : "1px solid transparent", textAlign: "left", width: "100%", font: "inherit", color: "inherit" }}>
              <span style={{ fontSize: 14 }}>{selectedTasks.has(key) ? "☑" : "☐"}</span>
              <span style={{ fontSize: 13, flex: 1 }}>{task.description}</span>
              <span style={{ fontSize: 12, color: "var(--psi-ink-soft)", fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>{task.hours} hr</span>
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 className="psi-slope__section-title" style={{ fontSize: 14 }}>Materials</h2>
        <div style={{ display: "grid", gap: 4, maxHeight: 300, overflowY: "auto" }}>
          {MATERIAL_CATALOG.map((item) => (
            <div key={item.item} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", borderRadius: 6, background: "var(--psi-surface, #f8fafc)" }}>
              <span style={{ fontSize: 13 }}>{item.item} <span style={{ color: "var(--psi-ink-soft)", fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>${item.unit_cost}/{item.unit}</span></span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => adjustMaterial(item.item, -1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--psi-border, #e2e8f0)", cursor: "pointer", fontSize: 14 }}>-</button>
                <span style={{ width: 20, textAlign: "center", fontSize: 13, fontWeight: 600 }}>{selectedMaterials[item.item] ?? 0}</span>
                <button onClick={() => adjustMaterial(item.item, 1)} style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid var(--psi-border, #e2e8f0)", cursor: "pointer", fontSize: 14 }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Labor Rate ($/hr)</label><input type="number" placeholder="Default: $75" value={laborRate} onChange={(e) => setLaborRate(e.target.value ? Number(e.target.value) : "")} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Overhead & Profit (%)</label><input type="number" min={0} value={overheadPct} onChange={(e) => setOverheadPct(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Permit Fees ($)</label><input type="number" min={0} placeholder="0" value={permitFees} onChange={(e) => setPermitFees(e.target.value ? Number(e.target.value) : "")} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
      </section>

      <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleCompute} disabled={Object.keys(selectedMaterials).length === 0 && selectedTasks.size === 0} style={{ width: "100%", padding: 14, marginBottom: 24 }}>
        Generate Bid
      </button>

      {result && (
        <div aria-live="polite" style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ textAlign: "center", padding: 20, background: "var(--psi-p900, #0c4a6e)", borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#fff" }}>${result.grand_total.toFixed(2)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>Grand Total</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Materials", value: result.material_subtotal, pct: result.breakdown.find((b) => b.category === "pipe" || b.category === "fitting" || b.category === "fixture")?.pct ?? 0 },
              { label: "Labor", value: result.labor_subtotal, pct: result.breakdown.find((b) => b.category === "labor")?.pct ?? 0 },
              { label: "Permits", value: result.permits, pct: result.breakdown.find((b) => b.category === "permits")?.pct ?? 0 },
              { label: "Overhead", value: result.overhead_amount, pct: result.breakdown.find((b) => b.category === "overhead_profit")?.pct ?? 0 },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: 8, background: "var(--psi-paper, #fff)", borderRadius: 6, border: "1px solid var(--psi-border, #e2e8f0)" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>${s.value.toFixed(0)}</div>
                <div style={{ fontSize: 11, color: "var(--psi-ink-soft)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{s.label} · {s.pct}%</div>
              </div>
            ))}
          </div>

          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Materials ({result.materials.length} items)</summary>
            <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}>
              <thead><tr><th style={{ padding: 4, textAlign: "left" }}>Item</th><th style={{ padding: 4 }}>Qty</th><th style={{ padding: 4 }}>Unit</th><th style={{ padding: 4 }}>Total</th></tr></thead>
              <tbody>{result.materials.map((m, i) => <tr key={i} style={{ borderBottom: "1px solid var(--psi-border, #e2e8f0)" }}><td style={{ padding: 4 }}>{m.description}</td><td style={{ padding: 4, textAlign: "center" }}>{m.quantity}</td><td style={{ padding: 4, textAlign: "center" }}>{m.unit}</td><td style={{ padding: 4, textAlign: "center" }}>${m.total.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </details>

          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Labor ({result.labor.length} tasks)</summary>
            <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}>
              <thead><tr><th style={{ padding: 4, textAlign: "left" }}>Task</th><th style={{ padding: 4 }}>Hours</th><th style={{ padding: 4 }}>Rate</th><th style={{ padding: 4 }}>Total</th></tr></thead>
              <tbody>{result.labor.map((l, i) => <tr key={i} style={{ borderBottom: "1px solid var(--psi-border, #e2e8f0)" }}><td style={{ padding: 4 }}>{l.description}</td><td style={{ padding: 4, textAlign: "center" }}>{l.quantity}</td><td style={{ padding: 4, textAlign: "center" }}>${l.unit_cost}/hr</td><td style={{ padding: 4, textAlign: "center" }}>${l.total.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </details>

          {result.warnings.map((w, i) => <div key={i} role="alert" style={{ fontSize: 13, color: "var(--psi-warn)", marginTop: 8, paddingLeft: 8, borderLeft: "2px solid var(--psi-warn)" }}>{w}</div>)}
        </div>
      )}
    </div>
  );
}
