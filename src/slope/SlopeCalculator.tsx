import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { computeSurvey, unitShort } from "./calc";
import type { Station, Survey, Units } from "./types";
import "./styles.css";

/* -------------------------------------------------------------------------- */
/*  Public component API                                                      */
/* -------------------------------------------------------------------------- */

export interface SlopeCalculatorProps {
  /** Job/site identifier — usually the original PSI report id. */
  initialJobId?: string;
  /** Default unit system. */
  initialUnits?: Units;
  /** Nominal pipe diameter (drives code-comparison thresholds). */
  pipeDiameterIn?: 4 | 6;
  /**
   * Called whenever the survey changes. The host PWA can persist this
   * to its own backend / cache. Calculator never persists on its own.
   */
  onChange?: (survey: Survey) => void;
  /** Called when the technician taps "Save / Send to Report". */
  onComplete?: (payload: ExportPayload) => void;
}

export interface ExportPayload {
  survey: Survey;
  result: ReturnType<typeof computeSurvey>;
}

/* -------------------------------------------------------------------------- */
/*  Reducer                                                                    */
/* -------------------------------------------------------------------------- */

interface State {
  jobId: string;
  units: Units;
  stations: Station[];
}

type Action =
    | { type: "set_job_id"; value: string }
    | { type: "set_units"; value: Units }
    | { type: "add_station" }
    | { type: "remove_station"; id: string }
    | { type: "update_station"; id: string; patch: Partial<Station> }
    | { type: "reset" }
    | { type: "undo" }
    | { type: "redo" };

/** History wrapper enables undo/redo. Only structural actions push to history;
  *  typing in set_job_id is debounced so we don't polute the stack. */
interface HistoryState {
    past: State[];
    present: State;
    future: State[];
}

/** Actions that mutate structural state (not transient typing). */
const STRUCTURAL_ACTIONS: Action["type"][] = [
    "add_station",
    "remove_station",
    "update_station",
    "set_units",
    "reset",
];

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function blankStation(label: number): Station {
  return { id: newId(), label, distance: 0, rodReading: 0, depth: 0 };
}

/** Pure state reducer — operates on State, not HistoryState. */
function stateReducer(state: State, action: Action): State {
    switch (action.type) {
        case "set_job_id":
            return { ...state, jobId: action.value };
        case "set_units":
            return { ...state, units: action.value };
        case "add_station": {
            const nextLabel = state.stations.length + 1;
            return { ...state, stations: [...state.stations, blankStation(nextLabel)] };
        }
        case "remove_station": {
            const remaining = state.stations.filter((s) => s.id !== action.id);
            const relabeled = remaining.map((s, i) => ({ ...s, label: i + 1 }));
            return { ...state, stations: relabeled };
        }
        case "update_station":
            return { ...state, stations: state.stations.map((s) => s.id === action.id ? { ...s, ...action.patch } : s) };
        case "reset":
            return initialState(state.jobId, state.units);
        default:
            return state;
    }
}

/** History-aware reducer — wraps stateReducer with undo/redo stack. */
function historyReducer(hist: HistoryState, action: Action): HistoryState {
    if (action.type === "undo") {
        if (hist.past.length === 0) return hist;
        const [prev, ...rest] = hist.past;
        return { past: rest, present: prev, future: [hist.present, ...hist.future] };
    }
    if (action.type === "redo") {
        if (hist.future.length === 0) return hist;
        const [next, ...rest] = hist.future;
        return { past: [hist.present, ...hist.past], present: next, future: rest };
    }
    const next = stateReducer(hist.present, action);
    if (STRUCTURAL_ACTIONS.includes(action.type)) {
        return { past: [hist.present, ...hist.past].slice(0, 50), present: next, future: [] };
    }
    return { ...hist, present: next };
}

function initialState(jobId: string, units: Units): State {
  return {
          jobId,
          units,
          stations: [blankStation(1), blankStation(2)],
      };}

