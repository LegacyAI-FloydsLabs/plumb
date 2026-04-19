import { useState, useCallback } from "react";
import { countFixtures, FIXTURES, type FixtureCountOutput } from "./calc";

export function FixtureCounterPage() {
  const [fixtures, setFixtures] = useState<Record<string, number>>({});
  const [bathroomGroups, setBathroomGroups] = useState(0);
  const [occupancy, setOccupancy] = useState<"private" | "public">("private");
  const [code, setCode] = useState<"ipc-2021" | "upc-2021">("ipc-2021");
  const [result, setResult] = useState<FixtureCountOutput | null>(null);

  const adjustCount = useCallback((key: string, delta: number) => {
    setFixtures((prev) => {
      const next = { ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) };
      if (next[key] === 0) delete next[key];
      return next;
    });
    setResult(null);
  }, []);

  const handleCompute = useCallback(() => {
    setResult(countFixtures({ fixtures, bathroom_groups: bathroomGroups, occupancy, code }));
  }, [fixtures, bathroomGroups, occupancy, code]);

  return (
    <div className="psi-slope" style={{ maxWidth: "none", width: "100%" }}>
      <section style={{ marginBottom: 24 }}>
        <h2 className="psi-slope__section-title" style={{ fontSize: 14 }}>Fixtures</h2>
        <p className="psi-slope__hint" style={{ marginBottom: 12 }}>
          Tap + to add each fixture type. Bathroom groups (WC + lav + tub/shower in the same room) get a DFU discount.
        </p>
        <div style={{ display: "grid", gap: 6 }}>
          {Object.entries(FIXTURES).map(([key, entry]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "var(--psi-surface, #f8fafc)", borderRadius: 6 }}>
              <span style={{ fontSize: 13 }}>{entry.name} <span style={{ color: "var(--psi-ink-soft, #475569)", fontSize: 11 }}>({entry.dfu} DFU)</span></span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => adjustCount(key, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--psi-border, #e2e8f0)", background: "var(--psi-paper, #fff)", cursor: "pointer", fontSize: 16 }}>-</button>
                <span style={{ width: 24, textAlign: "center", fontWeight: 600 }}>{fixtures[key] ?? 0}</span>
                <button onClick={() => adjustCount(key, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--psi-border, #e2e8f0)", background: "var(--psi-paper, #fff)", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Bathroom Groups</label>
          <input type="number" min={0} value={bathroomGroups} onChange={(e) => { setBathroomGroups(Number(e.target.value)); setResult(null); }} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Occupancy</label>
          <select value={occupancy} onChange={(e) => { setOccupancy(e.target.value as "private" | "public"); setResult(null); }} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            <option value="private">Private (Residential)</option>
            <option value="public">Public / Commercial</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Code</label>
          <select value={code} onChange={(e) => { setCode(e.target.value as "ipc-2021" | "upc-2021"); setResult(null); }} style={{ width: "100%", padding: 10, border: "1px solid var(--psi-input-border, #cbd5e1)", borderRadius: 6, fontSize: 14 }}>
            <option value="ipc-2021">IPC 2021</option>
            <option value="upc-2021">UPC 2021</option>
          </select>
        </div>
      </section>

      <button className="psi-slope__btn psi-slope__btn--primary" onClick={handleCompute} disabled={Object.keys(fixtures).length === 0 && bathroomGroups === 0} style={{ width: "100%", padding: 14, marginBottom: 24 }}>
        Count Fixtures
      </button>

      {result && (
        <div aria-live="polite" style={{ border: "1px solid var(--psi-border, #e2e8f0)", borderRadius: 10, padding: 20, background: "var(--psi-surface, #f8fafc)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{result.total_dfu}</div>
              <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Total DFU</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "var(--psi-paper, #fff)", borderRadius: 8, border: "1px solid var(--psi-border, #e2e8f0)" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--psi-p900, #0c4a6e)" }}>{result.total_wsfu}</div>
              <div style={{ fontSize: 11, color: "var(--psi-ink-soft, #475569)" }}>Total WSFU</div>
            </div>
          </div>
          {result.group_reduction > 0 && (
            <div style={{ padding: "8px 12px", background: "var(--psi-good-bg, #f0fdf4)", color: "var(--psi-good, #16a34a)", borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
              ✅ Bathroom group reduction: {result.group_reduction} DFU saved
            </div>
          )}
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead><tr><th style={{ textAlign: "left", padding: "4px 8px" }}>Fixture</th><th style={{ padding: "4px 8px" }}>Qty</th><th style={{ padding: "4px 8px" }}>DFU</th><th style={{ padding: "4px 8px" }}>WSFU</th></tr></thead>
            <tbody>
              {result.breakdown.map((b, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--psi-border, #e2e8f0)" }}>
                  <td style={{ padding: "4px 8px" }}>{b.fixture}</td>
                  <td style={{ padding: "4px 8px", textAlign: "center" }}>{b.count}</td>
                  <td style={{ padding: "4px 8px", textAlign: "center" }}>{b.dfu}</td>
                  <td style={{ padding: "4px 8px", textAlign: "center" }}>{b.wsfu}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "var(--psi-warn, #d97706)", marginTop: 8 }}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
