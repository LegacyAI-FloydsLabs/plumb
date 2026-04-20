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
    <div className="psi-tool">
      <section>
        <div>
          <label>Material (C-factor: {C_FACTOR[material] ?? 130})</label>
          <select value={material} onChange={(e) => setMaterial(e.target.value)}>
            {Object.entries(C_FACTOR).map(([name, c]) => <option key={name} value={name}>{name} (C={c})</option>)}
          </select>
        </div>
        <div>
          <label>Pipe Size (ID: {PIPE_ID[pipeSize]?.toFixed(3) ?? "?"}")</label>
          <select value={pipeSize} onChange={(e) => setPipeSize(e.target.value)}>
            {Object.entries(PIPE_ID).map(([name, id]) => <option key={name} value={name}>{name}" (ID {id.toFixed(3)})</option>)}
          </select>
        </div>
        <div><label>Flow Rate (GPM)</label><input type="number" min={0} value={flowGpm} onChange={(e) => setFlowGpm(Number(e.target.value))} /></div>
        <div><label>Developed Length (ft)</label><input type="number" min={1} value={lengthFt} onChange={(e) => setLengthFt(Number(e.target.value))} /></div>
        <div><label>Static Pressure (psi)</label><input type="number" min={1} value={staticPressure} onChange={(e) => setStaticPressure(Number(e.target.value))} /></div>
        <div><label>Elevation Rise (ft)</label><input type="number" min={0} value={elevationRise} onChange={(e) => setElevationRise(Number(e.target.value))} /></div>
        <div><label>Fittings Count</label><input type="number" min={0} value={fittingsCount} onChange={(e) => setFittingsCount(Number(e.target.value))} /></div>
      </section>

      <button className="psi-tool__btn psi-slope__btn--primary" onClick={handleCompute}>Analyze</button>

      {result && (
        <div aria-live="polite">
          <div>
            {[
              { label: "Velocity", value: `${result.velocity_fps} ft/s`, ok: result.velocity_ok },
              { label: "Friction Loss", value: `${result.total_friction_loss_psi} psi`, ok: true },
              { label: "Residual Pressure", value: `${result.residual_pressure_psi} psi`, ok: result.residual_pressure_psi >= 20 },
            ].map((m) => (
              <div key={m.label}>
                <div>{m.value}</div>
                <div>{m.label}</div>
              </div>
            ))}
          </div>
          {result.recommended_size && <div>💡 Recommended: upsize to {result.recommended_size}" pipe</div>}
          {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
