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
    <div className="psi-tool">
      <section>
        <div><label>Total Fixture Units</label><input type="number" min={1} value={totalFu} onChange={(e) => setTotalFu(Number(e.target.value))} /></div>
        <div><label>Building Drain Size</label><select value={drainSize} onChange={(e) => setDrainSize(e.target.value)}><option value="2">2"</option><option value="3">3"</option><option value="4">4"</option><option value="6">6"</option></select></div>
        <div><label>Total Run (ft)</label><input type="number" min={1} value={totalRun} onChange={(e) => setTotalRun(Number(e.target.value))} /></div>
        <div><label>Direction Changes (&gt;45°)</label><input type="number" min={0} value={dirChanges} onChange={(e) => setDirChanges(Number(e.target.value))} /></div>
        <div><label>Stories</label><input type="number" min={1} value={stories} onChange={(e) => setStories(Number(e.target.value))} /></div>
        <div><label>Code</label><select value={code} onChange={(e) => setCode(e.target.value as typeof code)}><option value="ipc-2021">IPC 2021</option><option value="upc-2021">UPC 2021</option></select></div>
      </section>

      <button className="psi-tool__btn psi-slope__btn--primary" onClick={handleCompute}>Design Drainage</button>

      {result && (
        <div aria-live="polite">
          <div>
            <div><div>{result.stack_size}"</div><div>Stack Size</div></div>
            <div><div>{result.cleanout_count}</div><div>Cleanouts ({result.cleanout_spacing_ft} ft)</div></div>
            <div><div>{result.drain_ok ? "✓ OK" : `→ ${result.recommended_drain_size}"`}</div><div>{drainSize}" Drain</div></div>
          </div>
          <details>
            <summary>Trap Arm Limits</summary>
            <table>
              <thead><tr><th>Size</th><th>Max Length</th><th>Min Slope</th></tr></thead>
              <tbody>{result.trap_arm_limits.map((t) => <tr key={t.size}><td>{t.size}"</td><td>{t.max_length_ft} ft</td><td>{t.min_slope_pct}%</td></tr>)}</tbody>
            </table>
          </details>
          {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
