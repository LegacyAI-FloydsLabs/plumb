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
    <div className="psi-slope" style={{ maxWidth: "none", width: "100%" }}>
      {/* ── Input Section ─────────────────────────────────────────── */}
      <section className="psi-slope__section" style={{ marginBottom: 24 }}>
        <h2 className="psi-slope__section-title" style={{ fontSize: 14 }}>
          Fixture Loads
        </h2>
        <p className="psi-slope__hint" style={{ marginBottom: 12 }}>
          Enter fixture unit counts from your takeoff. WSFU = water supply,
          DFU = drainage. The engine sizes all three systems (supply, drain,
          vent) in one pass.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

      <section className="psi-slope__section" style={{ marginBottom: 24 }}>
        <h2 className="psi-slope__section-title" style={{ fontSize: 14 }}>
          Site Conditions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--psi-ink-soft, #475569)",
                marginBottom: 4,
              }}
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
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--psi-input-border, #cbd5e1)",
                borderRadius: "var(--psi-radius, 8px)",
                fontSize: 14,
                background: "var(--psi-input-bg, #fff)",
                color: "var(--psi-ink, #0f172a)",
              }}
            >
              <option value="ipc-2021">IPC 2021</option>
              <option value="upc-2021">UPC 2021</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Compute Button ────────────────────────────────────────── */}
      <button
        className="psi-slope__btn psi-slope__btn--primary"
        disabled={!canCompute}
        onClick={handleCompute}
        style={{ width: "100%", marginBottom: 24, padding: "14px 0" }}
      >
        Size My Pipes
      </button>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          style={{
            background: "var(--psi-bad-bg, #fef2f2)",
            color: "var(--psi-bad, #dc2626)",
            padding: 16,
            borderRadius: "var(--psi-radius, 8px)",
            marginBottom: 24,
            fontSize: 14,
          }}
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
      style={{
        border: "1px solid var(--psi-border, #e2e8f0)",
        borderRadius: "var(--psi-radius-lg, 12px)",
        padding: 20,
        background: "var(--psi-surface, #f8fafc)",
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          margin: "0 0 16px 0",
          color: "var(--psi-ink, #0f172a)",
        }}
      >
        Pipe Sizes
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {sizes.map((s) => (
          <div
            key={s.label}
            style={{
              textAlign: "center",
              padding: 16,
              background: "var(--psi-paper, #fff)",
              border: "1px solid var(--psi-border, #e2e8f0)",
              borderRadius: "var(--psi-radius, 8px)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--psi-p900, #0c4a6e)",
              }}
            >
              {s.size}&quot;
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--psi-ink-soft, #475569)",
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Pressure */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          borderRadius: "var(--psi-radius, 8px)",
          marginBottom: 16,
          background: result.pressure_ok
            ? "var(--psi-good-bg, #f0fdf4)"
            : "var(--psi-bad-bg, #fef2f2)",
          color: result.pressure_ok
            ? "var(--psi-good, #16a34a)"
            : "var(--psi-bad, #dc2626)",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {result.pressure_ok ? "✅" : "⚠️"} Residual pressure:{" "}
        {result.residual_pressure_psi} psi
        {!result.pressure_ok && " (min 20 psi)"}
      </div>

      {/* Code sections */}
      <div style={{ fontSize: 12, color: "var(--psi-ink-soft, #475569)" }}>
        <strong>Code sections:</strong> {result.code_sections.join(" · ")}
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: "0 0 8px 0",
              color: "var(--psi-warn, #d97706)",
            }}
          >
            ⚠️ Warnings
          </h4>
          {result.warnings.map((w, i) => (
            <div
              key={i}
              style={{
                fontSize: 13,
                color: "var(--psi-ink-soft, #475569)",
                padding: "8px 12px",
                background: "var(--psi-warn-bg, #fffbeb)",
                borderRadius: "var(--psi-radius, 8px)",
                marginBottom: 4,
              }}
            >
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Minimum branch sizes reference */}
      <details style={{ marginTop: 16 }}>
        <summary
          style={{
            fontSize: 12,
            color: "var(--psi-ink-soft, #475569)",
            cursor: "pointer",
          }}
        >
          IPC minimum fixture branch sizes
        </summary>
        <table
          style={{
            width: "100%",
            fontSize: 12,
            marginTop: 8,
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            {Object.entries(IPC_MIN_BRANCH_SIZE).map(([fixture, size]) => (
              <tr key={fixture}>
                <td
                  style={{
                    padding: "4px 8px",
                    borderBottom: "1px solid var(--psi-border, #e2e8f0)",
                  }}
                >
                  {fixture.replace(/_/g, " ")}
                </td>
                <td
                  style={{
                    padding: "4px 8px",
                    borderBottom: "1px solid var(--psi-border, #e2e8f0)",
                    fontWeight: 600,
                    textAlign: "right",
                  }}
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
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--psi-ink-soft, #475569)",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid var(--psi-input-border, #cbd5e1)",
          borderRadius: "var(--psi-radius, 8px)",
          fontSize: 14,
          background: "var(--psi-input-bg, #fff)",
          color: "var(--psi-ink, #0f172a)",
        }}
      />
    </div>
  );
}
