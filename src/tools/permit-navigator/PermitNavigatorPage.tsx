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
    <div className="psi-tool">
      <section>
        <div>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Describe the work: bathroom remodel, water heater replacement, gas line..." />
          <button className="psi-tool__btn psi-slope__btn--primary" onClick={handleSearch}>Find Permits</button>
        </div>
        <div>
          <select value={occupancy} onChange={(e) => setOccupancy(e.target.value as typeof occupancy)}>
            <option value="residential">Residential</option><option value="commercial">Commercial</option>
          </select>
          <input type="number" placeholder="Project value ($)" value={projectValue} onChange={(e) => setProjectValue(e.target.value ? Number(e.target.value) : "")} />
        </div>
      </section>

      {result && (
        <div aria-live="polite">
          <div>
            <div>
              <div>${result.estimated_fees.low}–${result.estimated_fees.high}</div>
              <div>Estimated Fees</div>
            </div>
            <div>
              <div>{result.inspections.length}</div>
              <div>Inspections</div>
            </div>
          </div>

          {result.permits.map((p, i) => (
            <div key={i}>
              <div>{p.name}</div>
              <div>{p.description}</div>
            </div>
          ))}

          <details>
            <summary>Required Documents ({result.required_documents.length})</summary>
            <ul>{result.required_documents.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </details>

          <details>
            <summary>Inspections ({result.inspections.length})</summary>
            <ol>{result.inspections.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </details>

          {result.notes.map((n, i) => <div key={i}>ℹ️ {n}</div>)}
          {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
