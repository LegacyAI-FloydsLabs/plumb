/**
 * Drainage Designer Calculation Engine
 *
 * DWV system design: stack sizing, cleanout spacing, trap arm limits,
 * and vent requirements per IPC 2021 / UPC 2021.
 */

// ---------------------------------------------------------------------------
// Cleanout Spacing (IPC §707.4)
// ---------------------------------------------------------------------------

const CLEANOUT_SPACING: Record<string, number> = {
  "2": 75,     // 75 ft for 2" and smaller
  "3": 100,    // 100 ft for 3"
  "4": 100,    // 100 ft for 4"
  "6": 150,    // 150 ft for 6"+
};

// ---------------------------------------------------------------------------
// Trap Arm Maximum Length (IPC Table 1002.2)
// ---------------------------------------------------------------------------

const TRAP_ARM_LIMITS: Record<string, { length_ft: number; slope_min: number; slope_max: number }> = {
  "1-1/4": { length_ft: 3.5, slope_min: 0.017, slope_max: 1.0 },
  "1-1/2": { length_ft: 5, slope_min: 0.017, slope_max: 1.0 },
  "2": { length_ft: 5, slope_min: 0.017, slope_max: 1.0 },
  "3": { length_ft: 6, slope_min: 0.017, slope_max: 1.0 },
  "4": { length_ft: 10, slope_min: 0.017, slope_max: 1.0 },
};

// ---------------------------------------------------------------------------
// Stack Sizing (IPC Table 916.1 — simplified)
// ---------------------------------------------------------------------------

const STACK_SIZING: { fu_range: [number, number]; stack_size: string }[] = [
  { fu_range: [0, 2], stack_size: "2" },
  { fu_range: [3, 6], stack_size: "2-1/2" },
  { fu_range: [7, 12], stack_size: "3" },
  { fu_range: [13, 20], stack_size: "3" },
  { fu_range: [21, 36], stack_size: "4" },
  { fu_range: [37, 60], stack_size: "4" },
  { fu_range: [61, 100], stack_size: "5" },
  { fu_range: [101, 250], stack_size: "6" },
  { fu_range: [251, 500], stack_size: "8" },
  { fu_range: [501, 99999], stack_size: "10" },
];

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface DrainageInput {
  /** Total fixture units on the system */
  total_fu: number;
  /** Building drain size (nominal) */
  building_drain_size: string;
  /** Total developed length of horizontal drainage in feet */
  total_run_ft: number;
  /** Number of direction changes >45° */
  direction_changes: number;
  /** Number of stories */
  stories: number;
  /** Code edition */
  code: "ipc-2021" | "upc-2021";
}

export interface DrainageOutput {
  /** Recommended stack size */
  stack_size: string;
  /** Number of cleanouts needed */
  cleanout_count: number;
  /** Cleanout spacing in feet */
  cleanout_spacing_ft: number;
  /** Trap arm limits for common sizes */
  trap_arm_limits: { size: string; max_length_ft: number; min_slope_pct: number }[];
  /** Whether the building drain is adequately sized */
  drain_ok: boolean;
  /** Recommended drain size if upgrade needed */
  recommended_drain_size: string | null;
  /** Code sections applicable */
  code_sections: string[];
  /** Warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function designDrainage(input: DrainageInput): DrainageOutput {
  const warnings: string[] = [];
  const code_sections: string[] = [];

  // ── Stack sizing ────────────────────────────────────────────────
  let stackSize = "4"; // default
  for (const entry of STACK_SIZING) {
    if (input.total_fu >= entry.fu_range[0] && input.total_fu <= entry.fu_range[1]) {
      stackSize = entry.stack_size;
      break;
    }
  }
  if (input.stories > 3 && input.total_fu > 60) {
    stackSize = "6";
    warnings.push("3+ story building with >60 FU: minimum 6\" stack recommended per IPC §916.1.");
  }
  code_sections.push("IPC §916.1 (stack sizing)");

  // ── Cleanout spacing ────────────────────────────────────────────
  const spacing = CLEANOUT_SPACING[input.building_drain_size] ?? CLEANOUT_SPACING["4"];
  const cleanoutCount = Math.ceil(input.total_run_ft / spacing) + 1 + input.direction_changes;
  code_sections.push("IPC §707.4 (cleanout spacing)");

  // ── Trap arm limits ────────────────────────────────────────────
  const trapArmLimits = Object.entries(TRAP_ARM_LIMITS).map(([size, limits]) => ({
    size,
    max_length_ft: limits.length_ft,
    min_slope_pct: Math.round(limits.slope_min * 1000) / 10,
  }));
  code_sections.push("IPC §1002.2 (trap arm length)");

  // ── Building drain adequacy ────────────────────────────────────
  const drainSizeMap: Record<string, number> = {
    "2": 6, "3": 12, "4": 42, "6": 264,
  };
  const maxFuForDrain = drainSizeMap[input.building_drain_size] ?? 42;
  const drainOk = input.total_fu <= maxFuForDrain;

  let recommendedDrainSize: string | null = null;
  if (!drainOk) {
    for (const [size, maxFu] of Object.entries(drainSizeMap).sort((a, b) => a[1] - b[1])) {
      if (maxFu >= input.total_fu) {
        recommendedDrainSize = size;
        break;
      }
    }
    warnings.push(`Building drain ${input.building_drain_size}" is undersized for ${input.total_fu} FU (max ${maxFuForDrain}). Upgrade to ${recommendedDrainSize}".`);
    code_sections.push("IPC §710.1 (drain sizing)");
  }

  if (input.code === "upc-2021") {
    code_sections.push("UPC §702.1 (drain sizing)", "UPC §705.2 (vent sizing)");
    warnings.push("UPC uses different FU values and sizing tables. Verify with local code.");
  }

  return {
    stack_size: stackSize,
    cleanout_count: cleanoutCount,
    cleanout_spacing_ft: spacing,
    trap_arm_limits: trapArmLimits,
    drain_ok: drainOk,
    recommended_drain_size: recommendedDrainSize,
    code_sections,
    warnings,
  };
}
