import { useState, useCallback } from "react";
import { designDrainage, type DrainageOutput } from "./calc";

export function DrainageDesignerPage() {
  const [totalFu, setTotalFu] = useState(20);
  const [drainSize, setDrainSize] = useState("4");
  const [totalRun, setTotalRun] = useState(100);
  const [dirChanges, setDirChanges] = useState(2);
  const [stories, setStories] = useState(1);
  const [code, setCode] = useState<"ipc-2021" | "upc-2021">("ipc-2021");
  const [result, setResult] = useState<DrainageOutput | null>(null);

  const handleCompute = useCallback(() => {
    setResult(designDrainage({ total_fu: totalFu, building_drain_size: drainSize, total_run_ft: totalRun, direction_changes: dirChanges, stories, code }));
  }, [totalFu, drainSize, totalRun, dirChanges, stories, code]);

  return (
    <div className="psi-slope" style={{ maxWidth: 720 }}>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total Fixture Units</label><input type="number" min={1} value={totalFu} onChange={(e) => setTotalFu(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Building Drain Size</label><select value={drainSize} onChange={(e) => setDrainSize(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}><option value="2">2"</option><option value="3">3"</option><option value="4">4"</option><option value="6">6"</option></select></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total Run (ft)</label><input type="number" min={1} value={totalRun} onChange={(e) => setTotalRun(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Direction Changes (&gt;45°)</label><input type="number" min={0} value={dirChanges} onChange={(e) => setDirChanges(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Stories</label><input type="number" min={1} value={stories} onChange={(e) => setStories(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Code</label><select value={code} onChange={(e) => setCode(e.target.value as typeof code)} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}><option value="ipc-2021">IPC 2021</option><option value="upc-2021">UPC 2021</option></select></div>
      </section>

      <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleCompute} style={{ width: "100%", padding: 14, marginBottom: 24 }}>Design Drainage</button>

      {result && (
        <div style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}><div style={{ fontSize: 24, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{result.stack_size}"</div><div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Stack Size</div></div>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}><div style={{ fontSize: 24, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{result.cleanout_count}</div><div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Cleanouts ({result.cleanout_spacing_ft} ft)</div></div>
            <div style={{ textAlign: "center", padding: 16, background: result.drain_ok ? "var(--psi-good-bg, #f0fdf4)" : "var(--psi-bad-bg, #fef2f2)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}><div style={{ fontSize: 18, fontWeight: 700, color: result.drain_ok ? "var(--psi-good, #16a34a)" : "var(--psi-bad, #dc2626)" }}>{result.drain_ok ? "✓ OK" : `→ ${result.recommended_drain_size}"`}</div><div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>{drainSize}" Drain</div></div>
          </div>
          <details style={{ marginTop: 12 }}>
            <summary style={{ fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Trap Arm Limits</summary>
            <table style={{ width: "100%", fontSize: 12, marginTop: 8, borderCollapse: "collapse" }}>
              <thead><tr><th style={{ padding: 4, textAlign: "left" }}>Size</th><th style={{ padding: 4 }}>Max Length</th><th style={{ padding: 4 }}>Min Slope</th></tr></thead>
              <tbody>{result.trap_arm_limits.map((t) => <tr key={t.size}><td style={{ padding: 4 }}>{t.size}"</td><td style={{ padding: 4, textAlign: "center" }}>{t.max_length_ft} ft</td><td style={{ padding: 4, textAlign: "center" }}>{t.min_slope_pct}%</td></tr>)}</tbody>
            </table>
          </details>
          {result.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-warn, #d97706)", marginTop: 8 }}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
