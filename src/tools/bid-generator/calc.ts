/**
 * Bid Generator Calculation Engine
 *
 * Smart bid with material takeoff and labor estimation for plumbing
 * projects. Uses national average cost data and configurable labor rates.
 */

// ---------------------------------------------------------------------------
// Material Cost Database (national average, per unit)
// ---------------------------------------------------------------------------

export interface MaterialLineItem {
  item: string;
  material: string;
  size: string;
  unit: "ea" | "ft" | "lb" | "box";
  unit_cost: number;
  category: string;
}

const MATERIAL_CATALOG: MaterialLineItem[] = [
  // ── Pipe ──────────────────────────────────────────────────────────
  { item: "Copper Type M (1/2\")", material: "copper", size: "1/2", unit: "ft", unit_cost: 2.50, category: "pipe" },
  { item: "Copper Type M (3/4\")", material: "copper", size: "3/4", unit: "ft", unit_cost: 3.75, category: "pipe" },
  { item: "Copper Type M (1\")", material: "copper", size: "1", unit: "ft", unit_cost: 5.50, category: "pipe" },
  { item: "Copper Type M (2\")", material: "copper", size: "2", unit: "ft", unit_cost: 10.00, category: "pipe" },
  { item: "PEX-A (1/2\")", material: "pex", size: "1/2", unit: "ft", unit_cost: 0.65, category: "pipe" },
  { item: "PEX-A (3/4\")", material: "pex", size: "3/4", unit: "ft", unit_cost: 0.95, category: "pipe" },
  { item: "PEX-A (1\")", material: "pex", size: "1", unit: "ft", unit_cost: 1.50, category: "pipe" },
  { item: "PVC Sch 40 (2\")", material: "pvc", size: "2", unit: "ft", unit_cost: 1.25, category: "pipe" },
  { item: "PVC Sch 40 (3\")", material: "pvc", size: "3", unit: "ft", unit_cost: 2.50, category: "pipe" },
  { item: "PVC Sch 40 (4\")", material: "pvc", size: "4", unit: "ft", unit_cost: 4.00, category: "pipe" },
  { item: "Cast Iron No-Hub (3\")", material: "cast_iron", size: "3", unit: "ft", unit_cost: 12.00, category: "pipe" },
  { item: "Cast Iron No-Hub (4\")", material: "cast_iron", size: "4", unit: "ft", unit_cost: 16.00, category: "pipe" },

  // ── Fittings ──────────────────────────────────────────────────────
  { item: "Copper 90° Elbow (1/2\")", material: "copper", size: "1/2", unit: "ea", unit_cost: 1.50, category: "fitting" },
  { item: "Copper 90° Elbow (3/4\")", material: "copper", size: "3/4", unit: "ea", unit_cost: 2.25, category: "fitting" },
  { item: "Copper Tee (3/4\")", material: "copper", size: "3/4", unit: "ea", unit_cost: 3.00, category: "fitting" },
  { item: "PEX Elbow (1/2\")", material: "pex", size: "1/2", unit: "ea", unit_cost: 0.75, category: "fitting" },
  { item: "PEX Tee (3/4\")", material: "pex", size: "3/4", unit: "ea", unit_cost: 1.25, category: "fitting" },
  { item: "PVC 90° Elbow (2\")", material: "pvc", size: "2", unit: "ea", unit_cost: 2.00, category: "fitting" },
  { item: "PVC Sanitary Tee (3\")", material: "pvc", size: "3", unit: "ea", unit_cost: 5.50, category: "fitting" },
  { item: "PVC Wye (4\")", material: "pvc", size: "4", unit: "ea", unit_cost: 8.00, category: "fitting" },
  { item: "No-Hub Coupling (4\")", material: "cast_iron", size: "4", unit: "ea", unit_cost: 10.00, category: "fitting" },

  // ── Fixtures ──────────────────────────────────────────────────────
  { item: "Water Closet (Tank-type, ADA)", material: "fixture", size: "", unit: "ea", unit_cost: 275, category: "fixture" },
  { item: "Lavatory (Drop-in)", material: "fixture", size: "", unit: "ea", unit_cost: 120, category: "fixture" },
  { item: "Bathtub/Shower Combo", material: "fixture", size: "", unit: "ea", unit_cost: 350, category: "fixture" },
  { item: "Kitchen Sink (SS, double)", material: "fixture", size: "", unit: "ea", unit_cost: 180, category: "fixture" },
  { item: "Kitchen Faucet", material: "fixture", size: "", unit: "ea", unit_cost: 95, category: "fixture" },
  { item: "Lavatory Faucet", material: "fixture", size: "", unit: "ea", unit_cost: 65, category: "fixture" },
  { item: "Shower Valve (Pressure-balance)", material: "fixture", size: "", unit: "ea", unit_cost: 120, category: "fixture" },
  { item: "Water Heater (50gal Gas)", material: "fixture", size: "", unit: "ea", unit_cost: 650, category: "fixture" },
  { item: "Water Heater (Tankless Gas)", material: "fixture", size: "", unit: "ea", unit_cost: 1200, category: "fixture" },

  // ── Valves & Accessories ──────────────────────────────────────────
  { item: "Ball Valve (3/4\")", material: "valve", size: "3/4", unit: "ea", unit_cost: 12, category: "valve" },
  { item: "Ball Valve (1\")", material: "valve", size: "1", unit: "ea", unit_cost: 18, category: "valve" },
  { item: "Stop Valve (1/2\")", material: "valve", size: "1/2", unit: "ea", unit_cost: 6, category: "valve" },
  { item: "Cleanout (4\")", material: "accessory", size: "4", unit: "ea", unit_cost: 15, category: "accessory" },
  { item: "Dielectric Union (3/4\")", material: "accessory", size: "3/4", unit: "ea", unit_cost: 18, category: "accessory" },
  { item: "Pipe insulation (per ft)", material: "accessory", size: "", unit: "ft", unit_cost: 1.50, category: "accessory" },
  { item: "Pipe hangers/straps (box)", material: "accessory", size: "", unit: "box", unit_cost: 12, category: "accessory" },
  { item: "Solder/flux kit", material: "consumable", size: "", unit: "ea", unit_cost: 25, category: "consumable" },
  { item: "PVC primer + cement kit", material: "consumable", size: "", unit: "ea", unit_cost: 18, category: "consumable" },
  { item: "PEX crimp rings (bag of 25)", material: "consumable", size: "", unit: "box", unit_cost: 10, category: "consumable" },
];

