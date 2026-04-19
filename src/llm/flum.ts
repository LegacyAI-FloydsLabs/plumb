/**
 * FLUM Standard 000 — LLM-First Interface Layer
 *
 * Every tool in the PSI Field Suite follows the Floyd's Labs Unified Methodology:
 * - One Door In: single entry point per tool, action is a parameter
 * - Floor-Level Simplicity: 3 or fewer required fields
 * - Self-Documenting Responses: status, result, hint, actions_available
 * - Plain Language: no jargon, no hex codes
 * - Error Messages are Instructions: what went wrong + how to fix + next steps
 *
 * This module provides the deterministic calculation engine. No external LLM API
 * is required — the "LLM-First" pattern means the interface is designed so that
 * a 3B-parameter model can operate it with 100% reliability. The calculations
 * themselves are pure functions with known correct outputs.
 */

// ---------------------------------------------------------------------------
// FLUM Response Schema (Standard 000 §5)
// ---------------------------------------------------------------------------

export type FlumStatus = "success" | "failure" | "pending";

/** A single intermediate calculation step for diagnostic tracing (FLUM §3.8). */
export interface DiagnosticStep {
  /** Step name, e.g. "input_validation", "slope_computation", "code_lookup". */
  step: string;
  /** What this step did, in plain language. */
  description: string;
  /** Input to this step. */
  input?: unknown;
  /** Output from this step. */
  duration_ms?: number;
}

export interface FlumResponse<T = unknown> {
  /** Whether the operation succeeded, failed, or is pending async result. */
  status: FlumStatus;

  /** Human-readable result text. No raw hex/binary/codes. */
  result: string;

  /** One-sentence instruction for the caller's next step. */
  hint: string;

  /** Array of valid next actions the caller can take. */
  actions_available: string[];

  /** Optional nudge when the caller could be more efficient. */
  tip?: string;

  /** Structured data payload. */
  data?: T;

  /** Trace and latency metadata. Only populated with include_advanced. */
  metadata?: {
    trace_id: string;
    latency_ms: number;
    confidence: number; // 0-1, how confident the engine is
    tier_tested: 1 | 2 | 3; // Which intelligence tier this was validated for
    sensor_sources?: string[]; // Which sensors provided data
    requires_human_confirmation?: boolean; // True if confidence < 0.95
  };

  /** Intermediate calculation steps. Only populated with diagnostic_dump (§3.8). */
  diagnostics?: DiagnosticStep[];
}

// ---------------------------------------------------------------------------
// FLUM Error Construction (Standard 000 §3.7)
// ---------------------------------------------------------------------------

export function flumError(
  what: string,
  howToFix: string,
  nextSteps: string[],
): FlumResponse<never> {
  return {
    status: "failure",
    result: what,
    hint: howToFix,
    actions_available: nextSteps,
  };
}

// ---------------------------------------------------------------------------
// FLUM Success Construction
// ---------------------------------------------------------------------------

