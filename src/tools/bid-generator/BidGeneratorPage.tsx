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
    <div className="psi-tool">
      <section>
        <h2 className="psi-tool__section-title">Project Type</h2>
        <div>
          {(["new_construction", "remodel", "repair", "emergency"] as const).map((t) => (
            <button key={t} onClick={() => setProjectType(t)}>{t.replace(/_/g, " ")}</button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="psi-tool__section-title">Tasks</h2>
        <div>
          {Object.entries(TASK_TIMES).map(([key, task]) => (
            <button key={key} onClick={() => toggleTask(key)} type="button" aria-pressed={selectedTasks.has(key)}>
              <span>{selectedTasks.has(key) ? "☑" : "☐"}</span>
              <span>{task.description}</span>
              <span>{task.hours} hr</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="psi-tool__section-title">Materials</h2>
        <div>
          {MATERIAL_CATALOG.map((item) => (
            <div key={item.item}>
              <span>{item.item} <span>${item.unit_cost}/{item.unit}</span></span>
              <div>
                <button onClick={() => adjustMaterial(item.item, -1)}>-</button>
                <span>{selectedMaterials[item.item] ?? 0}</span>
                <button onClick={() => adjustMaterial(item.item, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div><label>Labor Rate ($/hr)</label><input type="number" placeholder="Default: $75" value={laborRate} onChange={(e) => setLaborRate(e.target.value ? Number(e.target.value) : "")} /></div>
        <div><label>Overhead & Profit (%)</label><input type="number" min={0} value={overheadPct} onChange={(e) => setOverheadPct(Number(e.target.value))} /></div>
        <div><label>Permit Fees ($)</label><input type="number" min={0} placeholder="0" value={permitFees} onChange={(e) => setPermitFees(e.target.value ? Number(e.target.value) : "")} /></div>
      </section>

      <button className="psi-tool__btn psi-slope__btn--primary" onClick={handleCompute} disabled={Object.keys(selectedMaterials).length === 0 && selectedTasks.size === 0}>
        Generate Bid
      </button>

      {result && (
        <div aria-live="polite">
          <div>
            <div>${result.grand_total.toFixed(2)}</div>
            <div>Grand Total</div>
          </div>

          <div>
            {[
              { label: "Materials", value: result.material_subtotal, pct: result.breakdown.find((b) => b.category === "pipe" || b.category === "fitting" || b.category === "fixture")?.pct ?? 0 },
              { label: "Labor", value: result.labor_subtotal, pct: result.breakdown.find((b) => b.category === "labor")?.pct ?? 0 },
              { label: "Permits", value: result.permits, pct: result.breakdown.find((b) => b.category === "permits")?.pct ?? 0 },
              { label: "Overhead", value: result.overhead_amount, pct: result.breakdown.find((b) => b.category === "overhead_profit")?.pct ?? 0 },
            ].map((s) => (
              <div key={s.label}>
                <div>${s.value.toFixed(0)}</div>
                <div>{s.label} · {s.pct}%</div>
              </div>
            ))}
          </div>

          <details>
            <summary>Materials ({result.materials.length} items)</summary>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
              <tbody>{result.materials.map((m, i) => <tr key={i}><td>{m.description}</td><td>{m.quantity}</td><td>{m.unit}</td><td>${m.total.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </details>

          <details>
            <summary>Labor ({result.labor.length} tasks)</summary>
            <table>
              <thead><tr><th>Task</th><th>Hours</th><th>Rate</th><th>Total</th></tr></thead>
              <tbody>{result.labor.map((l, i) => <tr key={i}><td>{l.description}</td><td>{l.quantity}</td><td>${l.unit_cost}/hr</td><td>${l.total.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </details>

          {result.warnings.map((w, i) => <div key={i} role="alert">{w}</div>)}
        </div>
      )}
    </div>
  );
}
