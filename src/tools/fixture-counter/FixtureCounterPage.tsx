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
    <div className="psi-tool">
      <section>
        <h2 className="psi-tool__section-title">Fixtures</h2>
        <p className="psi-tool__hint">
          Tap + to add each fixture type. Bathroom groups (WC + lav + tub/shower in the same room) get a DFU discount.
        </p>
        <div>
          {Object.entries(FIXTURES).map(([key, entry]) => (
            <div key={key}>
              <span>{entry.name} <span>({entry.dfu} DFU)</span></span>
              <div>
                <button onClick={() => adjustCount(key, -1)}>-</button>
                <span>{fixtures[key] ?? 0}</span>
                <button onClick={() => adjustCount(key, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div>
          <label>Bathroom Groups</label>
          <input type="number" min={0} value={bathroomGroups} onChange={(e) => { setBathroomGroups(Number(e.target.value)); setResult(null); }} />
        </div>
        <div>
          <label>Occupancy</label>
          <select value={occupancy} onChange={(e) => { setOccupancy(e.target.value as "private" | "public"); setResult(null); }}>
            <option value="private">Private (Residential)</option>
            <option value="public">Public / Commercial</option>
          </select>
        </div>
        <div>
          <label>Code</label>
          <select value={code} onChange={(e) => { setCode(e.target.value as "ipc-2021" | "upc-2021"); setResult(null); }}>
            <option value="ipc-2021">IPC 2021</option>
            <option value="upc-2021">UPC 2021</option>
          </select>
        </div>
      </section>

      <button className="psi-btn psi-btn--accent" onClick={handleCompute} disabled={Object.keys(fixtures).length === 0 && bathroomGroups === 0}>
        Count Fixtures
      </button>

      {result && (
        <div aria-live="polite">
          <div>
            <div>
              <div>{result.total_dfu}</div>
              <div>Total DFU</div>
            </div>
            <div>
              <div>{result.total_wsfu}</div>
              <div>Total WSFU</div>
            </div>
          </div>
          {result.group_reduction > 0 && (
            <div>
              ✅ Bathroom group reduction: {result.group_reduction} DFU saved
            </div>
          )}
          <table>
            <thead><tr><th>Fixture</th><th>Qty</th><th>DFU</th><th>WSFU</th></tr></thead>
            <tbody>
              {result.breakdown.map((b, i) => (
                <tr key={i}>
                  <td>{b.fixture}</td>
                  <td>{b.count}</td>
                  <td>{b.dfu}</td>
                  <td>{b.wsfu}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
        </div>
      )}
    </div>
  );
}
