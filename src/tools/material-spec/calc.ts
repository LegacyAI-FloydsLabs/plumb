/**
 * Material Specification Engine
 *
 * Material compatibility matrix and BOM (Bill of Materials) generation.
 * Covers common plumbing materials: copper, PEX, CPVC, PVC, galvanized,
 * cast iron, and transition fittings.
 */

// ---------------------------------------------------------------------------
// Material Compatibility Matrix
// ---------------------------------------------------------------------------

export type MaterialId = "copper" | "pex" | "cpvc" | "pvc" | "galvanized" | "cast_iron" | "brass" | "stainless" | "no_hub_cast";

export interface CompatibilityResult {
  material_a: MaterialId;
  material_b: MaterialId;
  compatible: boolean;
  transition: string;
  notes: string;
  code_reference: string;
}

const COMPAT_MATRIX: CompatibilityResult[] = [
  // Copper connections
  { material_a: "copper", material_b: "copper", compatible: true, transition: "Soldered, brazed, or press-fit joint", notes: "Standard copper-to-copper connection. Type M for residential, L for commercial.", code_reference: "IPC §605.2" },
  { material_a: "copper", material_b: "pex", compatible: true, transition: "PEX crimp or expansion fitting with copper adapter", notes: "Use manufacturer-approved transition fittings. Brass or polymer crimp rings.", code_reference: "IPC §605.3" },
  { material_a: "copper", material_b: "cpvc", compatible: true, transition: "CPVC-to-copper transition fitting or threaded adapter", notes: "Use appropriate transition union. Verify temperature ratings.", code_reference: "IPC §605.3" },
  { material_a: "copper", material_b: "galvanized", compatible: true, transition: "Dielectric union or dielectric nipple", notes: "CRITICAL: Direct copper-to-steel contact causes galvanic corrosion. Dielectric fitting is required.", code_reference: "IPC §605.3" },
  { material_a: "copper", material_b: "pvc", compatible: true, transition: "PVC-to-copper threaded adapter with rubber coupling", notes: "PVC is drainage only (not water supply). Use no-hub or fernco coupling.", code_reference: "IPC §605.3" },
  { material_a: "copper", material_b: "cast_iron", compatible: true, transition: "No-hub coupling (fernco) or rubber shielded coupling", notes: "Copper to cast iron for drainage transitions. Use shielded coupling.", code_reference: "IPC §705.2" },
  { material_a: "copper", material_b: "brass", compatible: true, transition: "Soldered, threaded, or compression fitting", notes: "Brass and copper are compatible metals. Standard joining methods apply.", code_reference: "IPC §605.2" },

  // PEX connections
  { material_a: "pex", material_b: "pex", compatible: true, transition: "PEX crimp, clamp, expansion, or push-fit fitting", notes: "Use same-brand fittings and tools. Cross-linked polyethylene.", code_reference: "IPC §605.10" },
  { material_a: "pex", material_b: "cpvc", compatible: true, transition: "Transition fitting approved for both materials", notes: "Verify manufacturer compatibility. Not all PEX fittings work with CPVC.", code_reference: "IPC §605.3" },
  { material_a: "pex", material_b: "galvanized", compatible: true, transition: "PEX-to-threaded adapter (brass body)", notes: "Threaded connection into galvanized fitting. Use Teflon tape and pipe dope.", code_reference: "IPC §605.3" },

  // PVC connections
  { material_a: "pvc", material_b: "pvc", compatible: true, transition: "PVC solvent cement or threaded connection", notes: "DWWP grade for drainage. Use proper primer + cement. Schedule 40 standard.", code_reference: "IPC §705.2" },
  { material_a: "pvc", material_b: "cast_iron", compatible: true, transition: "No-hub coupling (fernco) or shielded coupling", notes: "Common for drainage transitions. Shielded coupling required for below-grade.", code_reference: "IPC §705.2" },
  { material_a: "pvc", material_b: "no_hub_cast", compatible: true, transition: "No-hub coupling with proper shield", notes: "Standard DWV transition. Verify coupling size matches both ODs.", code_reference: "IPC §705.2" },

  // Cast iron
  { material_a: "cast_iron", material_b: "cast_iron", compatible: true, transition: "No-hub coupling, lead and oakum, or compression gasket", notes: "Service weight or extra heavy. No-hub is modern standard.", code_reference: "IPC §705.1" },
  { material_a: "cast_iron", material_b: "no_hub_cast", compatible: true, transition: "No-hub coupling (shielded)", notes: "Standard no-hub connection with 300-series stainless steel shield.", code_reference: "IPC §705.1" },
  { material_a: "cast_iron", material_b: "galvanized", compatible: true, transition: "No-hub coupling or threaded adapter", notes: "Drainage transition. Verify OD compatibility.", code_reference: "IPC §705.2" },

  // Stainless steel
  { material_a: "stainless", material_b: "copper", compatible: true, transition: "Press-fit or threaded connection", notes: "Stainless is compatible with copper. Use approved press fittings.", code_reference: "IPC §605.2" },
  { material_a: "stainless", material_b: "stainless", compatible: true, transition: "Press-fit, welded, or mechanical joint", notes: "Growing in use for water supply. Verify pressure rating.", code_reference: "IPC §605.2" },

  // Incompatible
  { material_a: "copper", material_b: "galvanized", compatible: true, transition: "DIELECTRIC UNION REQUIRED", notes: "Without dielectric fitting: rapid galvanic corrosion. This is a code violation.", code_reference: "IPC §605.3 (dielectric required)" },
];