export function flumSuccess<T>(
  resultText: string,
  hint: string,
  data: T,
  options?: {
    actions_available?: string[];
    tip?: string;
    confidence?: number;
    sensor_sources?: string[];
    requires_human_confirmation?: boolean;
  },
): FlumResponse<T> {
  return {
    status: "success",
    result: resultText,
    hint,
    actions_available: options?.actions_available ?? [],
    tip: options?.tip,
    data,
    metadata: {
      trace_id: `psi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      latency_ms: 0, // filled by caller if timing
      confidence: options?.confidence ?? 1,
      tier_tested: 1,
      sensor_sources: options?.sensor_sources ?? [],
      requires_human_confirmation: options?.requires_human_confirmation ?? false,
    },
  };
}

// ---------------------------------------------------------------------------
// FLUM Pending Response (Standard 000 §3.5 — async operations)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Natural Language Intent Parser (Standard 000 §3.2 — Floor-Level Simplicity)
// ---------------------------------------------------------------------------

export type ToolId =
  | "slope"
  | "pipe_sizer"
  | "fixture_counter"
  | "code_compliance"
  | "hydraulic_analyzer"
  | "drainage_designer"
  | "permit_navigator"
  | "ada_compliance"
  | "material_spec"
  | "backflow_test"
  | "bid_generator";

export interface ParsedIntent {
  tool: ToolId;
  action: string;
  params: Record<string, unknown>;
  confidence: number;
  rawInput: string;
}

/** Keyword mappings for natural language routing */
const TOOL_KEYWORDS: Record<ToolId, string[]> = {
  slope: ["slope", "grade", "lateral", "sonde", "survey", "belly", "invert"],
  pipe_sizer: ["pipe", "size", "diameter", "drain", "supply", "vent", "sizing"],
  fixture_counter: ["fixture", "unit", "dfu", "wsfu", "bathroom", "count", "load"],
  code_compliance: ["code", "compliance", "violation", "inspection", "ipc", "upc", "checklist"],
  hydraulic_analyzer: ["pressure", "flow", "head", "loss", "friction", "darcy", "recirculation", "water hammer", "surge"],
  drainage_designer: ["drainage", "drain", "stack", "waste", "sewer", "grease", "trap", "cleanout"],
  permit_navigator: ["permit", "fee", "license", "application", "jurisdiction"],
  ada_compliance: ["ada", "accessibility", "clearance", "accessible", "barrier", "grab bar"],
  material_spec: ["material", "compatibility", "copper", "pvc", "pex", "fitting", "transition", "bom", "takeoff"],
  backflow_test: ["backflow", "rpz", "pvb", "dcva", "prevention", "assembly", "test"],
  bid_generator: ["bid", "estimate", "quote", "cost", "price", "proposal", "takeoff"],
};

export function parseIntent(input: string): ParsedIntent {
  const normalized = input.toLowerCase().trim();

  let bestTool: ToolId = "slope";
  let bestScore = 0;

  for (const [tool, keywords] of Object.entries(TOOL_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (normalized.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTool = tool as ToolId;
    }
  }

  // If no keywords matched, default to slope calculator
  const confidence = bestScore > 0 ? Math.min(bestScore / 3, 1) : 0.3;

  return {
    tool: bestTool,
    action: "compute",
    params: {},
    confidence,
    rawInput: input,
  };
}

// ---------------------------------------------------------------------------
// FLUM Orchestration — One Door In (Standard 000 §3.1)
// ---------------------------------------------------------------------------

export interface FlumComputeRequest {
  /** Which tool to route to. */
  tool: ToolId;
  /** The action to perform within that tool. */
  action: string;
  /** Parameters for the action. Max 3 required fields (§3.2). */
  params: Record<string, unknown>;
  /** Include advanced metadata in response (§3.3). */
  include_advanced?: boolean;
  /** Include intermediate calculation steps in response (FLUM §3.8). */
  diagnostic_dump?: boolean;
}

/**
 * One Door In — the single entry point for all PSI tool computations.
 *
 * Route logic is a server-side responsibility. The caller provides
 * the tool and action; this function dispatches to the correct
 * pure calculation function and returns a FLUM-compliant response.
 */
export async function compute(request: FlumComputeRequest): Promise<FlumResponse> {
  const startTime = Date.now();

  // Enrich params with sensor data if requested
  const sensorSources: SensorSource[] = (request.params.sensor_sources as SensorSource[]) ?? ["manual_entry"];
  const sensorConfidence = sensorSources.includes("manual_entry") ? 1 : 0.95;

  try {
    // Route to the correct tool's compute function
    let response: FlumResponse;

    switch (request.tool) {
      case "slope":
        response = await computeSlope(request);
        break;
      case "pipe_sizer":
        response = await handlePipeSizer(request);
        break;
      case "fixture_counter":
        response = await handleFixtureCounter(request);
        break;
      case "code_compliance":
        response = await handleCodeCompliance(request);
        break;
      case "hydraulic_analyzer":
        response = await handleHydraulicAnalyzer(request);
        break;
      case "drainage_designer":
        response = await handleDrainageDesigner(request);
        break;
      case "permit_navigator":
        response = await handlePermitNavigator(request);
        break;
      case "ada_compliance":
        response = await handleAdaCompliance(request);
        break;
      case "material_spec":
        response = await handleMaterialSpec(request);
        break;
      case "backflow_test":
        response = await handleBackflowTest(request);
        break;
      case "bid_generator":
        response = await handleBidGenerator(request);
        break;
      default:
        response = flumError(
          `Unknown tool: ${request.tool}`,
          "Available tools: slope, pipe_sizer, fixture_counter, code_compliance, hydraulic_analyzer, drainage_designer, permit_navigator, ada_compliance, material_spec, backflow_test, bid_generator.",
          ["slope", "pipe_sizer", "fixture_counter"],
        );
    }

    // ── Post-processing: metadata and diagnostics ──────────────────

    const elapsed = Date.now() - startTime;

    // FLUM §3.3: metadata only when include_advanced is requested
    if (request.include_advanced && response.metadata) {
      response.metadata.latency_ms = elapsed;
      response.metadata.sensor_sources = sensorSources;
      response.metadata.confidence = Math.min(
        response.metadata.confidence,
        sensorConfidence,
      );
      response.metadata.requires_human_confirmation = response.metadata.confidence < 0.95;
    } else if (!request.include_advanced) {
      // Strip metadata when not requested (§3.3)
      delete response.metadata;
    }

    // FLUM §3.8: diagnostic trace when diagnostic_dump is requested
    if (request.diagnostic_dump) {
      response.diagnostics = [
        {
          step: "input_validation",
          description: `Parsed request for tool '${request.tool}', action '${request.action}'`,
          input: { tool: request.tool, action: request.action, param_keys: Object.keys(request.params) },
          duration_ms: 0,
        },
        {
          step: "computation",
          description: `Executed '${request.tool}' engine`,
          input: request.params,
          duration_ms: elapsed,
        },
        {
          step: "response_formatting",
          description: "Wrapped result in FLUM envelope with hint and actions",
          duration_ms: 0,
        },
      ];
    }

    return response;

    return response;
  } catch (error) {
    return flumError(
      `Computation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "Check your input values and try again. If the problem persists, use manual entry mode.",
      ["slope", "pipe_sizer", "fixture_counter"],
    );
  }
}

