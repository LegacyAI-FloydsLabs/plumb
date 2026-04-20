import { useState, useCallback } from "react";
import { checkAdaCompliance, ADA_REQUIREMENTS, type AdaCheckResult } from "./calc";

export function AdaCompliancePage() {
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ checks: AdaCheckResult[]; passed: number; failed: number; compliance_pct: number } | null>(null);

  const handleChange = useCallback((id: string, value: string) => {
    const num = Number(value);
    setMeasurements((prev) => {
      const next = { ...prev };
      if (value === "" || isNaN(num)) delete next[id]; else next[id] = num;
      return next;
    });
    setResult(null);
  }, []);

  const handleCompute = useCallback(() => {
    const r = checkAdaCompliance({ measurements });
    setResult(r);
  }, [measurements]);

  return (
    <div className="psi-tool">
      <section>
        <p className="psi-tool__hint">Enter measured values for the ADA checks you want to verify. Leave blank to skip.</p>
        <div>
          {ADA_REQUIREMENTS.map((req) => (
            <div key={req.id}>
              <div>
                <div>{req.name}</div>
                <div>{req.section} · {req.min ? `≥${req.min}` : ""}{req.max ? ` ≤${req.max}` : ""}{req.exact ? ` ${req.exact}±${req.tolerance ?? 0}` : ""} {req.unit}</div>
              </div>
              <input type="number" placeholder={req.unit} value={measurements[req.id] ?? ""} onChange={(e) => handleChange(req.id, e.target.value)} />
              {result?.checks.find((c) => c.requirement.id === req.id) && (
                <span>
                  {result.checks.find((c) => c.requirement.id === req.id)?.pass ? "✅ PASS" : "❌ FAIL"}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <button className="psi-tool__btn psi-slope__btn--primary" onClick={handleCompute} disabled={Object.keys(measurements).length === 0}>
        Check Compliance
      </button>

      {result && (
        <div aria-live="polite">
          <div>
            <div><div>{result.passed}</div><div>Passed</div></div>
            <div><div>{result.failed}</div><div>Failed</div></div>
            <div><div>{result.compliance_pct}%</div><div>Compliance</div></div>
          </div>
          {result.checks.filter((c) => !c.pass).map((c) => (
            <div key={c.requirement.id}>
              <strong>{c.requirement.name}</strong> (measured: {c.measured} {c.requirement.unit}): {c.guidance}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
