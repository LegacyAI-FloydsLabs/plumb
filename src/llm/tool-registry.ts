/**
 * FLUM Tool Registry — Self-Contained API Contract (Standard 000)
 *
 * Every tool has two layers:
 *   Layer 1 — SLM-safe. 3 or fewer required fields. Zero-shot success.
 *   Layer 2 — Full parameter surface for frontier models. Diagnostics, sensors, confidence.
 *
 * An LLM discovers tools via GET /tools or GET /tools/{id}, reads the schema,
 * constructs a payload, and calls POST /{tool} or POST /compute.
 * No external documentation needed. The schema IS the contract.
 */

import type { ToolId } from "./flum";

// ── JSON Schema types (minimal, no runtime dependency) ────────────────────

interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  examples?: unknown[];
}

interface JsonSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
  description: string;
}

// ── Tool definition ───────────────────────────────────────────────────────

export interface ToolDefinition {
  id: ToolId;
  name: string;
  /** One-line description an SLM can understand */
  tagline: string;
  /** What this tool does, in plain language */
  description: string;
  /** Which code authorities are referenced */
  codes: ("ipc-2021" | "upc-2021")[];
  /** Valid actions for this tool */
  actions: string[];
  /** Layer 1 schema: 3 or fewer required fields */
  layer1: JsonSchema;
  /** Layer 2 schema: full parameter surface */
  layer2: JsonSchema;
  /** Example payloads an SLM can copy */
  examples: {
    description: string;
    layer1: Record<string, unknown>;
    layer2: Record<string, unknown>;
  }[];
}

// ── Station sub-schema (shared between slope tools) ───────────────────────

const STATION_SCHEMA: JsonSchemaProperty = {
  type: "array",
  description: "Survey stations. Each has label, distance, rodReading, and depth.",
  items: {
    type: "object",
    properties: {
      label: { type: "number", description: "Station number (1, 2, 3...)" },
      distance: { type: "number", description: "Distance from cleanout in feet" },
      rodReading: { type: "number", description: "Laser rod reading at surface" },
      depth: { type: "number", description: "Depth to sonde in feet" },
    },
  },
};

// ── All 11 tool definitions ───────────────────────────────────────────────

