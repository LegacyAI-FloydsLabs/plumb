/**
 * ADA Compliance Scanner Calculation Engine
 *
 * Checks measured values against ADA Standards for Accessible Design
 * (2010 ADA Standards). Returns pass/fail for each requirement with
 * specific remediation guidance.
 */

// ---------------------------------------------------------------------------
// ADA Requirement Database
// ---------------------------------------------------------------------------

export interface AdaRequirement {
  id: string;
  section: string;
  name: string;
  category: string;
  unit: string;
  min?: number;      // Minimum acceptable value
  max?: number;      // Maximum acceptable value
  exact?: number;    // Exact value required (±tolerance)
  tolerance?: number;
  guidance_pass: string;
  guidance_fail: string;
}

const ADA_REQUIREMENTS: AdaRequirement[] = [
  // ── Water Closet / Toilet ──────────────────────────────────────
  { id: "wc_centerline", section: "ADA §604.2", name: "Water closet centerline to wall", category: "toilet", unit: "in", min: 16, max: 18, guidance_pass: "Toilet centerline is within the required 16-18 inch range from side wall.", guidance_fail: "Move toilet so centerline is 16-18 inches from side wall. May require relocating waste rough-in." },
  { id: "wc_front_clearance", section: "ADA §604.3", name: "Clear floor space in front of toilet", category: "toilet", unit: "in", min: 48, guidance_pass: "48+ inches of clear floor space in front of toilet.", guidance_fail: "Need at least 48 inches of clear floor space in front of toilet. Remove obstructions or reconfigure room." },
  { id: "wc_compartment_width", section: "ADA §604.8.1", name: "Compartment width (standard)", category: "toilet", unit: "in", min: 60, guidance_pass: "Compartment is at least 60 inches wide.", guidance_fail: "Compartment must be minimum 60 inches wide for standard ADA stall." },
  { id: "wc_compartment_depth", section: "ADA §604.8.1", name: "Compartment depth (floor-mounted)", category: "toilet", unit: "in", min: 56, guidance_pass: "Compartment depth meets 56 inch minimum.", guidance_fail: "Compartment must be at least 56 inches deep for floor-mounted toilet." },
  { id: "seat_height", section: "ADA §604.4", name: "Toilet seat height", category: "toilet", unit: "in", min: 17, max: 19, guidance_pass: "Seat height 17-19 inches above finished floor — compliant.", guidance_fail: "Install ADA-compliant toilet seat or riser to achieve 17-19 inches above finished floor." },

  // ── Grab Bars ──────────────────────────────────────────────────
  { id: "grab_bar_side_length", section: "ADA §604.5", name: "Side grab bar length", category: "grab_bar", unit: "in", min: 42, guidance_pass: "Side grab bar is at least 42 inches long.", guidance_fail: "Side grab bar must be minimum 42 inches. Install longer bar or add supplemental bar." },
  { id: "grab_bar_rear_length", section: "ADA §604.5", name: "Rear grab bar length", category: "grab_bar", unit: "in", min: 36, guidance_pass: "Rear grab bar is at least 36 inches long.", guidance_fail: "Rear grab bar must be minimum 36 inches." },
  { id: "grab_bar_height", section: "ADA §609.4", name: "Grab bar mounting height", category: "grab_bar", unit: "in", min: 33, max: 36, guidance_pass: "Grab bars mounted 33-36 inches above finished floor.", guidance_fail: "Remount grab bars at 33-36 inches above finished floor." },
  { id: "grab_bar_diameter", section: "ADA §609.2", name: "Grab bar diameter/width", category: "grab_bar", unit: "in", min: 1.25, max: 2, guidance_pass: "Grab bar cross-section is 1.25-2 inches.", guidance_fail: "Replace grab bars with 1.25-2 inch diameter/wide profile." },
  { id: "grab_bar_clearance", section: "ADA §609.3", name: "Grab bar wall clearance", category: "grab_bar", unit: "in", min: 1.5, guidance_pass: "1.5+ inch clearance between grab bar and wall.", guidance_fail: "Install spacers to achieve minimum 1.5 inch clearance between bar and wall." },

  // ── Lavatory / Sink ────────────────────────────────────────────
  { id: "lavatory_height", section: "ADA §606.2", name: "Lavatory/sink rim height", category: "sink", unit: "in", max: 34, guidance_pass: "Sink rim is at or below 34 inches — compliant.", guidance_fail: "Lower sink or install ADA-compliant lavatory at maximum 34 inches above finished floor." },
  { id: "lavatory_knee_clearance", section: "ADA §606.2", name: "Knee clearance under sink", category: "sink", unit: "in", min: 27, guidance_pass: "27+ inches of knee clearance under sink.", guidance_fail: "Need minimum 27 inches of knee clearance. Remove cabinet doors, install insulated pipes, or change vanity." },
  { id: "lavatory_depth", section: "ADA §606.2", name: "Sink depth (front to back)", category: "sink", unit: "in", max: 17, guidance_pass: "Sink is within 17 inch reach depth.", guidance_fail: "Maximum sink depth is 17 inches for forward approach. Consider shallower sink." },

  // ── Doorway / Route ────────────────────────────────────────────
  { id: "doorway_width", section: "ADA §404.2.3", name: "Doorway clear width", category: "doorway", unit: "in", min: 32, guidance_pass: "32+ inches of clear doorway width.", guidance_fail: "Widen doorway to provide minimum 32 inches clear width. Consider offset hinges as alternative." },
  { id: "hallway_width", section: "ADA §403.5.1", name: "Hallway/corridor width", category: "route", unit: "in", min: 36, guidance_pass: "Hallway is 36+ inches wide.", guidance_fail: "Minimum hallway width is 36 inches. Two-way traffic requires 60 inches." },
  { id: "turning_space", section: "ADA §304.3", name: "Turning space (diameter)", category: "route", unit: "in", min: 60, guidance_pass: "60-inch turning space available.", guidance_fail: "Provide 60-inch diameter turning space at dead-ends and direction changes." },

  // ── Shower ─────────────────────────────────────────────────────
  { id: "transfer_shower_size", section: "ADA §608.2.2", name: "Transfer shower size", category: "shower", unit: "in", exact: 36, tolerance: 0.5, guidance_pass: "Transfer shower is 36×36 inches.", guidance_fail: "Transfer shower must be exactly 36×36 inches (±0.5\")." },
  { id: "roll_in_shower_size", section: "ADA §608.2.1", name: "Roll-in shower size", category: "shower", unit: "in", min: 30, guidance_pass: "Roll-in shower is 30+ inches deep × 60 inches wide.", guidance_fail: "Roll-in shower must be at least 30×60 inches." },
  { id: "shower_seat", section: "ADA §610.2", name: "Shower seat depth", category: "shower", unit: "in", min: 15, guidance_pass: "Shower seat is 15+ inches deep.", guidance_fail: "Shower seat must be minimum 15 inches deep." },
];

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface AdaInput {
  /** Map of requirement ID → measured value */
  measurements: Record<string, number>;
  /** Which categories to check (all if empty) */
  categories?: string[];
}

