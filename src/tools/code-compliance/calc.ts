/**
 * Code Compliance Calculation Engine
 *
 * Natural language code lookup for IPC 2021 and UPC 2021.
 * Returns relevant code sections, requirements, and plain-language explanations.
 */

// ---------------------------------------------------------------------------
// Code Section Database
// ---------------------------------------------------------------------------

export interface CodeSection {
  section: string;
  title: string;
  code: "ipc-2021" | "upc-2021" | "both";
  category: string;
  requirement: string;
  plain_language: string;
  keywords: string[];
}

const CODE_DB: CodeSection[] = [
  // ── Slope / Grade ─────────────────────────────────────────────────
  { section: "IPC §704.1", title: "Slope of Horizontal Drainage", code: "ipc-2021", category: "slope", requirement: "Horizontal drainage piping ≥4\" shall be installed at 1/4\" per foot (2.08%). 6\" or larger: 1/8\" per foot (1.042%).", plain_language: "A 4-inch lateral needs at least 2.083% slope (about 1/4 inch drop per foot of run). A 6-inch pipe only needs 1.042%.", keywords: ["slope", "grade", "lateral", "horizontal", "drainage", "percent"] },
  { section: "UPC §708.0", title: "Grade of Horizontal Drainage", code: "upc-2021", category: "slope", requirement: "Pipes ≤3\": 1/4\"/ft. 4\"–6\": 1/8\"/ft. ≥8\": 1/16\"/ft.", plain_language: "UPC requires different slopes than IPC. 4-6 inch pipes need 1/8 inch per foot minimum.", keywords: ["slope", "grade", "upc", "horizontal"] },

  // ── Trap Arms ──────────────────────────────────────────────────────
  { section: "IPC §1002.2", title: "Trap Arm Length", code: "ipc-2021", category: "trap", requirement: "Trap arm length shall not exceed the distance given in Table 1002.2. For 1.5\": 3.5 ft. For 2\": 5 ft. For 3\": 6 ft. For 4\": 10 ft.", plain_language: "The pipe from a P-trap to the vent can't be too long. For a 2-inch drain, max 5 feet.", keywords: ["trap", "trap arm", "p-trap", "distance", "vent", "length"] },
  { section: "UPC §1002.2", title: "Trap Arm Length", code: "upc-2021", category: "trap", requirement: "The developed length of the trap arm shall not exceed 24\" for 1-1/4\" and 1-1/2\" traps, 36\" for 2\" traps, and 48\" for 3\" traps.", plain_language: "UPC has stricter trap arm limits than IPC. 2-inch trap arm max is 3 feet.", keywords: ["trap", "trap arm", "p-trap", "distance", "upc"] },

  // ── Venting ────────────────────────────────────────────────────────
  { section: "IPC §904.1", title: "Vent Connection Required", code: "ipc-2021", category: "vent", requirement: "Every fixture trap shall be vented. Vent pipe sizes per Table 906.1.", plain_language: "Every drain that has a P-trap must have a vent. No exceptions.", keywords: ["vent", "venting", "air", "trap", "pressure"] },
  { section: "IPC §905.2", title: "Vent Connection Point", code: "ipc-2021", category: "vent", requirement: "Vent connections shall be made above the fixture flood level rim. Vent pipe shall connect to the drainage system vertically or at max 45° from vertical.", plain_language: "Vents tie in above the fixture, not below it. They connect going uphill.", keywords: ["vent", "connection", "angle", "tie-in"] },
  { section: "IPC §903.1", title: "Vent Termination", code: "ipc-2021", category: "vent", requirement: "Vent extensions through roof: minimum 6\" above roof surface. Shall not terminate within 10' of any air intake, door, or window.", plain_language: "Vents stick up at least 6 inches through the roof and must be 10 feet from windows or air intakes.", keywords: ["vent", "roof", "termination", "stack"] },

  // ── Cleanouts ──────────────────────────────────────────────────────
  { section: "IPC §707.4", title: "Cleanout Location and Spacing", code: "ipc-2021", category: "cleanout", requirement: "Cleanouts shall be installed at intervals not exceeding 100' for 4\" and smaller, 150' for larger. Base of every stack. At each change of direction >45°.", plain_language: "Cleanouts go every 100 feet on 4-inch pipes, at the bottom of every stack, and where pipes bend more than 45 degrees.", keywords: ["cleanout", "access", "spacing", "rodding", "snaking"] },

  // ── Water Supply Pressure ──────────────────────────────────────────
  { section: "IPC §608.3", title: "Minimum Pressure", code: "ipc-2021", category: "pressure", requirement: "Water distribution system shall be designed to provide minimum 20 psi residual pressure at the highest and most remote fixture.", plain_language: "Every fixture needs at least 20 PSI of water pressure, measured at the farthest and highest point.", keywords: ["pressure", "psi", "water", "supply", "minimum", "residual"] },

  // ── Water Heater ───────────────────────────────────────────────────
  { section: "IPC §501.2", title: "Water Heater Relief Valve", code: "ipc-2021", category: "water_heater", requirement: "Temperature and pressure relief valve required. Relief discharge shall terminate 6\" above floor, not connected to drainage system.", plain_language: "Every water heater needs a T&P relief valve. The discharge pipe ends 6 inches above the floor — never plugged into a drain.", keywords: ["water heater", "t&p", "relief", "temperature", "pressure", "safety"] },

  // ── Backflow Prevention ────────────────────────────────────────────
  { section: "IPC §608.1", title: "Backflow Prevention General", code: "ipc-2021", category: "backflow", requirement: "Potable water outlets shall have backflow protection. Atmospheric vacuum breakers, reduced pressure assemblies, or double check valves as required by degree of hazard.", plain_language: "Any connection to the drinking water supply needs a backflow preventer. The type depends on how dangerous the cross-connection is.", keywords: ["backflow", "rpz", "pvb", "dcva", "cross-connection", "contamination"] },

  // ── Materials ──────────────────────────────────────────────────────
  { section: "IPC §605.1", title: "Pipe Material Standards", code: "ipc-2021", category: "material", requirement: "Water pipe: copper (ASTM B88), PEX (ASTM F876/F877), CPVC (ASTM D2846), galvanized steel, stainless steel. Transition fittings required between dissimilar metals.", plain_language: "Acceptable water pipe materials are copper, PEX, CPVC, and a few others. Joining copper to steel needs a dielectric fitting.", keywords: ["material", "pipe", "copper", "pex", "cpvc", "transition", "dielectric"] },

  // ── Fixture Spacing / ADA ──────────────────────────────────────────
  { section: "IPC §405.3.1", title: "Water Closet Clearance", code: "ipc-2021", category: "clearance", requirement: "Minimum 15\" from center to side wall or obstruction. Minimum 21\" clear in front.", plain_language: "A toilet needs at least 15 inches from its center to the nearest wall, and 21 inches of open space in front.", keywords: ["toilet", "water closet", "clearance", "spacing", "bathroom"] },
  { section: "ADA §604.2", title: "ADA Water Closet Clearance", code: "ipc-2021", category: "ada", requirement: "Minimum 60\" wide × 56\" deep compartment (floor-mounted) or 59\" deep (wall-mounted). Grab bars required on side and rear walls.", plain_language: "ADA bathrooms need a 60×56 inch space for the toilet, plus grab bars on the side and back walls.", keywords: ["ada", "accessible", "grab bar", "wheelchair", "disability", "toilet"] },

  // ── Gas Piping ─────────────────────────────────────────────────────
  { section: "IFGC §402.4", title: "Gas Pipe Sizing", code: "ipc-2021", category: "gas", requirement: "Gas piping shall be sized per tables in IFGC §402.4 based on BTU/h load, developed length, and allowable pressure drop. Minimum pipe size: 3/4\" for most residential appliances.", plain_language: "Gas pipes are sized from tables based on total BTU load and distance from the meter. Most appliances need at least 3/4 inch pipe.", keywords: ["gas", "natural gas", "propane", "btu", "pipe sizing", "appliance"] },
];

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface CodeComplianceInput {
  /** Natural language query */
  query: string;
  /** Code edition to search */
  code: "ipc-2021" | "upc-2021" | "both";
  /** Category filter (optional) */
  category?: string;
}