// ---------------------------------------------------------------------------
// BOM (Bill of Materials)
// ---------------------------------------------------------------------------

export interface BomItem {
  description: string;
  material: string;
  size: string;
  quantity: number;
  unit: "ea" | "ft" | "lb";
  estimated_cost_low: number;
  estimated_cost_high: number;
}

export interface MaterialInput {
  /** Material A to check compatibility */
  material_a: MaterialId;
  /** Material B to check compatibility */
  material_b: MaterialId;
  /** If provided, generate a BOM for the transition */
  pipe_size?: string;
  /** Estimated number of joints */
  joint_count?: number;
}

export interface MaterialOutput {
  /** Compatibility result */
  compatibility: CompatibilityResult;
  /** BOM for the transition (if pipe_size provided) */
  bom: BomItem[];
  /** Total estimated cost range */
  estimated_cost: { low: number; high: number };
  /** Warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Cost Database (simplified national average)
// ---------------------------------------------------------------------------

const COST_ESTIMATES: Record<string, { low: number; high: number }> = {
  "dielectric_union": { low: 12, high: 35 },
  "no_hub_coupling": { low: 8, high: 25 },
  "pex_transition": { low: 4, high: 12 },
  "copper_adapter": { low: 3, high: 10 },
  "threaded_adapter": { low: 2, high: 8 },
  "shielded_coupling": { low: 12, high: 30 },
  "fernco_coupling": { low: 5, high: 15 },
};

// ---------------------------------------------------------------------------
// All available materials
// ---------------------------------------------------------------------------

export const MATERIALS: { id: MaterialId; name: string; category: "supply" | "drainage" | "both" }[] = [
  { id: "copper", name: "Copper (Type M/L/K)", category: "supply" },
  { id: "pex", name: "PEX (A/B/C)", category: "supply" },
  { id: "cpvc", name: "CPVC", category: "supply" },
  { id: "pvc", name: "PVC (Sch 40)", category: "drainage" },
  { id: "galvanized", name: "Galvanized Steel", category: "both" },
  { id: "cast_iron", name: "Cast Iron (Service/Extra Heavy)", category: "drainage" },
  { id: "no_hub_cast", name: "No-Hub Cast Iron", category: "drainage" },
  { id: "brass", name: "Brass", category: "supply" },
  { id: "stainless", name: "Stainless Steel", category: "supply" },
];

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function checkMaterial(input: MaterialInput): MaterialOutput {
  const warnings: string[] = [];
  const bom: BomItem[] = [];

  // Find compatibility (check both orderings)
  let compat = COMPAT_MATRIX.find(
    (c) => c.material_a === input.material_a && c.material_b === input.material_b,
  );
  if (!compat) {
    compat = COMPAT_MATRIX.find(
      (c) => c.material_b === input.material_a && c.material_a === input.material_b,
    );
  }
  if (!compat) {
    compat = {
      material_a: input.material_a,
      material_b: input.material_b,
      compatible: false,
      transition: "No standard transition — consult manufacturer",
      notes: `No direct compatibility data for ${input.material_a} to ${input.material_b}. Consult manufacturer and local AHJ.`,
      code_reference: "IPC §605.3",
    };
    warnings.push(`Unknown compatibility between ${input.material_a} and ${input.material_b}. Verify with manufacturer.`);
  }

  // Generate BOM if pipe size and joint count provided
  if (input.pipe_size && input.joint_count && input.joint_count > 0) {
    const size = input.pipe_size;
    const count = input.joint_count;
    const transitionKey = getTransitionKey(compat.transition);

    if (transitionKey && COST_ESTIMATES[transitionKey]) {
      const cost = COST_ESTIMATES[transitionKey];
      bom.push({
        description: compat.transition,
        material: "varies",
        size,
        quantity: count,
        unit: "ea",
        estimated_cost_low: cost.low * count,
        estimated_cost_high: cost.high * count,
      });
    }

    // Add pipe segments
    bom.push({
      description: `${input.material_a} pipe`,
      material: input.material_a,
      size,
      quantity: count * 2, // rough estimate: 2ft per joint
      unit: "ft",
      estimated_cost_low: count * 2 * 1.5,
      estimated_cost_high: count * 2 * 4,
    });
    bom.push({
      description: `${input.material_b} pipe`,
      material: input.material_b,
      size,
      quantity: count * 2,
      unit: "ft",
      estimated_cost_low: count * 2 * 1.5,
      estimated_cost_high: count * 2 * 4,
    });
  }

  const totalLow = bom.reduce((sum, item) => sum + item.estimated_cost_low, 0);
  const totalHigh = bom.reduce((sum, item) => sum + item.estimated_cost_high, 0);

  return {
    compatibility: compat,
    bom,
    estimated_cost: { low: totalLow, high: totalHigh },
    warnings,
  };
}

function getTransitionKey(transition: string): string | null {
  const t = transition.toLowerCase();
  if (t.includes("dielectric")) return "dielectric_union";
  if (t.includes("no-hub") || t.includes("nohub")) return "no_hub_coupling";
  if (t.includes("pex")) return "pex_transition";
  if (t.includes("copper")) return "copper_adapter";
  if (t.includes("threaded")) return "threaded_adapter";
  if (t.includes("shield")) return "shielded_coupling";
  if (t.includes("fernco")) return "fernco_coupling";
  return null;
}