// ---------------------------------------------------------------------------
// Tool Compute Functions
// ---------------------------------------------------------------------------

import { computeSurvey, classifySlope, validate } from "../slope/calc";
import type { Survey, Units } from "../slope/types";
import { computePipeSizer } from "../tools/pipe-sizer/calc";
import type { PipeSizerInput } from "../tools/pipe-sizer/calc";
import { countFixtures, FIXTURES as FIXTURE_DB } from "../tools/fixture-counter/calc";
import { lookupCode } from "../tools/code-compliance/calc";
import { analyzeHydraulics } from "../tools/hydraulic-analyzer/calc";
import type { HydraulicInput } from "../tools/hydraulic-analyzer/calc";
import { designDrainage } from "../tools/drainage-designer/calc";
import type { DrainageInput } from "../tools/drainage-designer/calc";
import { navigatePermit } from "../tools/permit-navigator/calc";
import { checkAdaCompliance } from "../tools/ada-compliance/calc";
import { checkMaterial } from "../tools/material-spec/calc";
import { selectBackflowAssembly } from "../tools/backflow-test/calc";
import { generateBid, MATERIAL_CATALOG, TASK_TIMES } from "../tools/bid-generator/calc";
import { type SensorSource } from "../sensors";

async function computeSlope(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { action, params } = request;

  if (action === "compute" || action === "survey") {
    const stations = params.stations as
      | { label: number; distance: number; rodReading: number; depth: number }[]
      | undefined;

    if (!stations || stations.length < 2) {
      return flumError(
        "Need at least 2 stations to compute slope.",
        "Provide stations as an array with label, distance, rodReading, and depth for each measurement point.",
        ["compute"],
      );
    }

    const units = (params.units as Units) || "imperial";
    const jobId = (params.jobId as string) || "FLLM";

    const survey: Survey = {
      units,
      jobId,
      completedAt: new Date().toISOString(),
      stations: stations.map((s, i) => ({
        id: `s${i + 1}`,
        label: s.label ?? i + 1,
        distance: s.distance,
        rodReading: s.rodReading,
        depth: s.depth,
      })),
    };

    const issues = validate(survey);
    if (issues.length > 0) {
      return flumError(
        `Survey validation failed: ${issues.join("; ")}`,
        "Fix the listed issues and resubmit.",
        ["compute"],
      );
    }

    const result = computeSurvey(survey, {
      pipeDiameterIn: (params.pipeDiameterIn as 4 | 6) || 4,
    });

    const verdictText =
      result.verdict.kind === "code_compliant"
        ? `CODE COMPLIANT at ${result.overallSlopePct.toFixed(3)}% (${result.overallSlopeInPerFt.toFixed(4)} in/ft). Minimum required: ${result.verdict.minPct}%`
        : result.verdict.kind === "marginal"
          ? `MARGINAL at ${result.overallSlopePct.toFixed(3)}% (${result.overallSlopeInPerFt.toFixed(4)} in/ft). Minimum required: ${result.verdict.minPct}%. Below minimum but above 50% threshold.`
          : result.verdict.kind === "below_minimum"
            ? `BELOW MINIMUM at ${result.overallSlopePct.toFixed(3)}% (${result.overallSlopeInPerFt.toFixed(4)} in/ft). Minimum required: ${result.verdict.minPct}%.`
            : `INDETERMINATE: ${result.verdict.reason}`;

    return flumSuccess(
      verdictText,
      result.bellyCount > 0
        ? `${result.bellyCount} belly segment(s) detected over ${result.bellyRunTotal.toFixed(1)} ft of run. Review the profile to confirm camera footage.`
        : "No bellies detected. The lateral slope appears uniform.",
      result,
      {
        actions_available: [
          "export_json",
          "add_station",
          "view_profile",
          "switch_units",
        ],
        tip: "Use 'export_json' to save this survey for your PSI report.",
        confidence: 1, // deterministic calculation
        sensor_sources: params.sensor_sources
          ? (params.sensor_sources as string[])
          : ["manual_entry"],
      },
    );
  }

  if (action === "classify") {
    const pct = params.pct as number | undefined;
    if (pct === undefined) {
      return flumError(
        "Need a slope percentage to classify.",
        "Provide the 'pct' parameter (e.g., 2.083 for 1/4 inch per foot).",
        ["classify"],
      );
    }
    const dia = (params.pipeDiameterIn as 4 | 6) || 4;
    const verdict = classifySlope(pct, { pipeDiameterIn: dia });
    const minPct = "minPct" in verdict ? verdict.minPct : "N/A";
    return flumSuccess(
      `Slope of ${pct}% is classified as: ${verdict.kind} (minimum: ${minPct}%)`,
      verdict.kind === "code_compliant"
        ? "This slope meets code requirements."
        : "Consider re-lining or point repair if the slope is below minimum.",
      verdict,
      { actions_available: ["compute", "classify"] },
    );
  }

  return flumError(
    `Unknown action: ${action}`,
    "Available actions for slope are: 'compute', 'classify'.",
    ["compute", "classify"],
  );
}

