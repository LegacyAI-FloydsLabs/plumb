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
    <div className="psi-slope" style={{ maxWidth: 720 }}>
      <section style={{ marginBottom: 24 }}>
        <p className="psi-slope__hint" style={{ marginBottom: 12 }}>Enter measured values for the ADA checks you want to verify. Leave blank to skip.</p>
        <div style={{ display: "grid", gap: 8 }}>
          {ADA_REQUIREMENTS.map((req) => (
            <div key={req.id} style={{ display: "grid", gridTemplateColumns: "2fr 80px 1fr", gap: 8, alignItems: "center", padding: "6px 12px", background: "var(--psi-surface, #f8fafc)", borderRadius: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{req.name}</div>
                <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>{req.section} · {req.min ? `≥${req.min}` : ""}{req.max ? ` ≤${req.max}` : ""}{req.exact ? ` ${req.exact}±${req.tolerance ?? 0}` : ""} {req.unit}</div>
              </div>
              <input type="number" placeholder={req.unit} value={measurements[req.id] ?? ""} onChange={(e) => handleChange(req.id, e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14, textAlign: "center" }} />
              {result?.checks.find((c) => c.requirement.id === req.id) && (
                <span style={{ fontSize: 13, fontWeight: 600, color: result.checks.find((c) => c.requirement.id === req.id)?.pass ? "var(--psi-good, #16a34a)" : "var(--psi-bad, #dc2626)" }}>
                  {result.checks.find((c) => c.requirement.id === req.id)?.pass ? "✅ PASS" : "❌ FAIL"}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleCompute} disabled={Object.keys(measurements).length === 0} style={{ width: "100%", padding: 14, marginBottom: 24 }}>
        Check Compliance
      </button>

      {result && (
        <div style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ textAlign: "center", padding: 12, background: "var(--psi-good-bg, #f0fdf4)", borderRadius: 8 }}><div style={{ fontSize: 20, fontWeight: 700, color: "var(--psi-good, #16a34a)" }}>{result.passed}</div><div style={{ fontSize: 11 }}>Passed</div></div>
            <div style={{ textAlign: "center", padding: 12, background: result.failed > 0 ? "var(--psi-bad-bg, #fef2f2)" : "var(--psi-paper, #fff)", borderRadius: 8 }}><div style={{ fontSize: 20, fontWeight: 700, color: result.failed > 0 ? "var(--psi-bad, #dc2626)" : "var(--psi-ink-soft, #475569)" }}>{result.failed}</div><div style={{ fontSize: 11 }}>Failed</div></div>
            <div style={{ textAlign: "center", padding: 12, background: "var(--psi-paper, #fff)", borderRadius: 8 }}><div style={{ fontSize: 20, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{result.compliance_pct}%</div><div style={{ fontSize: 11 }}>Compliance</div></div>
          </div>
          {result.checks.filter((c) => !c.pass).map((c) => (
            <div key={c.requirement.id} style={{ padding: "8px 12px", background: "var(--psi-bad-bg, #fef2f2)", borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
              <strong>{c.requirement.name}</strong> (measured: {c.measured} {c.requirement.unit}): {c.guidance}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