export const TOOLS: Record<ToolId, ToolDefinition> = {
  slope: {
    id: "slope",
    name: "Slope Reader",
    tagline: "Calculate pipe slope and detect bellies from survey stations",
    description:
      "Takes field survey stations (distance, rod reading, depth) and computes " +
      "overall slope percentage, inches per foot, belly segments, and code compliance " +
      "verdict against IPC/UPC minimum slopes. Supports classify action for quick " +
      "pass/fail on a known slope percentage.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute", "classify"],
    layer1: {
      type: "object",
      description: "Compute slope from survey stations. Send at least 2 stations.",
      properties: {
        stations: STATION_SCHEMA,
      },
      required: ["stations"],
    },
    layer2: {
      type: "object",
      description: "Full slope calculation with units, pipe diameter, and sensor metadata.",
      properties: {
        stations: STATION_SCHEMA,
        units: {
          type: "string",
          description: "Measurement system",
          enum: ["imperial", "metric"],
          default: "imperial",
        },
        pipeDiameterIn: {
          type: "number",
          description: "Pipe diameter in inches (affects minimum slope threshold)",
          enum: ["4", "6"],
          default: 4,
        },
        jobId: {
          type: "string",
          description: "Job or site identifier",
          default: "FLLM",
        },
        action: {
          type: "string",
          description: "Action to perform",
          enum: ["compute", "classify"],
          default: "compute",
        },
        pct: {
          type: "number",
          description: "Slope percentage to classify (only for classify action)",
        },
        sensor_sources: {
          type: "array",
          description: "Where the measurement data came from",
          items: { type: "string" },
          default: ["manual_entry"],
        },
        confidence_threshold: {
          type: "number",
          description: "Minimum confidence to accept result (0-1)",
          minimum: 0,
          maximum: 1,
        },
        include_advanced: {
          type: "boolean",
          description: "Include full metadata in response",
          default: false,
        },
        diagnostic_dump: {
          type: "boolean",
          description: "Return intermediate calculation steps for debugging",
          default: false,
        },
      },
      required: ["stations"],
    },
    examples: [
      {
        description: "Two-station slope check",
        layer1: {
          stations: [
            { label: 1, distance: 0, rodReading: 4.5, depth: 3.2 },
            { label: 2, distance: 50, rodReading: 5.75, depth: 4.1 },
          ],
        },
        layer2: {
          stations: [
            { label: 1, distance: 0, rodReading: 4.5, depth: 3.2 },
            { label: 2, distance: 50, rodReading: 5.75, depth: 4.1 },
          ],
          units: "imperial",
          pipeDiameterIn: 6,
          jobId: "PSI-2026-042",
          include_advanced: true,
        },
      },
      {
        description: "Classify a known slope percentage",
        layer1: { stations: [] },
        layer2: { stations: [], action: "classify", pct: 2.083, pipeDiameterIn: 4 },
      },
    ],
  },

  pipe_sizer: {
    id: "pipe_sizer",
    name: "Pipe Sizer",
    tagline: "Size water supply, drain, and vent pipes by fixture units",
    description:
      "Takes water supply fixture units (WSFU) and drainage fixture units (DFU) " +
      "and determines minimum pipe sizes for water service, main supply, drain, " +
      "and vent. Checks residual pressure if elevation and run length are provided.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute", "size"],
    layer1: {
      type: "object",
      description: "Size pipes from fixture unit counts. Just WSFU and DFU.",
      properties: {
        wsfu: {
          type: "number",
          description: "Water supply fixture units total",
          examples: [12],
        },
        dfu: {
          type: "number",
          description: "Drainage fixture units total",
          examples: [6],
        },
      },
      required: ["wsfu", "dfu"],
    },
    layer2: {
      type: "object",
      description: "Full pipe sizing with building details and pressure analysis.",
      properties: {
        wsfu: { type: "number", description: "Water supply fixture units total" },
        dfu: { type: "number", description: "Drainage fixture units total" },
        vent_fu: { type: "number", description: "Vent fixture units (optional)" },
        longest_run_ft: {
          type: "number",
          description: "Longest developed length in feet",
          default: 60,
        },
        elevation_rise_ft: {
          type: "number",
          description: "Elevation rise from meter to highest fixture in feet",
          default: 0,
        },
        code: {
          type: "string",
          description: "Code edition",
          enum: ["ipc-2021", "upc-2021"],
          default: "ipc-2021",
        },
        stories: {
          type: "number",
          description: "Number of stories",
          default: 1,
        },
        available_pressure_psi: {
          type: "number",
          description: "Available static pressure at meter in PSI",
        },
        sensor_sources: {
          type: "array",
          description: "Where the fixture unit data came from",
          items: { type: "string" },
        },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["wsfu", "dfu"],
    },
    examples: [
      {
        description: "Simple residential sizing",
        layer1: { wsfu: 12, dfu: 6 },
        layer2: {
          wsfu: 12,
          dfu: 6,
          longest_run_ft: 80,
          elevation_rise_ft: 12,
          code: "ipc-2021",
          stories: 2,
          available_pressure_psi: 55,
          include_advanced: true,
        },
      },
    ],
  },

  fixture_counter: {
    id: "fixture_counter",
    name: "Fixture Counter",
    tagline: "Count DFU and WSFU with bathroom group reduction",
    description:
      "Takes a map of fixture types to quantities and calculates total DFU " +
      "(drainage fixture units) and WSFU (water supply fixture units). Supports " +
      "bathroom group reduction per IPC/UPC tables.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute", "count"],
    layer1: {
      type: "object",
      description: "Count fixture units. Send fixtures as a map of fixture name to quantity.",
      properties: {
        fixtures: {
          type: "object",
          description: "Map of fixture key to quantity. Keys like: water_closet, lavatory, bathtub, shower, kitchen_sink, etc.",
          properties: {
            water_closet: { type: "number", description: "Number of toilets" },
            lavatory: { type: "number", description: "Number of bathroom sinks" },
            bathtub: { type: "number", description: "Number of bathtubs" },
          },
        },
        bathroom_groups: {
          type: "number",
          description: "Number of complete bathroom groups (WC + lavatory + bathtub/shower). Group reduction applies.",
        },
      },
      required: [],
    },
    layer2: {
      type: "object",
      description: "Full fixture counting with code edition and occupancy type.",
      properties: {
        fixtures: {
          type: "object",
          description: "Map of fixture key to quantity",
        },
        bathroom_groups: {
          type: "number",
          description: "Complete bathroom groups for group reduction",
        },
        occupancy: {
          type: "string",
          description: "Occupancy type (affects some fixture unit values)",
          enum: ["private", "public"],
          default: "private",
        },
        code: {
          type: "string",
          description: "Code edition for fixture unit table",
          enum: ["ipc-2021", "upc-2021"],
          default: "ipc-2021",
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: [],
    },
    examples: [
      {
        description: "Two bathroom groups",
        layer1: { bathroom_groups: 2 },
        layer2: {
          fixtures: { water_closet: 3, lavatory: 3, bathtub: 1, shower: 2, kitchen_sink: 1 },
          bathroom_groups: 2,
          occupancy: "private",
          code: "ipc-2021",
          include_advanced: true,
        },
      },
    ],
  },

  code_compliance: {
    id: "code_compliance",
    name: "Code Book",
    tagline: "Look up IPC/UPC code sections by topic",
    description:
      "Searches IPC and UPC code tables for requirements matching a plain-language " +
      "query. Returns matching sections with plain-language summaries, section numbers, " +
      "and compliance guidance.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Search code requirements by topic.",
      properties: {
        query: {
          type: "string",
          description: "What to look up: 'trap arm length', 'vent sizing', 'water heater clearance', etc.",
          examples: ["trap arm length", "vent sizing", "cleanout spacing"],
        },
      },
      required: ["query"],
    },
    layer2: {
      type: "object",
      description: "Targeted code lookup with code edition and category filter.",
      properties: {
        query: { type: "string", description: "Search term or topic" },
        code: {
          type: "string",
          description: "Which code to search",
          enum: ["ipc-2021", "upc-2021", "both"],
          default: "both",
        },
        category: {
          type: "string",
          description: "Filter by category (e.g., 'venting', 'drainage', 'water_supply')",
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["query"],
    },
    examples: [
      {
        description: "Look up trap arm requirements",
        layer1: { query: "trap arm maximum length" },
        layer2: { query: "trap arm maximum length", code: "ipc-2021", category: "drainage" },
      },
    ],
  },

  hydraulic_analyzer: {
    id: "hydraulic_analyzer",
    name: "Pressure Reader",
    tagline: "Analyze pressure, flow, velocity, and friction loss",
    description:
      "Given flow rate, pipe size, and material, calculates velocity, residual " +
      "pressure, and friction loss. Flags out-of-range velocities and suggests " +
      "up-sizing if needed.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Analyze hydraulics. Just flow rate and pipe size.",
      properties: {
        flow_gpm: {
          type: "number",
          description: "Flow rate in gallons per minute",
          examples: [8, 20, 40],
        },
        pipe_size: {
          type: "string",
          description: 'Nominal pipe size: "1/2", "3/4", "1", "1-1/4", "1-1/2", "2", "3", "4"',
          examples: ["3/4", "1", "2"],
        },
      },
      required: ["flow_gpm", "pipe_size"],
    },
    layer2: {
      type: "object",
      description: "Full hydraulic analysis with material, length, and pressure details.",
      properties: {
        flow_gpm: { type: "number", description: "Flow rate in GPM" },
        pipe_size: { type: "string", description: "Nominal pipe size" },
        material: {
          type: "string",
          description: "Pipe material for friction factor",
          enum: ["copper", "pvc", "pex", "galvanized", "cast_iron"],
          default: "copper",
        },
        length_ft: {
          type: "number",
          description: "Developed pipe length in feet",
          default: 50,
        },
        static_pressure_psi: {
          type: "number",
          description: "Static pressure at source in PSI",
          default: 55,
        },
        elevation_rise_ft: {
          type: "number",
          description: "Elevation rise in feet",
          default: 0,
        },
        fittings_count: {
          type: "number",
          description: "Number of fittings for equivalent length estimate",
          default: 0,
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["flow_gpm", "pipe_size"],
    },
    examples: [
      {
        description: "Check velocity on a 3/4 copper line",
        layer1: { flow_gpm: 8, pipe_size: "3/4" },
        layer2: {
          flow_gpm: 8,
          pipe_size: "3/4",
          material: "copper",
          length_ft: 60,
          static_pressure_psi: 55,
          elevation_rise_ft: 10,
          fittings_count: 4,
          include_advanced: true,
        },
      },
    ],
  },

  drainage_designer: {
    id: "drainage_designer",
    name: "Drain Layout",
    tagline: "Design drainage stack, cleanout, and vent layouts",
    description:
      "Sizes the drainage stack, determines cleanout spacing and count, and checks " +
      "if the building drain is adequate for the given fixture unit load.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Design drainage from total fixture units.",
      properties: {
        total_fu: {
          type: "number",
          description: "Total fixture units on the drainage system",
          examples: [20, 100, 256],
        },
      },
      required: ["total_fu"],
    },
    layer2: {
      type: "object",
      description: "Full drainage design with building details.",
      properties: {
        total_fu: { type: "number", description: "Total fixture units" },
        building_drain_size: {
          type: "string",
          description: "Nominal building drain size",
          default: "4",
        },
        total_run_ft: {
          type: "number",
          description: "Total developed length of horizontal drainage in feet",
          default: 100,
        },
        direction_changes: {
          type: "number",
          description: "Number of direction changes >45 degrees",
          default: 0,
        },
        stories: {
          type: "number",
          description: "Number of stories",
          default: 1,
        },
        code: {
          type: "string",
          enum: ["ipc-2021", "upc-2021"],
          default: "ipc-2021",
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["total_fu"],
    },
    examples: [
      {
        description: "Small commercial building",
        layer1: { total_fu: 45 },
        layer2: {
          total_fu: 45,
          building_drain_size: "4",
          total_run_ft: 120,
          direction_changes: 3,
          stories: 2,
          code: "upc-2021",
          include_advanced: true,
        },
      },
    ],
  },

  permit_navigator: {
    id: "permit_navigator",
    name: "Permit Finder",
    tagline: "Find permit requirements, fees, and document checklists",
    description:
      "Given a project description, identifies required permits, estimates fees, " +
      "lists required documents, and shows inspection milestones.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Navigate permits by describing the work.",
      properties: {
        description: {
          type: "string",
          description: "What work is planned: 'bathroom remodel', 'water heater replacement', 'new gas line', etc.",
          examples: ["bathroom remodel", "water heater replacement", "new construction plumbing"],
        },
      },
      required: ["description"],
    },
    layer2: {
      type: "object",
      description: "Detailed permit navigation with project value and occupancy.",
      properties: {
        description: { type: "string", description: "Project description" },
        project_value: {
          type: "number",
          description: "Estimated project value in dollars (affects fee tiers)",
        },
        occupancy: {
          type: "string",
          description: "Occupancy type",
          enum: ["residential", "commercial"],
          default: "residential",
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["description"],
    },
    examples: [
      {
        description: "Bathroom remodel permit",
        layer1: { description: "bathroom remodel" },
        layer2: { description: "full bathroom remodel with new fixtures", project_value: 15000, occupancy: "residential" },
      },
    ],
  },

  ada_compliance: {
    id: "ada_compliance",
    name: "Clearance Check",
    tagline: "Check ADA clearance compliance for plumbing fixtures",
    description:
      "Takes field measurements of plumbing fixture clearances and checks them " +
      "against ADA accessibility requirements. Reports pass/fail per measurement " +
      "with specific remediation guidance.",
    codes: [],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Check ADA compliance. Send measurements as a map of dimension name to value in inches.",
      properties: {
        measurements: {
          type: "object",
          description: "Map of measurement ID to measured value in inches. Keys like: wc_centerline, seat_height, grab_bar_height, clear_floor_space, etc.",
        },
      },
      required: ["measurements"],
    },
    layer2: {
      type: "object",
      description: "Full ADA check with category filtering.",
      properties: {
        measurements: {
          type: "object",
          description: "Measurement ID to value in inches",
        },
        categories: {
          type: "array",
          description: "Specific ADA categories to check (e.g., 'water_closet', 'lavatory', 'shower')",
          items: { type: "string" },
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["measurements"],
    },
    examples: [
      {
        description: "Water closet clearance check",
        layer1: {
          measurements: { wc_centerline: 17, seat_height: 18, clear_floor_space: 32 },
        },
        layer2: {
          measurements: { wc_centerline: 17, seat_height: 18, clear_floor_space: 32, grab_bar_length: 36 },
          categories: ["water_closet"],
          include_advanced: true,
        },
      },
    ],
  },

  material_spec: {
    id: "material_spec",
    name: "Material Match",
    tagline: "Check material compatibility and find transition fittings",
    description:
      "Given two pipe materials, checks direct compatibility and identifies " +
      "the correct transition fitting. Reports whether the join is code-acceptable.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Check if two materials are compatible.",
      properties: {
        material_a: {
          type: "string",
          description: "First material: copper, pvc, pex, cpvc, galvanized, cast_iron, abs, brass, bronze, stainless, polyethylene",
          examples: ["copper", "pvc", "pex"],
        },
        material_b: {
          type: "string",
          description: "Second material (same options as material_a)",
          examples: ["pex", "copper", "pvc"],
        },
      },
      required: ["material_a", "material_b"],
    },
    layer2: {
      type: "object",
      description: "Full material compatibility with pipe size and joint count.",
      properties: {
        material_a: { type: "string", description: "First material" },
        material_b: { type: "string", description: "Second material" },
        pipe_size: {
          type: "string",
          description: "Nominal pipe size for fitting selection",
        },
        joint_count: {
          type: "number",
          description: "Number of transition joints needed (for cost estimation)",
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["material_a", "material_b"],
    },
    examples: [
      {
        description: "Copper to PEX transition",
        layer1: { material_a: "copper", material_b: "pex" },
        layer2: { material_a: "copper", material_b: "pex", pipe_size: "3/4", joint_count: 4 },
      },
    ],
  },

  backflow_test: {
    id: "backflow_test",
    name: "Backflow Log",
    tagline: "Select backflow assemblies and get test criteria",
    description:
      "Given an application description (irrigation, medical, fire suppression, etc.), " +
      "selects the appropriate backflow prevention assembly, provides test criteria, " +
      "and estimates cost.",
    codes: ["ipc-2021", "upc-2021"],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Select a backflow assembly by describing the application.",
      properties: {
        application: {
          type: "string",
          description: "What the backflow preventer is for: 'irrigation', 'medical dental', 'fire suppression', 'boiler feed', etc.",
          examples: ["irrigation system", "medical dental unit", "fire suppression"],
        },
      },
      required: ["application"],
    },
    layer2: {
      type: "object",
      description: "Detailed backflow assembly selection with hazard degree and pipe size.",
      properties: {
        application: { type: "string", description: "Application description" },
        hazard_degree: {
          type: "string",
          description: "Override hazard classification",
          enum: ["low", "medium", "high"],
        },
        pipe_size: {
          type: "string",
          description: "Nominal pipe size",
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: ["application"],
    },
    examples: [
      {
        description: "Irrigation backflow prevention",
        layer1: { application: "irrigation system" },
        layer2: { application: "irrigation system for commercial property", hazard_degree: "high", pipe_size: "2" },
      },
    ],
  },

  bid_generator: {
    id: "bid_generator",
    name: "Bid Writer",
    tagline: "Generate bid estimates with materials, labor, and overhead",
    description:
      "Takes material quantities and labor tasks, looks up pricing from the " +
      "built-in catalog, and generates a complete bid with materials subtotal, " +
      "labor subtotal, overhead, and grand total.",
    codes: [],
    actions: ["compute"],
    layer1: {
      type: "object",
      description: "Generate a bid. Send material quantities or tasks (or both).",
      properties: {
        material_quantities: {
          type: "object",
          description: "Map of material item name to quantity. Items like: '3/4 copper pipe', '1/2 PEX tubing', 'water closet', etc.",
        },
        tasks: {
          type: "array",
          description: "Labor task IDs like: 'install_water_heater', 'rough_in_bathroom', 'replace_main_line'",
          items: { type: "string" },
        },
      },
      required: [],
    },
    layer2: {
      type: "object",
      description: "Full bid generation with project type, labor rate, and overhead.",
      properties: {
        material_quantities: {
          type: "object",
          description: "Material item to quantity map",
        },
        tasks: {
          type: "array",
          description: "Labor task IDs",
          items: { type: "string" },
        },
        project_type: {
          type: "string",
          description: "Project category (affects overhead multiplier)",
          enum: ["new_construction", "remodel", "repair", "emergency"],
          default: "remodel",
        },
        labor_rate: {
          type: "number",
          description: "Override labor rate in $/hour",
        },
        overhead_pct: {
          type: "number",
          description: "Override overhead percentage",
        },
        permit_fees: {
          type: "number",
          description: "Permit fees to include in bid",
        },
        sensor_sources: { type: "array", items: { type: "string" } },
        confidence_threshold: { type: "number", minimum: 0, maximum: 1 },
        include_advanced: { type: "boolean", default: false },
        diagnostic_dump: { type: "boolean", default: false },
      },
      required: [],
    },
    examples: [
      {
        description: "Simple water heater replacement bid",
        layer1: {
          material_quantities: { "50gal gas water heater": 1, "3/4 gas connector": 1, "3/4 ball valve": 2 },
          tasks: ["install_water_heater"],
        },
        layer2: {
          material_quantities: { "50gal gas water heater": 1, "3/4 gas connector": 1, "3/4 ball valve": 2 },
          tasks: ["install_water_heater"],
          project_type: "repair",
          labor_rate: 85,
          overhead_pct: 15,
          permit_fees: 75,
          include_advanced: true,
        },
      },
    ],
  },
};

/** All tool IDs in registry order */
export const TOOL_IDS = Object.keys(TOOLS) as ToolId[];

/** Get a single tool definition by ID */
export function getTool(id: string): ToolDefinition | undefined {
  return TOOLS[id as ToolId];
}

/** Layer index — which fields are Layer 1 only vs Layer 2 */
export function getLayer1Schema(id: ToolId): JsonSchema {
  return TOOLS[id].layer1;
}

export function getLayer2Schema(id: ToolId): JsonSchema {
  return TOOLS[id].layer2;
}

/**
 * Validate that every Layer 1 schema has 3 or fewer required fields (FLUM §3.2).
 * Returns violations, if any.
 */
export function validateLayer1Compliance(): { tool: ToolId; requiredCount: number }[] {
  const violations: { tool: ToolId; requiredCount: number }[] = [];
  for (const id of TOOL_IDS) {
    const count = TOOLS[id].layer1.required.length;
    if (count > 3) {
      violations.push({ tool: id, requiredCount: count });
    }
  }
  return violations;
}