// ---------------------------------------------------------------------------
// Labor Rate Database
// ---------------------------------------------------------------------------

export const LABOR_RATES: Record<string, { rate_per_hour: number; unit: string }> = {
  plumber_journeyman: { rate_per_hour: 75, unit: "hr" },
  plumber_apprentice: { rate_per_hour: 45, unit: "hr" },
  plumber_master: { rate_per_hour: 110, unit: "hr" },
  helper: { rate_per_hour: 35, unit: "hr" },
};

// ── Task time estimates (hours per unit) ──────────────────────────────

const TASK_TIMES: Record<string, { description: string; hours: number; crew: string }> = {
  install_toilet: { description: "Install water closet (new construction)", hours: 2, crew: "plumber_journeyman" },
  replace_toilet: { description: "Replace water closet (existing rough-in)", hours: 1, crew: "plumber_journeyman" },
  install_lavatory: { description: "Install lavatory with faucet", hours: 1.5, crew: "plumber_journeyman" },
  install_tub_shower: { description: "Install tub/shower with valve", hours: 4, crew: "plumber_journeyman" },
  install_kitchen_sink: { description: "Install kitchen sink with faucet", hours: 2, crew: "plumber_journeyman" },
  rough_in_bathroom: { description: "Rough-in supply and DWV for bathroom group", hours: 8, crew: "plumber_journeyman" },
  water_heater_replace: { description: "Replace water heater (same location)", hours: 3, crew: "plumber_journeyman" },
  water_heater_tankless: { description: "Install tankless water heater (new gas line)", hours: 6, crew: "plumber_master" },
  gas_line_run: { description: "Run gas line per 25ft", hours: 4, crew: "plumber_journeyman" },
  sewer_lateral: { description: "Sewer lateral repair per 25ft", hours: 8, crew: "plumber_journeyman" },
  copper_run: { description: "Run copper supply per 25ft", hours: 3, crew: "plumber_journeyman" },
  pex_run: { description: "Run PEX supply per 25ft", hours: 1.5, crew: "plumber_journeyman" },
  pvc_drain_run: { description: "Run PVC DWV per 25ft", hours: 3, crew: "plumber_journeyman" },
};

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface BidInput {
  /** Project description */
  project_type: "new_construction" | "remodel" | "repair" | "emergency";
  /** Line items: catalog item → quantity */
  material_quantities: Record<string, number>;
  /** Tasks to perform */
  tasks: string[];
  /** Labor rate override (uses default if not provided) */
  labor_rate_override?: number;
  /** Overhead and profit margin (default: 20%) */
  overhead_pct?: number;
  /** Permit fees */
  permit_fees?: number;
}