/* -------------------------------------------------------------------------- */
/*  Error Boundary                                                              */
/* -------------------------------------------------------------------------- */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="psi-slope">
          <div className="psi-slope__error-boundary">
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message || "An unexpected error occurred."}</p>
            <button
              className="psi-slope__btn psi-slope__btn--primary"
              onClick={this.handleRetry}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function SlopeCalculator({
  initialJobId = "",
  initialUnits = "imperial",
  pipeDiameterIn = 4,
  onChange,
  onComplete,
}: SlopeCalculatorProps) {
  const [hist, dispatch] = useReducer(
          historyReducer,
          { past: [], present: initialState(initialJobId, initialUnits), future: [] },
      );
      const state = hist.present;
      const canUndo = hist.past.length > 0;
      const canRedo = hist.future.length > 0;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const survey: Survey = useMemo(
          () => ({
              jobId: state.jobId,
              units: state.units,
              completedAt: new Date().toISOString(),
              stations: state.stations,
          }),
          [state.jobId, state.units, state.stations],
      );

  const result = useMemo(
    () => computeSurvey(survey, { pipeDiameterIn }),
    [survey, pipeDiameterIn],
  );

  // Surface every change to the host once per render via microtask.
  useMemo(() => {
    queueMicrotask(() => onChangeRef.current?.(survey));
  }, [survey]);

  const units = unitShort(state.units);
  const verdict = renderVerdict(result.verdict, result.overallSlopePct);

  const handleExport = () => {
    onComplete?.({ survey, result });
    downloadJson(`psi-slope-${state.jobId || "untitled"}.json`, {
      survey,
      result,
    });
  };

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Shift+Z / Ctrl+Y = redo
  useEffect(() => {
      const handler = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); dispatch({ type: "undo" }); }
          else if ((e.ctrlKey || e.metaKey) && (e.key === "z" && e.shiftKey || e.key === "y")) { e.preventDefault(); dispatch({ type: "redo" }); }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
  }, []);

  const bellyIndices = useMemo(
      () => result.segments.map((s, i) => s.isBelly ? i : -1).filter((i): i is number => i >= 0),
      [result.segments],
  );
  return (
    <div className="psi-slope" id="psi-slope-skip-target">
    <div className="psi-slope__toolbar">
     <div className="psi-slope__undo-redo">
      <button
       className="psi-slope__icon-btn"
       aria-label="Undo"
       title="Undo (Ctrl+Z)"
       disabled={!canUndo}
       onClick={() => dispatch({ type: "undo" })}
      >
       ↩
      </button>
      <button
       className="psi-slope__icon-btn"
       aria-label="Redo"
       title="Redo (Ctrl+Shift+Z)"
       disabled={!canRedo}
       onClick={() => dispatch({ type: "redo" })}
      >
       ↪
      </button>
     </div>
     <button
      className="psi-slope__btn psi-slope__btn--ghost"
      onClick={() => dispatch({ type: "reset" })}
     >
      Reset
     </button>
    </div>

      <div className="psi-slope__meta-bar">
        <div className="psi-slope__meta-cell">
          <label htmlFor="psi-jobid">Job / Report ID</label>
          <input
            id="psi-jobid"
            type="text"
            value={state.jobId}
            placeholder="PSI-20260417-001"
            onChange={(e) =>
              dispatch({ type: "set_job_id", value: e.target.value })
            }
          />
        </div>
        <div className="psi-slope__meta-cell">
          <label htmlFor="psi-units">Units</label>
          <select
            id="psi-units"
            value={state.units}
            onChange={(e) =>
              dispatch({
                type: "set_units",
                value: e.target.value as Units,
              })
            }
          >
            <option value="imperial">Imperial (ft)</option>
            <option value="metric">Metric (m)</option>
          </select>
        </div>
        <div className="psi-slope__meta-cell">
          <label>Pipe diameter</label>
          <input value={`${pipeDiameterIn}"`} readOnly />
        </div>
        <div className="psi-slope__meta-cell">
          <label>Stations recorded</label>
          <input value={state.stations.length} readOnly />
        </div>
      </div>

      <section className="psi-slope__section">
        <h2 className="psi-slope__section-title">Measurement Stations</h2>
        <p className="psi-slope__hint">
          For each station: mark the surface above the sonde, take a laser
          rod reading at the mark, and record depth-to-sonde from the
          locator. Distance is cumulative from the cleanout.
        </p>
        <table className="psi-slope__table">
          <thead>
            <tr>
              <th style={{ width: "8%" }}>#</th>
              <th style={{ width: "20%" }}>Distance ({units.distance})</th>
              <th style={{ width: "20%" }}>Rod reading ({units.distance})</th>
              <th style={{ width: "18%" }}>Depth ({units.depth})</th>
              <th>Note</th>
              <th style={{ width: "60px" }} />
            </tr>
          </thead>
          <tbody>
            {state.stations.map((s) => (
              <tr key={s.id}>
                <td>{s.label}</td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={s.distance <= 0 && state.stations.indexOf(s) > 0 ? "psi-slope__input psi-slope__input--error" : "psi-slope__input"}
                    aria-invalid={s.distance <= 0 && state.stations.indexOf(s) > 0}
                    value={s.distance}
                    onChange={(e) =>
                      dispatch({
                        type: "update_station",
                        id: s.id,
                        patch: { distance: parseFloat(e.target.value) || 0 },
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className="psi-slope__input"
                    value={s.rodReading}
                    onChange={(e) =>
                      dispatch({
                        type: "update_station",
                        id: s.id,
                        patch: {
                          rodReading: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className={s.depth <= 0 ? "psi-slope__input psi-slope__input--error" : "psi-slope__input"}
                    aria-invalid={s.depth <= 0}
                    value={s.depth}
                    onChange={(e) =>
                      dispatch({
                        type: "update_station",
                        id: s.id,
                        patch: { depth: parseFloat(e.target.value) || 0 },
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="psi-slope__input"
                    value={s.note ?? ""}
                    placeholder="optional"
                    onChange={(e) =>
                      dispatch({
                        type: "update_station",
                        id: s.id,
                        patch: { note: e.target.value },
                      })
                    }
                  />
                </td>
                <td>
                  <div className="psi-slope__row-actions">
                    <button
                      className="psi-slope__icon-btn"
                      title="Remove station"
                      onClick={() =>
                        dispatch({ type: "remove_station", id: s.id })
                      }
                      disabled={state.stations.length <= 2}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="psi-slope__action-row">
          <button
            className="psi-slope__btn psi-slope__btn--primary"
            onClick={() => dispatch({ type: "add_station" })}
          >
            + Add station
          </button>
        </div>
      </section>

      {result.issues.length > 0 && (
        <div className="psi-slope__issues">
          <strong>Resolve before saving:</strong>
          <ul>
            {result.issues.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={`psi-slope__verdict psi-slope__verdict--${verdict.tone}`} role="status" aria-live="polite">
        {verdict.text}
      </div>

      <div className="psi-slope__results">
        <div className="psi-slope__result-tile">
          <label>Overall slope</label>
          <div className="value">{fmtPct(result.overallSlopePct)}</div>
          <div className="sub">
            {fmtInPerFt(result.overallSlopeInPerFt)} per ft
          </div>
        </div>
        <div className="psi-slope__result-tile">
          <label>Total run measured</label>
          <div className="value">
            {fmtNum(totalRun(state.stations))} {units.distance}
          </div>
          <div className="sub">{state.stations.length} stations</div>
        </div>
        <div className="psi-slope__result-tile">
          <label>Belly segments</label>
          <div className="value">{result.bellyCount}</div>
          <div className="sub">
            {fmtNum(result.bellyRunTotal)} {units.distance} affected
          </div>
        </div>
      </div>

      <section className="psi-slope__section">
        <h2 className="psi-slope__section-title">Segment slopes</h2>
        <table className="psi-slope__table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Run ({units.distance})</th>
              <th>Drop ({units.distance})</th>
              <th>Slope %</th>
              <th>in/ft</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {result.segments.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--psi-ink-soft)" }}>
                  Add at least two valid stations to see segment slopes.
                </td>
              </tr>
            )}
            {result.segments.map((seg, i) => (
              <tr key={i}>
                <td>
                  {seg.fromLabel} → {seg.toLabel}
                </td>
                <td>{fmtNum(seg.run)}</td>
                <td>{fmtNum(seg.drop)}</td>
                <td>{fmtPct(seg.slopePct)}</td>
                <td>{fmtInPerFt(seg.slopeInPerFt)}</td>
                <td>
                  {seg.isBelly ? (
                    <span className="psi-slope__belly-pill">BELLY</span>
                  ) : (
                    "OK"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="psi-slope__section">
        <h2 className="psi-slope__section-title">Profile preview</h2>
        <ProfileChart
          profile={result.invertProfile}
          unitLabel={units.distance}
          bellySegmentIndices={bellyIndices}
        />
      </section>

      <div className="psi-slope__action-row">
        <button
          className="psi-slope__btn psi-slope__btn--accent"
          onClick={handleExport}
          disabled={result.issues.length > 0}
        >
          Export survey JSON
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function totalRun(stations: Station[]): number {
  if (stations.length < 2) return 0;
  return stations[stations.length - 1].distance - stations[0].distance;
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function fmtInPerFt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(3)}″`;
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function renderVerdict(
  v: ReturnType<typeof computeSurvey>["verdict"],
  pct: number,
): { text: string; tone: "good" | "warn" | "bad" | "idle" } {
  switch (v.kind) {
    case "code_compliant":
      return {
        text: `Overall slope ${pct.toFixed(2)}% meets the ${v.minPct.toFixed(2)}% code minimum for this pipe diameter.`,
        tone: "good",
      };
    case "marginal":
      return {
        text: `Overall slope ${pct.toFixed(2)}% is below the ${v.minPct.toFixed(2)}% code minimum but above 50% of it. Functional but not code-compliant.`,
        tone: "warn",
      };
    case "below_minimum":
      return {
        text: `Overall slope ${pct.toFixed(2)}% is well below the ${v.minPct.toFixed(2)}% code minimum. Drainage performance likely impaired.`,
        tone: "bad",
      };
    case "indeterminate":
      return {
        text: `Awaiting valid station data. (${v.reason})`,
        tone: "idle",
      };
  }
}

function downloadJson(filename: string, payload: unknown): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/*  Tiny SVG profile chart                                                     */
/* -------------------------------------------------------------------------- */

interface ProfilePoint {
  label: number;
  distance: number;
  invert: number;
}

function ProfileChart({
  profile,
  unitLabel,
  bellySegmentIndices = [],
}: {
  profile: ProfilePoint[];
  unitLabel: string;
  bellySegmentIndices?: number[];
}) {
  if (profile.length < 2) {
    return (
      <div className="psi-slope__profile-empty" role="img" aria-label="Profile chart: no data">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        <span>Add at least 2 stations with distance data to render the pipe invert profile.</span>
      </div>
    );
  }
  const W = 800;
  const H = 180;
  const PAD = 40;
  const xs = profile.map((p) => p.distance);
  const ys = profile.map((p) => p.invert);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys, 0);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const sx = (x: number) => PAD + ((x - xMin) / xRange) * (W - PAD * 2);
  const sy = (y: number) => H - PAD - ((y - yMin) / yRange) * (H - PAD * 2);

  // Grid lines
  const gridLines: number[] = [];
  const step = yRange > 2 ? 1 : 0.5;
  for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {
    gridLines.push(y);
  }

  // Overall slope line (first to last station)
  const firstPt = profile[0];
  const lastPt = profile[profile.length - 1];

  // Belly highlight polygons
  const bellyAreas = bellySegmentIndices.map((idx) => {
    const from = profile[idx];
    const to = profile[idx + 1];
    if (!from || !to) return null;
    const x1 = sx(from.distance);
    const x2 = sx(to.distance);
    const y1 = sy(from.invert);
    const y2 = sy(to.invert);
    const baseline = sy(0);
    return (
      <polygon
        key={`belly-${idx}`}
        className="psi-slope__belly-area"
        points={`${x1},${baseline} ${x1},${y1} ${x2},${y2} ${x2},${baseline}`}
      />
    );
  });

  return (
    <svg
      className="psi-slope__profile"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Pipe invert profile chart"
    >
      {/* Grid lines */}
      {gridLines.map((y) => (
        <line
          key={`grid-${y}`}
          x1={PAD}
          x2={W - PAD}
          y1={sy(y)}
          y2={sy(y)}
          className="psi-slope__chart-grid"
        />
      ))}
      {/* Overall slope overlay */}
      <line
        className="psi-slope__slope-overlay"
        x1={sx(firstPt.distance)}
        y1={sy(firstPt.invert)}
        x2={sx(lastPt.distance)}
        y2={sy(lastPt.invert)}
      />
      {/* Belly areas */}
      {bellyAreas}
      {/* Profile line */}
      <polyline
        fill="none"
        stroke="var(--psi-p500)"
        strokeWidth={2}
        points={profile.map((p) => `${sx(p.distance)},${sy(p.invert)}`).join(" ")}
      />
      {/* Station markers with tooltips */}
      {profile.map((p) => (
        <g key={p.label}>
          <circle
            cx={sx(p.distance)}
            cy={sy(p.invert)}
            r={5}
            fill="var(--psi-accent)"
            stroke="var(--psi-paper)"
            strokeWidth={2}
          >
            <title>Station {p.label}: {p.invert.toFixed(2)} {unitLabel}</title>
          </circle>
          <text
            x={sx(p.distance)}
            y={sy(p.invert) - 10}
            textAnchor="middle"
            fontSize={10}
            fill="var(--psi-p900)"
            fontWeight={700}
          >
            {p.label}
          </text>
        </g>
      ))}
      {/* Axis label */}
      <text x={PAD} y={H - 6} fontSize={10} fill="var(--psi-ink-soft)">
        distance ({unitLabel}) &middot; invert relative to station 1
      </text>
    </svg>
  );
}
