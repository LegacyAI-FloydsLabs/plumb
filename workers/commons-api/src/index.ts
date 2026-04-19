/*
 * Plumb Trade Commons API Worker
 * Copyright (C) 2026 Legacy AI LLC and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Free, rate-limited, zero-auth HTTP API for the Plumb calculation engines.
 * Deployed on Cloudflare Workers or Vercel Edge Functions.
 *
 * Rate limit: 60 req/min per IP. No request-body persistence. No logs of call content.
 */

import { computeSurvey } from "../../../src/slope/calc";
import { computePipeSizer } from "../../../src/tools/pipe-sizer/calc";
import { countFixtures } from "../../../src/tools/fixture-counter/calc";
import { lookupCode } from "../../../src/tools/code-compliance/calc";
import { analyzeHydraulics } from "../../../src/tools/hydraulic-analyzer/calc";
import { designDrainage } from "../../../src/tools/drainage-designer/calc";
import { navigatePermit } from "../../../src/tools/permit-navigator/calc";
import { checkAdaCompliance } from "../../../src/tools/ada-compliance/calc";
import { checkMaterial } from "../../../src/tools/material-spec/calc";
import { selectBackflowAssembly } from "../../../src/tools/backflow-test/calc";
import { generateBid } from "../../../src/tools/bid-generator/calc";

// ── Rate limiting ───────────────────────────────────────────────────────────────
// Simple in-memory rate limiter keyed by IP.
// For multi-instance production: swap to Cloudflare KV or Redis.
const RATE_LIMIT = 60; // req/min
const WINDOW_MS = 60 * 1000;
const rateMap = new Map<string, { count: number; windowStart: number }>();

function checkRate(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: WINDOW_MS - (now - entry.windowStart) };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetIn: WINDOW_MS - (now - entry.windowStart) };
}

// ── FLUM envelope helpers ───────────────────────────────────────────────────────
type FlumEnvelope = {
  status: "success" | "failure" | "pending";
  result: string;
  hint: string;
  tip: string;
  actions_available: string[];
  metadata: Record<string, unknown>;
};

function success(result: string, hint = "", tip = "", actions: string[] = [], meta: Record<string, unknown> = {}): FlumEnvelope {
  return { status: "success", result, hint, tip, actions_available: actions, metadata: { confidence: 0.99, ...meta } };
}

function failure(message: string): FlumEnvelope {
  return {
    status: "failure",
    result: message,
    hint: "Check the inputs and try again.",
    tip: "",
    actions_available: [],
    metadata: { confidence: 0, requires_human_confirmation: true },
  };
}

// ── Tool handlers ──────────────────────────────────────────────────────────────

function handleSlope(body: Record<string, unknown>): FlumEnvelope {
  const stations = body["stations"] as { station: number; distance: number; invert: number }[] | undefined;
  const pipeDiameterIn = (body["pipe_diameter_in"] as number | undefined) ?? 4;
  if (!stations?.length) return failure("stations array is required");
  try {
    const result = computeSurvey(stations, pipeDiameterIn, "imperial");
    const hint = result.bellyDetected
      ? "Belly detected between station " + result.bellyStart + " and " + result.bellyEnd + "."
      : "Slope is compliant throughout the run.";
    return success(result.summary, hint, "", [], { bellyDetected: result.bellyDetected });
  } catch (e) {
    return failure(String(e));
  }
}

function handlePipeSizer(body: Record<string, unknown>): FlumEnvelope {
  const wsfu = body["wsfu"] as number | undefined;
  const dfu = body["dfu"] as number | undefined;
  const longestRunFt = body["longest_run_ft"] as number | undefined;
  const stories = body["stories"] as number | undefined;
  if (wsfu == null || dfu == null || !longestRunFt || !stories) {
    return failure("wsfu, dfu, longest_run_ft, and stories are required");
  }
  try {
    const r = computePipeSizer({
      wsfu,
      dfu,
      vent_fu: body["vent_fu"] as number | undefined,
      longest_run_ft: longestRunFt,
      elevation_rise_ft: (body["elevation_rise_ft"] as number | undefined) ?? 0,
      code: (body["code"] as "ipc-2021" | "upc-2021") ?? "ipc-2021",
      stories,
      available_pressure_psi: body["available_pressure_psi"] as number | undefined,
    });
    const result = "Water: " + r.water_service_size + '" pipe, Drain: ' + r.main_drain_size + '" pipe, Vent: ' + r.vent_size + '" pipe. Pressure: ' + r.residual_pressure_psi.toFixed(1) + " psi.";
    return success(result, r.warnings.join(" "), "", [], { pressure_ok: r.pressure_ok });
  } catch (e) {
    return failure(String(e));
  }
}

