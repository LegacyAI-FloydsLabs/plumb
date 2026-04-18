import { useState, useCallback } from "react";
import { analyzeHydraulics, C_FACTOR, PIPE_ID, type HydraulicOutput } from "./calc";

export function HydraulicAnalyzerPage() {
  const [material, setMaterial] = useState("copper");
  const [pipeSize, setPipeSize] = useState("3/4");
  const [lengthFt, setLengthFt] = useState(50);
  const [flowGpm, setFlowGpm] = useState(8);
  const [staticPressure, setStaticPressure] = useState(55);
  const [elevationRise, setElevationRise] = useState(0);
  const [fittingsCount, setFittingsCount] = useState(4);
  const [result, setResult] = useState<HydraulicOutput | null>(null);

  const handleCompute = useCallback(() => {
    setResult(analyzeHydraulics({
      material, pipe_size: pipeSize, length_ft: lengthFt,
      flow_gpm: flowGpm, static_pressure_psi: staticPressure,
      elevation_rise_ft: elevationRise, fittings_count: fittingsCount,
    }));
  }, [material, pipeSize, lengthFt, flowGpm, staticPressure, elevationRise, fittingsCount]);

  return (
    <div className="psi-slope" style={{ maxWidth: 720 }}>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Material (C-factor: {C_FACTOR[material] ?? 130})</label>
          <select value={material} onChange={(e) => setMaterial(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            {Object.entries(C_FACTOR).map(([name, c]) => <option key={name} value={name}>{name} (C={c})</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Pipe Size (ID: {PIPE_ID[pipeSize]?.toFixed(3) ?? "?"}")</label>
          <select value={pipeSize} onChange={(e) => setPipeSize(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            {Object.entries(PIPE_ID).map(([name, id]) => <option key={name} value={name}>{name}" (ID {id.toFixed(3)})</option>)}
          </select>
        </div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Flow Rate (GPM)</label><input type="number" min={0} value={flowGpm} onChange={(e) => setFlowGpm(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Developed Length (ft)</label><input type="number" min={1} value={lengthFt} onChange={(e) => setLengthFt(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Static Pressure (psi)</label><input type="number" min={1} value={staticPressure} onChange={(e) => setStaticPressure(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Elevation Rise (ft)</label><input type="number" min={0} value={elevationRise} onChange={(e) => setElevationRise(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
        <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Fittings Count</label><input type="number" min={0} value={fittingsCount} onChange={(e) => setFittingsCount(Number(e.target.value))} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} /></div>
      </section>

      <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleCompute} style={{ width: "100%", padding: 14, marginBottom: 24 }}>Analyze</button>

      {result && (
        <div style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Velocity", value: `${result.velocity_fps} ft/s`, ok: result.velocity_ok },
              { label: "Friction Loss", value: `${result.total_friction_loss_psi} psi`, ok: true },
              { label: "Residual Pressure", value: `${result.residual_pressure_psi} psi`, ok: result.residual_pressure_psi >= 20 },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: "center", padding: 12, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: m.ok ? "var(--psi-p900, #0c4a6e)" : "var(--psi-bad, #dc2626)" }}>{m.value}</div>
                <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>{m.label}</div>
              </div>
            ))}
          </div>
          {result.recommended_size && <div style={{ padding: "8px 12px", background: "var(--psi-warn-bg, #fffbeb)", color: "var(--psi-warn, #d97706)", borderRadius: 6, fontSize: 13, marginBottom: 8 }}>💡 Recommended: upsize to {result.recommended_size}" pipe</div>}
          {result.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-bad, #dc2626)", marginTop: 4 }}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
