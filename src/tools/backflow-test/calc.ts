/**
 * Backflow Test & Assembly Selection Engine
 *
 * Determines appropriate backflow prevention assembly type based on
 * degree of hazard, provides test procedures and pass/fail criteria.
 *
 * Per IPC §608 and EPA Safe Drinking Water Act.
 */

// ---------------------------------------------------------------------------
// Assembly Types
// ---------------------------------------------------------------------------

export interface BackflowAssembly {
  id: string;
  name: string;
  abbreviation: string;
  degree_of_hazard: "low" | "medium" | "high";
  description: string;
  applications: string[];
  test_procedure: string[];
  pass_criteria: { check: string; value: string }[];
  estimated_cost: { low: number; high: number };
  requires_certified_tester: boolean;
}

const ASSEMBLIES: BackflowAssembly[] = [
  {
    id: "rpz",
    name: "Reduced Pressure Zone Assembly",
    abbreviation: "RPZ",
    degree_of_hazard: "high",
    description: "Two independently acting check valves with a pressure differential relief valve between them. Provides the highest level of protection.",
    applications: ["Chemical injection systems", "Irrigation with fertilizer injection", "Medical/dental equipment", "Boiler feed lines", "Car washes", "Fire suppression systems with additives"],
    test_procedure: [
      "1. Verify assembly is installed per manufacturer specs (no bypass, proper orientation)",
      "2. Connect test kit to test cocks #1, #2, #3, and #4",
      "3. Test Check Valve #1: Close #2 shutoff. Record differential pressure. Must be ≥ 1.0 psi.",
      "4. Test Check Valve #2: Close #1 shutoff. Record differential pressure. Must be ≥ 1.0 psi.",
      "5. Test Relief Valve: With both shutoffs open, simulate back-pressure condition. Relief must open at ≥ 2.0 psi differential.",
      "6. Record all readings on test form.",
    ],
    pass_criteria: [
      { check: "Check valve #1 differential", value: "≥ 1.0 psi" },
      { check: "Check valve #2 differential", value: "≥ 1.0 psi" },
      { check: "Relief valve opening", value: "≥ 2.0 psi differential" },
      { check: "No visible leaks", value: "All connections dry" },
    ],
    estimated_cost: { low: 150, high: 800 },
    requires_certified_tester: true,
  },
  {
    id: "dcva",
    name: "Double Check Valve Assembly",
    abbreviation: "DCVA",
    degree_of_hazard: "medium",
    description: "Two independently acting spring-loaded check valves in series. Suitable for moderate hazard applications.",
    applications: ["Fire suppression (wet pipe, no additives)", "Commercial buildings", "Multi-family residential", "Cooling towers", "Lawn irrigation (no injection)"],
    test_procedure: [
      "1. Verify assembly orientation (must be horizontal for most models)",
      "2. Connect test kit to test cocks #1 and #2",
      "3. Close downstream shutoff valve (#2)",
      "4. Test Check Valve #1: Record differential. Must be ≥ 1.0 psi.",
      "5. Test Check Valve #2: Close upstream (#1), open downstream. Record differential. Must be ≥ 1.0 psi.",
      "6. Record all readings.",
    ],
    pass_criteria: [
      { check: "Check valve #1 differential", value: "≥ 1.0 psi" },
      { check: "Check valve #2 differential", value: "≥ 1.0 psi" },
      { check: "No visible leaks", value: "All connections dry" },
    ],
    estimated_cost: { low: 100, high: 500 },
    requires_certified_tester: true,
  },
  {
    id: "pvb",
    name: "Pressure Vacuum Breaker",
    abbreviation: "PVB",
    degree_of_hazard: "low",
    description: "Single check valve with an air inlet vent that opens when pressure drops. Back-siphonage protection only — does not protect against back-pressure.",
    applications: ["Lawn irrigation (no injection)", "Hose bibbs", "Laboratory faucets", "Residential sprinkler systems"],
    test_procedure: [
      "1. Verify PVB is installed at least 12\" above highest downstream outlet",
      "2. Connect test kit to test cock",
      "3. Close downstream shutoff valve",
      "4. Bleed air from test cock, then close",
      "5. Open air inlet: Record opening pressure. Must be ≥ 1.0 psi.",
      "6. Test check valve: Close upstream, bleed downstream. No continuous flow.",
      "7. Record all readings.",
    ],
    pass_criteria: [
      { check: "Air inlet opening pressure", value: "≥ 1.0 psi" },
      { check: "Check valve holds tight", value: "No continuous flow" },
      { check: "Installation height", value: "≥ 12\" above highest outlet" },
    ],
    estimated_cost: { low: 25, high: 150 },
    requires_certified_tester: false,
  },
  {
    id: "avb",
    name: "Atmospheric Vacuum Breaker",
    abbreviation: "AVB",
    degree_of_hazard: "low",
    description: "Simple device that allows air to enter the downstream piping when pressure drops. No shutoff valves allowed downstream.",
    applications: ["Hose bibb vacuum breakers", "Single fixture protection", "Residential irrigation (no control valves downstream)"],
    test_procedure: [
      "1. Verify no shutoff valves downstream of AVB",
      "2. Verify AVB is installed at least 6\" above highest downstream outlet",
      "3. Visual inspection: check for debris, proper orientation",
      "4. Turn off water supply: air inlet should open and allow air into pipe",
      "5. Restore pressure: check valve should seat, no continuous discharge",
    ],
    pass_criteria: [
      { check: "No shutoff valves downstream", value: "None allowed" },
      { check: "Installation height", value: "≥ 6\" above highest outlet" },
      { check: "Air inlet function", value: "Opens on loss of pressure" },
      { check: "No continuous discharge", value: "Check seats properly" },
    ],
    estimated_cost: { low: 5, high: 30 },
    requires_certified_tester: false,
  },
];

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface BackflowInput {
  /** Description of the application or hazard */
  application: string;
  /** Known hazard degree (optional — auto-detected if omitted) */
  hazard_degree?: "low" | "medium" | "high";
  /** Pipe size */
  pipe_size?: string;
}