function handleFixtureCounter(body: Record<string, unknown>): FlumEnvelope {
  const fixtures = body["fixtures"] as { type: string; count: number }[] | undefined;
  if (!fixtures?.length) return failure("fixtures array is required");
  try {
    const r = countFixtures({
      fixtures,
      building_class: (body["building_class"] as "residential" | "commercial" | "industrial") ?? "residential",
    });
    return success("Total DFU: " + r.totalDFU + ", WSFU: " + r.totalWSFU + ".", r.reductionHint, "", [], {});
  } catch (e) {
    return failure(String(e));
  }
}

function handleCodeCompliance(body: Record<string, unknown>): FlumEnvelope {
  try {
    const r = lookupCode({
      jurisdiction: (body["jurisdiction"] as string) ?? "",
      section: (body["section"] as string) ?? "",
      query: (body["query"] as string) ?? "",
    });
    return success(r.answer, r.codeSection ? "IPC/UPC §" + r.codeSection : "", "", [], { applicableCode: r.applicableCode });
  } catch (e) {
    return failure(String(e));
  }
}

function handleHydraulicAnalyzer(body: Record<string, unknown>): FlumEnvelope {
  const diam = body["pipe_diameter_in"] as number | undefined;
  const lenFt = body["length_ft"] as number | undefined;
  const gpm = body["flow_rate_gpm"] as number | undefined;
  const psi = body["inlet_pressure_psi"] as number | undefined;
  if (!diam || !lenFt || !gpm || !psi) return failure("pipe_diameter_in, length_ft, flow_rate_gpm, and inlet_pressure_psi are required");
  try {
    const r = analyzeHydraulics({ pipe_diameter_in: diam, material: (body["material"] as string) ?? "copper", length_ft: lenFt, flow_rate_gpm: gpm, inlet_pressure_psi: psi });
    const result = "Pressure: " + r.outletPressure.toFixed(1) + " psi. Velocity: " + r.velocityFPS.toFixed(1) + " fps.";
    return success(result, r.surgeWarning ?? "", "", [], { pressure_ok: r.pressureOk });
  } catch (e) {
    return failure(String(e));
  }
}

function handleDrainageDesigner(body: Record<string, unknown>): FlumEnvelope {
  const floors = body["floors"] as number | undefined;
  const fpf = body["fixtures_per_floor"] as number | undefined;
  if (!floors || !fpf) return failure("floors and fixtures_per_floor are required");
  try {
    const r = designDrainage({ floors, fixtures_per_floor: fpf, building_class: (body["building_class"] as string) ?? "residential" });
    return success(r.summary, r.reliefVentWarning ?? "", "", [], { stackSize: r.stackSize });
  } catch (e) {
    return failure(String(e));
  }
}

function handlePermitNavigator(body: Record<string, unknown>): FlumEnvelope {
  try {
    const r = navigatePermit({
      project_type: (body["project_type"] as string) ?? "repair",
      jurisdiction: (body["jurisdiction"] as string) ?? "",
      scope: (body["scope"] as string) ?? "",
    });
    return success(r.permits.join(", "), r.feeNote ?? "", "", [], { permitTypes: r.permits });
  } catch (e) {
    return failure(String(e));
  }
}

function handleAdaCompliance(body: Record<string, unknown>): FlumEnvelope {
  const fixture = body["fixture_type"] as string | undefined;
  if (!fixture) return failure("fixture_type is required");
  try {
    const r = checkAdaCompliance({
      fixture_type: fixture,
      mounting_height_in: body["mounting_height_in"] as number | undefined,
      side_clearance_in: body["side_clearance_in"] as number | undefined,
    });
    const result = fixture + ": " + (r.compliant ? "ADA compliant." : "NOT compliant.");
    return success(result, r.gapNote ?? "", "", [], { compliant: r.compliant });
  } catch (e) {
    return failure(String(e));
  }
}

