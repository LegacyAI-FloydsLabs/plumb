interface BellyChartProps {
  /** Slope as percentage, e.g. 2.0 for 2% */
  slope: number;
  /** Pipe length in feet */
  length: number;
}

function getSlopeZone(slope: number): { zone: "good" | "warn" | "bad"; label: string } {
  if (slope >= 0.25) {
    return { zone: "good", label: "Good slope (>=1/4\" per ft)" };
  }
  if (slope >= 0.125) {
    return { zone: "warn", label: "Borderline slope (1/8\"-1/4\" per ft)" };
  }
  return { zone: "bad", label: "Belly / poor slope (<1/8\" per ft)" };
}

function getZoneColor(zone: "good" | "warn" | "bad"): string {
  if (zone === "good") return "#22c55e";
  if (zone === "warn") return "#eab308";
  return "#ef4444";
}

export function BellyChart({ slope, length }: BellyChartProps) {
  const { zone, label } = getSlopeZone(slope);
  const color = getZoneColor(zone);

  const W = 400;
  const H = 160;
  const PAD = 32;
  const pipeHeight = 36;

  const startX = PAD;
  const endX = W - PAD;
  const midX = W / 2;
  const midY = H / 2 + (zone === "bad" ? 28 : zone === "warn" ? 16 : 6);
  const zoneW = (endX - startX) / 3;

  return (
    <div
      role="img"
      aria-label={`Slope visualizer: ${label}, ${length} feet`}
      style={{
        border: "1px solid var(--psi-border, #e2e8f0)",
        borderRadius: 10,
        padding: "12px 12px 8px",
        background: "var(--psi-surface, #f8fafc)",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <div
        aria-live="polite"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", width: "100%", overflow: "visible" }}
      >
        {/* Zone bands */}
        <rect x={startX} y={H / 2 - pipeHeight / 2} width={zoneW} height={pipeHeight} fill="#22c55e" fillOpacity={0.2} />
        <rect x={startX + zoneW} y={H / 2 - pipeHeight / 2 - 6} width={zoneW} height={pipeHeight + 12} fill="#eab308" fillOpacity={0.15} />
        <rect x={startX + zoneW * 2} y={H / 2 - pipeHeight / 2} width={zoneW} height={pipeHeight} fill="#ef4444" fillOpacity={0.2} />

        {/* Pipe outline */}
        <rect x={startX} y={H / 2 - pipeHeight / 2} width={endX - startX} height={pipeHeight} fill="none" stroke="#64748b" strokeWidth={1.5} rx={4} />

        {/* Belly curve */}
        <path
          d={`M ${startX} ${H / 2} C ${startX + 40} ${H / 2} ${midX - 40} ${midY} ${midX} ${midY} C ${midX + 40} ${midY} ${endX - 40} ${H / 2} ${endX} ${H / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeOpacity={0.8}
        />

        {/* Slope reference line */}
        <line x1={startX} y1={H / 2} x2={endX} y2={H / 2} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.6} />

        {/* Station markers */}
        <circle cx={startX} cy={H / 2} r={5} fill="#0ea5e9" stroke="#fff" strokeWidth={2} />
        <circle cx={midX} cy={midY} r={6} fill={color} stroke="#fff" strokeWidth={2} />
        <circle cx={endX} cy={H / 2} r={5} fill="#0ea5e9" stroke="#fff" strokeWidth={2} />

        {/* Station labels */}
        <text x={startX} y={H / 2 - pipeHeight / 2 - 6} textAnchor="middle" fontSize={10} fill="#475569" fontWeight={600}>Start</text>
        <text x={midX} y={midY - 14} textAnchor="middle" fontSize={10} fill={color} fontWeight={700}>Belly</text>
        <text x={endX} y={H / 2 - pipeHeight / 2 - 6} textAnchor="middle" fontSize={10} fill="#475569" fontWeight={600}>End</text>

        {/* Slope annotation */}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
          {length} ft - {slope.toFixed(2)}% slope
        </text>

        {/* Slope zone labels */}
        <text x={startX + zoneW / 2} y={H / 2 + pipeHeight / 2 + 14} textAnchor="middle" fontSize={8} fill="#22c55e">1/4"/ft OK</text>
        <text x={startX + zoneW * 1.5} y={H / 2 + pipeHeight / 2 + 14} textAnchor="middle" fontSize={8} fill="#eab308">1/8"/ft WARN</text>
        <text x={startX + zoneW * 2.5} y={H / 2 + pipeHeight / 2 + 14} textAnchor="middle" fontSize={8} fill="#ef4444">&lt;1/8"/ft FAIL</text>
      </svg>
    </div>
  );
}