export interface CodeComplianceOutput {
  /** Matching code sections */
  matches: CodeSection[];
  /** Total matches found */
  total_matches: number;
  /** Suggested next queries */
  suggestions: string[];
  /** Warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// All unique categories
// ---------------------------------------------------------------------------

export const CODE_CATEGORIES = [...new Set(CODE_DB.map((s) => s.category))].sort();

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function lookupCode(input: CodeComplianceInput): CodeComplianceOutput {
  const { query, code, category } = input;
  const normalized = query.toLowerCase().trim();
  const queryWords = normalized.split(/\s+/).filter((w) => w.length > 2);
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Score each section by keyword overlap
  const scored = CODE_DB
    .filter((s) => code === "both" || s.code === code || s.code === "both")
    .filter((s) => !category || s.category === category)
    .map((section) => {
      let score = 0;
      const searchText = `${section.title} ${section.requirement} ${section.plain_language} ${section.keywords.join(" ")} ${section.section}`.toLowerCase();

      for (const word of queryWords) {
        if (searchText.includes(word)) score += 1;
      }

      // Bonus for exact section number match
      if (normalized.includes(section.section.toLowerCase())) score += 5;

      // Bonus for category match
      if (normalized.includes(section.category)) score += 2;

      return { section, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const matches = scored.map((s) => s.section);

  if (matches.length === 0) {
    warnings.push(`No code sections matched "${query}". Try broader terms like "slope", "vent", or "trap arm".`);
    suggestions.push("slope requirements", "vent sizing", "trap arm length", "cleanout spacing", "water pressure");
  } else {
    // Suggest related categories
    const matchCategories = new Set(matches.map((m) => m.category));
    for (const cat of CODE_CATEGORIES) {
      if (!matchCategories.has(cat)) {
        suggestions.push(cat.replace("_", " "));
      }
    }
    suggestions.splice(5); // Keep top 5
  }

  return {
    matches,
    total_matches: matches.length,
    suggestions,
    warnings,
  };
}