async function handlePipeSizer(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { action, params } = request;

  if (action !== "compute" && action !== "size") {
    return flumError(
      `Unknown action: ${action}`,
      "Available actions for pipe_sizer are: 'compute', 'size'.",
      ["compute", "size"],
    );
  }

  const wsfu = params.wsfu as number | undefined;
  const dfu = params.dfu as number | undefined;

  if (wsfu === undefined || dfu === undefined) {
    return flumError(
      "Need at least WSFU (water supply fixture units) and DFU (drainage fixture units) to size pipes.",
      "Provide 'wsfu' and 'dfu' parameters. Example: { wsfu: 12, dfu: 6, longest_run_ft: 60, elevation_rise_ft: 10, code: 'ipc-2021', stories: 2 }",
      ["compute"],
    );
  }

  const input: PipeSizerInput = {
    wsfu,
    dfu,
    vent_fu: params.vent_fu as number | undefined,
    longest_run_ft: (params.longest_run_ft as number) || 60,
    elevation_rise_ft: (params.elevation_rise_ft as number) || 0,
    code: (params.code as "ipc-2021" | "upc-2021") || "ipc-2021",
    stories: (params.stories as number) || 1,
    available_pressure_psi: params.available_pressure_psi as number | undefined,
  };

  const result = computePipeSizer(input);

  const pressureText = result.pressure_ok
    ? `Residual pressure ${result.residual_pressure_psi} psi — OK (min 20 psi)`
    : `Residual pressure ${result.residual_pressure_psi} psi — BELOW 20 psi minimum`;

  return flumSuccess(
    `Pipe sizing: Water service ${result.water_service_size}", Main supply ${result.main_supply_size}", Drain ${result.main_drain_size}", Vent ${result.vent_size}". ${pressureText}.`,
    result.warnings.length > 0
      ? result.warnings.join(" | ")
      : "All sizes meet code requirements.",
    result,
    {
      actions_available: ["compute", "classify", "export_json"],
      tip: `Code sections: ${result.code_sections.join(", ")}`,
      confidence: result.confidence,
    },
  );
}