export interface BidLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
  category: string;
}

export interface BidOutput {
  /** Material line items */
  materials: BidLineItem[];
  /** Material subtotal */
  material_subtotal: number;
  /** Labor line items */
  labor: BidLineItem[];
  /** Labor subtotal */
  labor_subtotal: number;
  /** Permit fees */
  permits: number;
  /** Overhead and profit */
  overhead_amount: number;
  /** Grand total */
  grand_total: number;
  /** Cost breakdown summary */
  breakdown: { category: string; amount: number; pct: number }[];
  /** Warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function generateBid(input: BidInput): BidOutput {
  const warnings: string[] = [];
  const materials: BidLineItem[] = [];
  const labor: BidLineItem[] = [];

  // ── Materials ───────────────────────────────────────────────────
  for (const [itemKey, qty] of Object.entries(input.material_quantities)) {
    const catalogItem = MATERIAL_CATALOG.find(
      (m) => m.item.toLowerCase().includes(itemKey.toLowerCase()),
    );
    if (!catalogItem) {
      warnings.push(`Material "${itemKey}" not found in catalog. Add as custom line item.`);
      materials.push({
        description: itemKey,
        quantity: qty,
        unit: "ea",
        unit_cost: 0,
        total: 0,
        category: "custom",
      });
      continue;
    }
    materials.push({
      description: catalogItem.item,
      quantity: qty,
      unit: catalogItem.unit,
      unit_cost: catalogItem.unit_cost,
      total: catalogItem.unit_cost * qty,
      category: catalogItem.category,
    });
  }

  const materialSubtotal = materials.reduce((sum, m) => sum + m.total, 0);

  // ── Labor ───────────────────────────────────────────────────────
  const laborRate = input.labor_rate_override ?? LABOR_RATES.plumber_journeyman.rate_per_hour;

  for (const task of input.tasks) {
    const taskDef = TASK_TIMES[task];
    if (!taskDef) {
      warnings.push(`Task "${task}" not found. Adding as 1 hour of labor.`);
      labor.push({
        description: task,
        quantity: 1,
        unit: "hr",
        unit_cost: laborRate,
        total: laborRate,
        category: "labor",
      });
      continue;
    }

    const rate = input.labor_rate_override ?? LABOR_RATES[taskDef.crew]?.rate_per_hour ?? laborRate;
    labor.push({
      description: taskDef.description,
      quantity: taskDef.hours,
      unit: "hr",
      unit_cost: rate,
      total: rate * taskDef.hours,
      category: "labor",
    });
  }

  const laborSubtotal = labor.reduce((sum, l) => sum + l.total, 0);
  const permits = input.permit_fees ?? 0;
  const overheadPct = input.overhead_pct ?? 20;
  const overhead = (materialSubtotal + laborSubtotal + permits) * (overheadPct / 100);
  const grandTotal = materialSubtotal + laborSubtotal + permits + overhead;

  // ── Breakdown ───────────────────────────────────────────────────
  const catTotals: Record<string, number> = {};
  for (const m of materials) {
    catTotals[m.category] = (catTotals[m.category] ?? 0) + m.total;
  }
  catTotals["labor"] = laborSubtotal;
  catTotals["permits"] = permits;
  catTotals["overhead_profit"] = overhead;

  const breakdown = Object.entries(catTotals)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      pct: grandTotal > 0 ? Math.round((amount / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (input.project_type === "emergency") {
    warnings.push("Emergency service typically adds 50-100% surcharge. Adjust labor rate accordingly.");
  }

  return {
    materials,
    material_subtotal: Math.round(materialSubtotal * 100) / 100,
    labor,
    labor_subtotal: Math.round(laborSubtotal * 100) / 100,
    permits,
    overhead_amount: Math.round(overhead * 100) / 100,
    grand_total: Math.round(grandTotal * 100) / 100,
    breakdown,
    warnings,
  };
}

export { MATERIAL_CATALOG, TASK_TIMES };