export interface AdaCheckResult {
  requirement: AdaRequirement;
  measured: number;
  pass: boolean;
  guidance: string;
}

export interface AdaOutput {
  /** Individual check results */
  checks: AdaCheckResult[];
  /** Total checks */
  total: number;
  /** Passed checks */
  passed: number;
  /** Failed checks */
  failed: number;
  /** Overall compliance percentage */
  compliance_pct: number;
  /** Categories that had failures */
  failed_categories: string[];
}

// ---------------------------------------------------------------------------
// All categories
// ---------------------------------------------------------------------------

export const ADA_CATEGORIES = [...new Set(ADA_REQUIREMENTS.map((r) => r.category))].sort();

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function checkAdaCompliance(input: AdaInput): AdaOutput {
  const categories = input.categories?.length ? input.categories : ADA_CATEGORIES;

  const checks: AdaCheckResult[] = [];

  for (const req of ADA_REQUIREMENTS) {
    if (!categories.includes(req.category)) continue;
    const measured = input.measurements[req.id];
    if (measured === undefined) continue;

    let pass: boolean;
    if (req.exact !== undefined) {
      const tol = req.tolerance ?? 0;
      pass = Math.abs(measured - req.exact) <= tol;
    } else {
      const aboveMin = req.min === undefined || measured >= req.min;
      const belowMax = req.max === undefined || measured <= req.max;
      pass = aboveMin && belowMax;
    }

    checks.push({
      requirement: req,
      measured,
      pass,
      guidance: pass ? req.guidance_pass : req.guidance_fail,
    });
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.length - passed;
  const failedCategories = [...new Set(checks.filter((c) => !c.pass).map((c) => c.requirement.category))];

  return {
    checks,
    total: checks.length,
    passed,
    failed,
    compliance_pct: checks.length > 0 ? Math.round((passed / checks.length) * 1000) / 10 : 100,
    failed_categories: failedCategories,
  };
}

export { ADA_REQUIREMENTS };