async function handleFixtureCounter(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { action, params } = request;
  if (action !== "compute" && action !== "count") {
    return flumError(`Unknown action: ${action}`, "Available actions: 'compute', 'count'.", ["compute"]);
  }

  const fixtures = (params.fixtures ?? {}) as Record<string, number>;
  const bathroomGroups = (params.bathroom_groups as number) ?? 0;
  const occupancy = (params.occupancy as "private" | "public") ?? "private";
  const code = (params.code as "ipc-2021" | "upc-2021") ?? "ipc-2021";

  if (Object.keys(fixtures).length === 0 && bathroomGroups === 0) {
    const available = Object.keys(FIXTURE_DB).join(", ");
    return flumError(
      "No fixtures specified.",
      `Provide a 'fixtures' map of fixture key → count. Available fixtures: ${available}. Or set bathroom_groups for a standard group.`,
      ["compute"],
    );
  }

  const result = countFixtures({ fixtures, bathroom_groups: bathroomGroups, occupancy, code });
  return flumSuccess(
    `Total: ${result.total_dfu} DFU, ${result.total_wsfu} WSFU (${result.breakdown.length} line items, ${result.group_reduction > 0 ? `${result.group_reduction} DFU saved by bathroom groups` : "no group reduction"})`,
    result.warnings.length > 0 ? result.warnings.join(" | ") : "Fixture counts ready for pipe sizing.",
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.99 },
  );
}

async function handleCodeCompliance(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { action, params } = request;
  const query = (params.query as string) ?? (action !== "compute" ? action : "");
  if (!query) {
    return flumError("Need a code query.", "Provide a 'query' parameter like 'trap arm length' or 'vent sizing'.", ["compute"]);
  }

  const code = (params.code as "ipc-2021" | "upc-2021" | "both") ?? "both";
  const result = lookupCode({ query, code, category: params.category as string | undefined });

  if (result.total_matches === 0) {
    return flumError(
      `No code sections found for "${query}".`,
      result.warnings.join(" "),
      result.suggestions.slice(0, 5),
    );
  }

  const topResults = result.matches.slice(0, 3).map((s) => `${s.section}: ${s.requirement}`).join("\n");
  return flumSuccess(
    `Found ${result.total_matches} matching code section(s). Top result: ${result.matches[0].section} — ${result.matches[0].plain_language}`,
    topResults,
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.95 },
  );
}

