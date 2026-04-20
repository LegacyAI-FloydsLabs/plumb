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
    <div className="psi-tool">
      <section>
        <div>
          <input type="text" value={application} onChange={(e) => setApplication(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSelect()} placeholder="Describe the application: irrigation, fire suppression, medical..." />
          <button className="psi-btn psi-btn--accent" onClick={handleSelect}>Select</button>
        </div>
        <div>
          <select value={hazardDegree} onChange={(e) => setHazardDegree(e.target.value as typeof hazardDegree)}>
            <option value="">Auto-detect hazard</option><option value="low">Low hazard</option><option value="medium">Medium hazard</option><option value="high">High hazard</option>
          </select>
          <input type="text" placeholder='Pipe size (e.g. 1, 2, 4)' value={pipeSize} onChange={(e) => setPipeSize(e.target.value)} />
        </div>
      </section>

      {result && (
        <div aria-live="polite">
          <div>
            <div>
              <div>{result.recommended.abbreviation}</div>
              <div>{result.recommended.name}</div>
            </div>
            <div>
              <div>${result.recommended.estimated_cost.low}–${result.recommended.estimated_cost.high}</div>
              <div>Estimated Cost</div>
            </div>
            <div>
              <div>{result.recommended.degree_of_hazard.toUpperCase()}</div>
              <div>Hazard Degree</div>
            </div>
          </div>

          <div>
            {result.recommended.description}
          </div>

          <details>
            <summary>Applications</summary>
            <ul>{result.recommended.applications.map((a, i) => <li key={i}>{a}</li>)}</ul>
          </details>

          <details>
            <summary>Test Procedure ({result.recommended.pass_criteria.length} checks)</summary>
            <ol>{result.recommended.test_procedure.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <table>
              <thead><tr><th>Check</th><th>Pass Criteria</th></tr></thead>
              <tbody>{result.recommended.pass_criteria.map((c, i) => <tr key={i}><td>{c.check}</td><td>{c.value}</td></tr>)}</tbody>
            </table>
          </details>

          <div>
            <div>Installation Notes</div>
            {result.installation_notes.map((n, i) => <div key={i}>• {n}</div>)}
          </div>
          <div>
            <div>Testing Requirements</div>
            {result.testing_requirements.map((r, i) => <div key={i}>• {r}</div>)}
          </div>
          {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