export interface BackflowOutput {
  /** Recommended assembly */
  recommended: BackflowAssembly;
  /** All matching assemblies */
  matches: BackflowAssembly[];
  /** Installation notes */
  installation_notes: string[];
  /** Annual testing requirements */
  testing_requirements: string[];
  /** Warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function selectBackflowAssembly(input: BackflowInput): BackflowOutput {
  const normalized = input.application.toLowerCase();
  const warnings: string[] = [];
  const installationNotes: string[] = [];
  const testingRequirements: string[] = [];

  // Determine hazard degree
  let hazard: "low" | "medium" | "high";
  if (input.hazard_degree) {
    hazard = input.hazard_degree;
  } else {
    // Auto-detect from application description
    const highKeywords = ["chemical", "injection", "medical", "dental", "boiler", "fire", "additive", "car wash", "contaminant", "toxic"];
    const medKeywords = ["commercial", "multi-family", "cooling", "tower", "industrial", "fire suppression"];

    if (highKeywords.some((kw) => normalized.includes(kw))) {
      hazard = "high";
    } else if (medKeywords.some((kw) => normalized.includes(kw))) {
      hazard = "medium";
    } else {
      hazard = "low";
    }
  }

  // Find matching assemblies (equal or higher protection)
  const hazardOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
  const minLevel = hazardOrder[hazard];

  const matches = ASSEMBLIES.filter(
    (a) => hazardOrder[a.degree_of_hazard] >= minLevel,
  ).sort((a, b) => hazardOrder[a.degree_of_hazard] - hazardOrder[b.degree_of_hazard]);

  // Recommend the minimum adequate assembly
  const recommended = matches[0] ?? ASSEMBLIES[2]; // fallback to PVB

  // Installation notes
  if (recommended.abbreviation === "RPZ" || recommended.abbreviation === "DCVA") {
    installationNotes.push("Install in an accessible location with adequate drainage (RPZ relief valves discharge water during normal operation).");
    installationNotes.push("Install with isolation valves on both upstream and downstream sides for testing.");
  }
  if (recommended.abbreviation === "PVB") {
    installationNotes.push("Must be installed at least 12 inches above the highest downstream outlet.");
    installationNotes.push("Does NOT protect against back-pressure — only back-siphonage.");
  }
  if (recommended.abbreviation === "AVB") {
    installationNotes.push("No shutoff valves allowed downstream of the AVB.");
    installationNotes.push("Must be installed at least 6 inches above the highest downstream outlet.");
  }

  if (input.pipe_size) {
    installationNotes.push(`Verify assembly is available in ${input.pipe_size}" size. Not all assemblies come in all sizes.`);
  }

  // Testing requirements
  testingRequirements.push(`Annual testing required for ${recommended.name} (${recommended.abbreviation}).`);
  if (recommended.requires_certified_tester) {
    testingRequirements.push(`${recommended.abbreviation} must be tested by a certified backflow prevention assembly tester.`);
  }
  testingRequirements.push("Test records must be maintained and provided to the water purveyor upon request.");

  if (hazard === "high") {
    warnings.push("High hazard applications require RPZ assembly. DCVA or PVB are NOT acceptable.");
  }

  return {
    recommended,
    matches,
    installation_notes: installationNotes,
    testing_requirements: testingRequirements,
    warnings,
  };
}
