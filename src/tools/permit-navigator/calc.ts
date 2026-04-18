/**
 * Permit Navigator Calculation Engine
 *
 * Determines permit types, fees, required documents, and inspections
 * based on work type and jurisdiction. Data is illustrative — real
 * fees vary by AHJ (Authority Having Jurisdiction).
 */

// ---------------------------------------------------------------------------
// Permit Type Database
// ---------------------------------------------------------------------------

export interface PermitType {
  id: string;
  name: string;
  description: string;
  typical_fee_range: { min: number; max: number };
  required_documents: string[];
  inspections: string[];
  keywords: string[];
}

const PERMIT_TYPES: PermitType[] = [
  {
    id: "plumbing_repair",
    name: "Plumbing Repair Permit",
    description: "Minor plumbing repairs, fixture replacement, leak repair in existing systems.",
    typical_fee_range: { min: 25, max: 75 },
    required_documents: ["Property address", "Description of work", "Contractor license (if applicable)"],
    inspections: ["Rough-in inspection", "Final inspection"],
    keywords: ["repair", "fix", "leak", "replace", "fixture", "faucet", "toilet", "minor"],
  },
  {
    id: "plumbing_new",
    name: "Plumbing Permit (New Construction)",
    description: "New plumbing systems for new construction or major additions.",
    typical_fee_range: { min: 100, max: 500 },
    required_documents: ["Site plan", "Floor plan with plumbing layout", "Water supply calculations", "Fixture schedule", "Contractor license"],
    inspections: ["Underground inspection", "Rough-in inspection", "Water service inspection", "Final inspection"],
    keywords: ["new", "construction", "build", "addition", "install", "rough-in"],
  },
  {
    id: "water_heater",
    name: "Water Heater Replacement Permit",
    description: "Replacement or new installation of water heater (tank or tankless).",
    typical_fee_range: { min: 25, max: 100 },
    required_documents: ["Property address", "Water heater specs (BTU/gallon)", "Venting details", "Gas line size (if gas)"],
    inspections: ["Rough-in (if new gas line)", "Final inspection with T&P test"],
    keywords: ["water heater", "hot water", "tankless", "boiler", "replacement"],
  },
  {
    id: "gas_line",
    name: "Gas Piping Permit",
    description: "New gas line installation or modification of existing gas piping.",
    typical_fee_range: { min: 50, max: 200 },
    required_documents: ["Gas appliance schedule with BTU ratings", "Pipe sizing calculations", "Material specifications"],
    inspections: ["Pressure test (rough-in)", "Final inspection with appliance connection"],
    keywords: ["gas", "natural gas", "propane", "lp", "piping", "appliance"],
  },
  {
    id: "sewer",
    name: "Sewer / Lateral Permit",
    description: "Sewer lateral repair, replacement, or new connection.",
    typical_fee_range: { min: 75, max: 300 },
    required_documents: ["Site plan showing lateral route", "Connection point to public sewer", "Material specifications", "Depth of bury"],
    inspections: ["Excavation inspection", "Pipe bedding inspection", "Connection inspection", "Final/cover inspection"],
    keywords: ["sewer", "lateral", "main", "connection", "underground", "excavation"],
  },
  {
    id: "backflow",
    name: "Backflow Prevention Assembly Permit",
    description: "Installation or testing of backflow prevention assemblies.",
    typical_fee_range: { min: 25, max: 75 },
    required_documents: ["Assembly make/model/size", "Installation location", "Hazard assessment", "Tester certification"],
    inspections: ["Installation inspection", "Annual test certification"],
    keywords: ["backflow", "rpz", "pvb", "dcva", "prevention", "assembly", "test"],
  },
  {
    id: "irrigation",
    name: "Irrigation System Permit",
    description: "New irrigation system or major modification requiring backflow protection.",
    typical_fee_range: { min: 50, max: 150 },
    required_documents: ["Site plan with sprinkler layout", "Backflow prevention device specs", "Water source information"],
    inspections: ["Backflow assembly installation", "Coverage test", "Final inspection"],
    keywords: ["irrigation", "sprinkler", "landscape", "spray", "drip", "water"],
  },
  {
    id: "remodel",
    name: "Remodel / Renovation Permit",
    description: "Bathroom, kitchen, or other remodel involving plumbing modifications.",
    typical_fee_range: { min: 75, max: 350 },
    required_documents: ["Floor plan (before and after)", "Fixture schedule", "Plumbing layout changes", "Structural modifications (if any)", "Contractor license"],
    inspections: ["Demolition inspection", "Rough-in inspection", "Final inspection"],
    keywords: ["remodel", "renovation", "bathroom", "kitchen", "redo", "update", "upgrade"],
  },
];

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface PermitInput {
  /** Natural language description of the work */
  description: string;
  /** Estimated project value in dollars */
  project_value?: number;
  /** Whether the work is commercial or residential */
  occupancy: "residential" | "commercial";
}

export interface PermitOutput {
  /** Matched permit types (ranked by relevance) */
  permits: (PermitType & { match_score: number })[];
  /** Estimated total fees */
  estimated_fees: { low: number; high: number };
  /** All required documents across matched permits */
  required_documents: string[];
  /** All inspections across matched permits */
  inspections: string[];
  /** Additional notes */
  notes: string[];
  /** Warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function navigatePermit(input: PermitInput): PermitOutput {
  const normalized = input.description.toLowerCase();
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);
  const warnings: string[] = [];
  const notes: string[] = [];

  // Score each permit type
  const scored = PERMIT_TYPES.map((permit) => {
    let score = 0;
    const searchText = `${permit.name} ${permit.description} ${permit.keywords.join(" ")}`.toLowerCase();

    for (const word of words) {
      if (searchText.includes(word)) score += 1;
    }
    return { ...permit, match_score: score };
  })
    .filter((p) => p.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score);

  const permits = scored.slice(0, 3); // Top 3 matches

  if (permits.length === 0) {
    // Default to plumbing repair
    const defaultPermit = PERMIT_TYPES[0];
    permits.push({ ...defaultPermit, match_score: 1 });
    warnings.push(`Could not determine permit type from "${input.description}". Defaulting to Plumbing Repair. Contact your local AHJ for specific requirements.`);
  }

  // Aggregate fees
  const feeLow = permits.reduce((sum, p) => sum + p.typical_fee_range.min, 0);
  const feeHigh = permits.reduce((sum, p) => sum + p.typical_fee_range.max, 0);

  // Value-based fee adjustment
  if (input.project_value && input.project_value > 5000) {
    notes.push(`For a $${input.project_value.toLocaleString()} project, some jurisdictions charge a percentage-based fee (typically 1-3% of project value) instead of flat rates.`);
  }

  // Deduplicate documents and inspections
  const docs = [...new Set(permits.flatMap((p) => p.required_documents))];
  const inspections = [...new Set(permits.flatMap((p) => p.inspections))];

  if (input.occupancy === "commercial") {
    notes.push("Commercial projects may require additional permits (fire suppression, accessibility, environmental).");
    docs.push("ADA compliance documentation", "Fire suppression plan (if applicable)");
  }

  notes.push("Fees and requirements vary by jurisdiction. Contact your local building department for exact amounts.");

  return {
    permits,
    estimated_fees: { low: feeLow, high: feeHigh },
    required_documents: docs,
    inspections,
    notes,
    warnings,
  };
}