async function handleHydraulicAnalyzer(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { params } = request;
  const flowGpm = params.flow_gpm as number | undefined;
  const pipeSize = params.pipe_size as string | undefined;
  if (!flowGpm || !pipeSize) {
    return flumError(
      "Need flow rate (GPM) and pipe size.",
      "Provide 'flow_gpm', 'pipe_size', 'material', 'length_ft', and 'static_pressure_psi'.",
      ["compute"],
    );
  }

  const input: HydraulicInput = {
    material: (params.material as string) ?? "copper",
    pipe_size: pipeSize,
    length_ft: (params.length_ft as number) ?? 50,
    flow_gpm: flowGpm,
    static_pressure_psi: (params.static_pressure_psi as number) ?? 55,
    elevation_rise_ft: (params.elevation_rise_ft as number) ?? 0,
    fittings_count: (params.fittings_count as number) ?? 0,
  };

  const result = analyzeHydraulics(input);
  const velocityNote = result.velocity_ok ? "OK" : "OUT OF RANGE";
  return flumSuccess(
    `${pipeSize}" ${input.material} at ${flowGpm} GPM: ${result.velocity_fps} ft/s (${velocityNote}), ${result.residual_pressure_psi} psi residual. Friction: ${result.total_friction_loss_psi} psi over ${input.length_ft} ft.`,
    result.warnings.length > 0 ? result.warnings.join(" | ") : "Hydraulic analysis complete.",
    result,
    {
      actions_available: ["compute", "export_json"],
      confidence: 0.97,
      tip: result.recommended_size ? `Consider upsizing to ${result.recommended_size}" pipe.` : undefined,
    },
  );
}

async function handleDrainageDesigner(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { params } = request;
  const totalFu = params.total_fu as number | undefined;
  if (!totalFu) {
    return flumError("Need total fixture units.", "Provide 'total_fu', 'building_drain_size', 'total_run_ft', 'stories', and 'code'.", ["compute"]);
  }

  const input: DrainageInput = {
    total_fu: totalFu,
    building_drain_size: (params.building_drain_size as string) ?? "4",
    total_run_ft: (params.total_run_ft as number) ?? 100,
    direction_changes: (params.direction_changes as number) ?? 0,
    stories: (params.stories as number) ?? 1,
    code: (params.code as "ipc-2021" | "upc-2021") ?? "ipc-2021",
  };

  const result = designDrainage(input);
  return flumSuccess(
    `Stack: ${result.stack_size}", ${result.cleanout_count} cleanouts (every ${result.cleanout_spacing_ft} ft). Building drain ${input.building_drain_size}" ${result.drain_ok ? "✅ adequate" : "❌ undersized"}.`,
    result.warnings.length > 0 ? result.warnings.join(" | ") : "Drainage design complete.",
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.95 },
  );
}

async function handlePermitNavigator(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { params } = request;
  const description = (params.description as string) ?? (params.query as string) ?? "";
  if (!description) {
    return flumError("Need a project description.", "Describe the work: 'bathroom remodel', 'water heater replacement', 'new gas line', etc.", ["compute"]);
  }

  const result = navigatePermit({
    description,
    project_value: params.project_value as number | undefined,
    occupancy: (params.occupancy as "residential" | "commercial") ?? "residential",
  });

  const topPermit = result.permits[0];
  return flumSuccess(
    `Recommended permit: ${topPermit.name}. Estimated fees: $${result.estimated_fees.low}–$${result.estimated_fees.high}. ${result.required_documents.length} documents required, ${result.inspections.length} inspections.`,
    result.notes.join(" | "),
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.85 },
  );
}

