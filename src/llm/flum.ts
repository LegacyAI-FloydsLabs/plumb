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

export function flumPending(
  resultText: string,
  hint: string,
  waitHandle: string,
): FlumResponse<{ wait_handle: string }> {
  return {
    status: "pending",
    result: resultText,
    hint,
    actions_available: ["check_status"],
    data: { wait_handle: waitHandle },
  };
}

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

  try {
    // Route to the correct tool's compute function
    let response: FlumResponse;

    switch (request.tool) {
      case "slope":
        response = await computeSlope(request);
        break;
      case "pipe_sizer":
        response = await computePipeSizer(request);
        break;
      case "fixture_counter":
        response = await computeFixtureCounter(request);
        break;
      case "code_compliance":
        response = await computeCodeCompliance(request);
        break;
      case "hydraulic_analyzer":
        response = flumError(
          "Hydraulic analyzer is not yet available.",
          "Try the pipe sizer for basic sizing, or use the slope calculator for lateral surveys.",
          ["pipe_sizer", "slope"],
        );
        break;
      case "drainage_designer":
        response = flumError(
          "Drainage designer is not yet available.",
          "Try the pipe sizer for drain sizing, or the fixture counter for load calculations.",
          ["pipe_sizer", "fixture_counter"],
        );
        break;
      case "permit_navigator":
        response = flumError(
          "Permit navigator is not yet available.",
          "Try the code compliance engine for code requirements.",
          ["code_compliance"],
        );
        break;
      case "ada_compliance":
        response = flumError(
          "ADA compliance scanner is not yet available.",
          "Try the code compliance engine for general code checks.",
          ["code_compliance"],
        );
        break;
      case "material_spec":
        response = flumError(
          "Material specification engine is not yet available.",
          "Try the pipe sizer for material-compatible sizing.",
          ["pipe_sizer"],
        );
        break;
      case "backflow_test":
        response = flumError(
          "Backflow and test logger is not yet available.",
          "Try the code compliance engine for backflow prevention requirements.",
          ["code_compliance"],
        );
        break;
      case "bid_generator":
        response = flumError(
          "Bid generator is not yet available.",
          "Use individual tools to compute values for your bid.",
          ["slope", "pipe_sizer", "fixture_counter"],
        );
        break;
      default:
        response = flumError(
          `Unknown tool: ${request.tool}`,
          "Available tools are: slope, pipe_sizer, fixture_counter, code_compliance.",
          ["slope", "pipe_sizer", "fixture_counter", "code_compliance"],
        );
    }

    // Fill in latency
    if (response.metadata) {
      response.metadata.latency_ms = Date.now() - startTime;
    }

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

// Placeholder imports for tools not yet implemented
async function computePipeSizer(
  _request: FlumComputeRequest,
): Promise<FlumResponse> {
  // Will be implemented when PipeSizerPage is built
  return flumError(
    "Pipe sizer computation is not yet implemented.",
    "The pipe sizer page is available for manual use.",
    ["slope"],
  );
}

async function computeFixtureCounter(
  _request: FlumComputeRequest,
): Promise<FlumResponse> {
  // Will be implemented when FixtureCounterPage is built
  return flumError(
    "Fixture counter computation is not yet implemented.",
    "The fixture counter page is available for manual use.",
    ["slope"],
  );
}

async function computeCodeCompliance(
  _request: FlumComputeRequest,
): Promise<FlumResponse> {
  // Will be implemented when CodeCompliancePage is built
  return flumError(
    "Code compliance computation is not yet implemented.",
    "The code compliance page is available for manual use.",
    ["slope"],
  );
}