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
    <div className="psi-tool">
      <section>
        <div>
          <label>Material A</label>
          <select value={materialA} onChange={(e) => setMaterialA(e.target.value)}>
            {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
          </select>
        </div>
        <div>
          <label>Material B</label>
          <select value={materialB} onChange={(e) => setMaterialB(e.target.value)}>
            {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
          </select>
        </div>
        <div><label>Pipe Size (optional)</label><input type="text" placeholder='e.g. 3/4, 2, 4' value={pipeSize} onChange={(e) => setPipeSize(e.target.value)} /></div>
        <div><label>Joint Count (for BOM)</label><input type="number" min={0} placeholder="e.g. 5" value={jointCount} onChange={(e) => setJointCount(e.target.value ? Number(e.target.value) : "")} /></div>
      </section>

      <button className="psi-tool__btn psi-slope__btn--primary" onClick={handleCheck}>Check Compatibility</button>

      {result && (
        <div aria-live="polite">
          <div>
            {result.compatibility.compatible ? "✅ Compatible" : "❌ Not Compatible"}
          </div>
          <div>
            <div>Transition: {result.compatibility.transition}</div>
            <div>{result.compatibility.notes}</div>
          </div>
          <div>📋 {result.compatibility.code_reference}</div>

          {result.bom.length > 0 && (
            <details>
              <summary>Bill of Materials (${result.estimated_cost.low}–${result.estimated_cost.high})</summary>
              <table>
                <thead><tr><th>Item</th><th>Qty</th><th>Cost</th></tr></thead>
                <tbody>{result.bom.map((b, i) => <tr key={i}><td>{b.description}</td><td>{b.quantity} {b.unit}</td><td>${b.estimated_cost_low}–${b.estimated_cost_high}</td></tr>)}</tbody>
              </table>
            </details>
          )}
          {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