function handleMaterialSpec(body: Record<string, unknown>): FlumEnvelope {
  const from = body["from_material"] as string | undefined;
  const to = body["to_material"] as string | undefined;
  if (!from || !to) return failure("from_material and to_material are required");
  try {
    const r = checkMaterial({ from_material: from, to_material: to, application: (body["application"] as string) ?? "domestic_water" });
    const result = from + " → " + to + ": " + (r.compatible ? "compatible." : "NOT compatible. " + r.note);
    return success(result, r.note, "", [], { compatible: r.compatible });
  } catch (e) {
    return failure(String(e));
  }
}

function handleBackflowTest(body: Record<string, unknown>): FlumEnvelope {
  const assembly = body["assembly_type"] as string | undefined;
  if (!assembly) return failure("assembly_type is required");
  try {
    const r = selectBackflowAssembly({
      assembly_type: assembly,
      size_in: body["size_in"] as number | undefined,
      test_pressure_psi: body["test_pressure_psi"] as number | undefined,
    });
    const result = assembly + " (" + (body["size_in"] ?? "standard") + '): ' + (r.testPassed ? "PASS" : "FAIL") + ". Next test: " + r.nextTestDue;
    return success(result, r.maintenanceNote ?? "", "", [], { testPassed: r.testPassed });
  } catch (e) {
    return failure(String(e));
  }
}

function handleBidGenerator(body: Record<string, unknown>): FlumEnvelope {
  const projType = body["project_type"] as string | undefined;
  const scope = body["scope"] as string | undefined;
  if (!projType || !scope) return failure("project_type and scope are required");
  try {
    const r = generateBid({
      project_type: projType as "repair" | "replacement" | "new_construction" | "remodel",
      scope,
      fixtures: (body["fixtures"] as string[]) ?? [],
      labor_rate: (body["labor_rate"] as number) ?? 85,
    });
    const result = "Total: $" + r.total.toFixed(2) + ". Labor: $" + r.labor.toFixed(2) + ". Materials: $" + r.materials.toFixed(2) + ".";
    return success(result, r.marginNote ?? "", "", [], { total: r.total, margin: r.margin });
  } catch (e) {
    return failure(String(e));
  }
}

const HANDLERS: Record<string, (body: Record<string, unknown>) => FlumEnvelope> = {
  "/slope": handleSlope,
  "/pipe-sizer": handlePipeSizer,
  "/fixture-counter": handleFixtureCounter,
  "/code-compliance": handleCodeCompliance,
  "/hydraulic-analyzer": handleHydraulicAnalyzer,
  "/drainage-designer": handleDrainageDesigner,
  "/permit-navigator": handlePermitNavigator,
  "/ada-compliance": handleAdaCompliance,
  "/material-spec": handleMaterialSpec,
  "/backflow-test": handleBackflowTest,
  "/bid-generator": handleBidGenerator,
};

const TOOL_LIST = Object.keys(HANDLERS).map((t) => t.replace("/", "")).join(", ");

// ── Worker entry point ───────────────────────────────────────────────────────────
export default {
  async fetch(request: Request): Promise<Response> {
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const rate = checkRate(ip);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-RateLimit-Limit": String(RATE_LIMIT),
      "X-RateLimit-Remaining": String(rate.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rate.resetIn / 1000)),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
        status: 429, headers,
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only. Available tools: " + TOOL_LIST }), {
        status: 405, headers,
      });
    }

    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
        status: 415, headers,
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers });
    }

    const path = request.url.split("/api/v1")[1] ?? request.url;
    const handler = HANDLERS[path];
    if (!handler) {
      return new Response(JSON.stringify({ error: "Tool not found. Available: " + TOOL_LIST }), {
        status: 404, headers,
      });
    }

    try {
      const result = handler(body);
      return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify(failure(String(e))), { status: 500, headers });
    }
  },
};