async function handleAdaCompliance(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { params } = request;
  const measurements = (params.measurements ?? {}) as Record<string, number>;
  if (Object.keys(measurements).length === 0) {
    return flumError("Need measurements.", "Provide a 'measurements' map of requirement ID → measured value. Example: { wc_centerline: 17, seat_height: 18 }", ["compute"]);
  }

  const result = checkAdaCompliance({
    measurements,
    categories: params.categories as string[] | undefined,
  });

  return flumSuccess(
    `ADA compliance: ${result.passed}/${result.total} checks passed (${result.compliance_pct}%). ${result.failed > 0 ? `${result.failed} failures in: ${result.failed_categories.join(", ")}` : "All checks passed!"}`,
    result.failed > 0 ? "See individual check guidance for remediation steps." : "Fully compliant.",
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.99 },
  );
}

async function handleMaterialSpec(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { params } = request;
  const materialA = params.material_a as string | undefined;
  const materialB = params.material_b as string | undefined;
  if (!materialA || !materialB) {
    return flumError("Need two materials to check.", "Provide 'material_a' and 'material_b'. Example: { material_a: 'copper', material_b: 'pex' }", ["compute"]);
  }

  const result = checkMaterial({
    material_a: materialA as import("../tools/material-spec/calc").MaterialId,
    material_b: materialB as import("../tools/material-spec/calc").MaterialId,
    pipe_size: params.pipe_size as string | undefined,
    joint_count: params.joint_count as number | undefined,
  });

  return flumSuccess(
    `${materialA} → ${materialB}: ${result.compatibility.compatible ? "✅ Compatible" : "❌ Not directly compatible"}. Transition: ${result.compatibility.transition}`,
    result.compatibility.notes,
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.97 },
  );
}

async function handleBackflowTest(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { params } = request;
  const application = (params.application as string) ?? (params.query as string) ?? "";
  if (!application) {
    return flumError("Need an application description.", "Describe the application: 'irrigation system', 'medical dental', 'fire suppression', etc.", ["compute"]);
  }

  const result = selectBackflowAssembly({
    application,
    hazard_degree: params.hazard_degree as "low" | "medium" | "high" | undefined,
    pipe_size: params.pipe_size as string | undefined,
  });

  return flumSuccess(
    `Recommended: ${result.recommended.name} (${result.recommended.abbreviation}) for ${result.recommended.degree_of_hazard} hazard. ${result.recommended.pass_criteria.length} test checks required. Est. cost: $${result.recommended.estimated_cost.low}–$${result.recommended.estimated_cost.high}.`,
    result.installation_notes.join(" | "),
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.95 },
  );
}

async function handleBidGenerator(
  request: FlumComputeRequest,
): Promise<FlumResponse> {
  const { params } = request;
  const materialQuantities = (params.material_quantities ?? {}) as Record<string, number>;
  const tasks = (params.tasks ?? []) as string[];

  if (Object.keys(materialQuantities).length === 0 && tasks.length === 0) {
    const catalogSample = MATERIAL_CATALOG.slice(0, 5).map((m) => m.item).join(", ");
    const taskSample = Object.keys(TASK_TIMES).slice(0, 5).join(", ");
    return flumError(
      "Need material quantities and/or tasks.",
      `Provide 'material_quantities' (item name → qty) and 'tasks' (task IDs). Sample materials: ${catalogSample}. Sample tasks: ${taskSample}.`,
      ["compute"],
    );
  }

  const result = generateBid({
    project_type: (params.project_type as "new_construction" | "remodel" | "repair" | "emergency") ?? "remodel",
    material_quantities: materialQuantities,
    tasks,
    labor_rate_override: params.labor_rate as number | undefined,
    overhead_pct: params.overhead_pct as number | undefined,
    permit_fees: params.permit_fees as number | undefined,
  });

  return flumSuccess(
    `Bid total: $${result.grand_total.toFixed(2)} (Materials: $${result.material_subtotal.toFixed(2)}, Labor: $${result.labor_subtotal.toFixed(2)}, Overhead: $${result.overhead_amount.toFixed(2)}). ${result.materials.length} material line items, ${result.labor.length} labor tasks.`,
    result.warnings.length > 0 ? result.warnings.join(" | ") : "Bid generated successfully.",
    result,
    { actions_available: ["compute", "export_json"], confidence: 0.90 },
  );
}