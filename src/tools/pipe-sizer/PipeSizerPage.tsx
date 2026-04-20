import { useState, useCallback } from "react";
import {
  computePipeSizer,
  IPC_MIN_BRANCH_SIZE,
  type PipeSizerInput,
  type PipeSizerOutput,
} from "./calc";

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function PipeSizerPage() {
  const [input, setInput] = useState<PipeSizerInput>({
    wsfu: 0,
    dfu: 0,
    vent_fu: undefined,
    longest_run_ft: 60,
    elevation_rise_ft: 0,
    code: "ipc-2021",
    stories: 1,
    available_pressure_psi: 55,
  });

  const [result, setResult] = useState<PipeSizerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof PipeSizerInput, value: string | number | undefined) => {
      setInput((prev) => ({ ...prev, [field]: value }));
      setResult(null);
      setError(null);
    },
    [],
  );

  const handleCompute = useCallback(() => {
    try {
      if (input.wsfu <= 0 && input.dfu <= 0) {
        setError("Enter at least WSFU or DFU to compute pipe sizes.");
        return;
      }
      const out = computePipeSizer(input);
      setResult(out);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Computation failed");
      setResult(null);
    }
  }, [input]);

  const canCompute = input.wsfu > 0 || input.dfu > 0;

  return (
    <div className="psi-tool">
      {/* ── Input Section ─────────────────────────────────────────── */}
      <section className="psi-tool__section">
        <h2 className="psi-tool__section-title">
          Fixture Loads
        </h2>
        <p className="psi-tool__hint">
          Enter fixture unit counts from your takeoff. WSFU = water supply,
          DFU = drainage. The engine sizes all three systems (supply, drain,
          vent) in one pass.
        </p>

        <div>
          <NumberField
            label="WSFU (Water Supply Fixture Units)"
            value={input.wsfu}
            onChange={(v) => handleChange("wsfu", v)}
            min={0}
          />
          <NumberField
            label="DFU (Drainage Fixture Units)"
            value={input.dfu}
            onChange={(v) => handleChange("dfu", v)}
            min={0}
          />
          <NumberField
            label="Vent FU (optional)"
            value={input.vent_fu ?? 0}
            onChange={(v) => handleChange("vent_fu", v || undefined)}
            min={0}
          />
          <NumberField
            label="Stories"
            value={input.stories}
            onChange={(v) => handleChange("stories", v)}
            min={1}
          />
        </div>
      </section>

      <section className="psi-tool__section">
        <h2 className="psi-tool__section-title">
          Site Conditions
        </h2>
        <div>
          <NumberField
            label="Longest developed run (ft)"
            value={input.longest_run_ft}
            onChange={(v) => handleChange("longest_run_ft", v)}
            min={1}
          />
          <NumberField
            label="Elevation rise (ft)"
            value={input.elevation_rise_ft}
            onChange={(v) => handleChange("elevation_rise_ft", v)}
            min={0}
          />
          <NumberField
            label="Available pressure (psi)"
            value={input.available_pressure_psi ?? 55}
            onChange={(v) => handleChange("available_pressure_psi", v)}
            min={1}
          />
          <div>
            <label
            >
              Code edition
            </label>
            <select
              value={input.code}
              onChange={(e) =>
                handleChange(
                  "code",
                  e.target.value as "ipc-2021" | "upc-2021",
                )
              }
            >
              <option value="ipc-2021">IPC 2021</option>
              <option value="upc-2021">UPC 2021</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Compute Button ────────────────────────────────────────── */}
      <button
        className="psi-tool__btn psi-slope__btn--primary"
        disabled={!canCompute}
        onClick={handleCompute}
      >
        Size My Pipes
      </button>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────── */}
      {result && <SizerResultCard result={result} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Result Card                                                                */
/* -------------------------------------------------------------------------- */

function SizerResultCard({ result }: { result: PipeSizerOutput }) {
  const sizes = [
    {
      label: "Water Service",
      size: result.water_service_size,
      icon: "💧",
    },
    {
      label: "Main Supply",
      size: result.main_supply_size,
      icon: "🔧",
    },
    {
      label: "Main Drain",
      size: result.main_drain_size,
      icon: "🏗️",
    },
    {
      label: "Stack",
      size: result.stack_size,
      icon: "📐",
    },
    {
      label: "Vent",
      size: result.vent_size,
      icon: "💨",
    },
  ];

  return (
    <div
      aria-live="polite"
    >
      <h3
      >
        Pipe Sizes
      </h3>

      <div
      >
        {sizes.map((s) => (
          <div
            key={s.label}
          >
            <div>{s.icon}</div>
            <div
            >
              {s.size}&quot;
            </div>
            <div
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Pressure */}
      <div
      >
        {result.pressure_ok ? "✅" : "⚠️"} Residual pressure:{" "}
        {result.residual_pressure_psi} psi
        {!result.pressure_ok && " (min 20 psi)"}
      </div>

      {/* Code sections */}
      <div>
        <strong>Code sections:</strong> {result.code_sections.join(" · ")}
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div>
          <h4
          >
            ⚠️ Warnings
          </h4>
          {result.warnings.map((w, i) => (
            <div
              key={i}
            >
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Minimum branch sizes reference */}
      <details>
        <summary
        >
          IPC minimum fixture branch sizes
        </summary>
        <table
        >
          <tbody>
            {Object.entries(IPC_MIN_BRANCH_SIZE).map(([fixture, size]) => (
              <tr key={fixture}>
                <td
                >
                  {fixture.replace(/_/g, " ")}
                </td>
                <td
                >
                  {size}&quot;
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Number Input                                                               */
/* -------------------------------------------------------------------------- */

function NumberField({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div>
      <label
      >
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
