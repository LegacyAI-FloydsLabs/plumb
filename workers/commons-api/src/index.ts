/*
 * Plumb Trade Commons API Worker
 * Copyright (C) 2026 Legacy AI LLC and contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Free, rate-limited, zero-auth HTTP API for the Plumb calculation engines.
 * Deployed on Cloudflare Workers or Vercel Edge Functions.
 *
 * All computation routes through the FLUM Standard 000 One Door In pattern
 * via compute() from src/llm/flum.ts. No calc engine is called directly.
 *
 * Two-layer API contract (FLUM §3.2, §3.3):
 *   Layer 1 — SLM-safe. 3 or fewer required fields. Zero-shot success.
 *   Layer 2 — Full parameter surface. Diagnostics, sensors, confidence.
 *
 * An LLM discovers tools via GET /tools, reads schemas, constructs payloads,
 * and calls POST /{tool} or POST /compute. No external documentation needed.
 *
 * Rate limit: 60 req/min per IP. No request-body persistence. No logs of call content.
 */

import {
 compute,
 parseIntent,
 type FlumComputeRequest,
 type FlumResponse,
 type ToolId,
} from "../../../src/llm/flum";
import {
 TOOLS,
 TOOL_IDS,
 getTool,
 type ToolDefinition,
} from "../../../src/llm/tool-registry";

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

// ── Helpers ──────────────────────────────────────────────────────────────────────

function flumError(what: string, howToFix: string, nextSteps: string[] = []): FlumResponse {
 return {
  status: "failure",
  result: what,
  hint: howToFix,
  actions_available: nextSteps,
 };
}

const TOOL_ROUTES: Record<string, ToolId> = {
 "/slope": "slope",
 "/pipe-sizer": "pipe_sizer",
 "/fixture-counter": "fixture_counter",
 "/code-compliance": "code_compliance",
 "/hydraulic-analyzer": "hydraulic_analyzer",
 "/drainage-designer": "drainage_designer",
 "/permit-navigator": "permit_navigator",
 "/ada-compliance": "ada_compliance",
 "/material-spec": "material_spec",
 "/backflow-test": "backflow_test",
 "/bid-generator": "bid_generator",
};

/** Reverse map: tool ID → URL path */
const TOOL_PATHS: Record<string, string> = {};
for (const [path, id] of Object.entries(TOOL_ROUTES)) {
 TOOL_PATHS[id] = path;
}

const AVAILABLE_TOOLS = TOOL_IDS.join(", ");

// ── Schema serialization ─────────────────────────────────────────────────────────

/** Strip the tool definition to what an LLM needs for discovery */
function toolToLayer1Summary(def: ToolDefinition) {
 return {
  id: def.id,
  name: def.name,
  tagline: def.tagline,
  codes: def.codes,
  actions: def.actions,
  endpoint: TOOL_PATHS[def.id],
  schema: def.layer1,
 };
}

/** Full tool definition with both layers and examples */
function toolToFullDetail(def: ToolDefinition) {
 return {
  id: def.id,
  name: def.name,
  tagline: def.tagline,
  description: def.description,
  codes: def.codes,
  actions: def.actions,
  endpoint: TOOL_PATHS[def.id],
  layer1: {
   description: def.layer1.description,
   schema: def.layer1,
  },
  layer2: {
   description: def.layer2.description,
   schema: def.layer2,
  },
  examples: def.examples,
 };
}

// ── Worker entry point ──────────────────────────────────────────────────────────
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
   "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
   "Access-Control-Allow-Headers": "Content-Type",
  };

  if (!rate.allowed) {
   return new Response(JSON.stringify(flumError("Rate limit exceeded.", "Wait a moment and try again.", ["retry"])), {
    status: 429, headers,
   });
  }

  if (request.method === "OPTIONS") {
   return new Response(null, { status: 204, headers });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace("/api/v1", "") || "/";

  // ── GET /tools — discovery endpoint (Layer 1 schemas inline) ────────────────
  if (request.method === "GET" && path === "/tools") {
   const toolList = TOOL_IDS.map((id) => toolToLayer1Summary(TOOLS[id]));
   return new Response(JSON.stringify(toolList, null, 2), { status: 200, headers });
  }

  // ── GET /tools/{id} — single tool detail (both layers + examples) ───────────
  if (request.method === "GET" && path.startsWith("/tools/")) {
   const toolPath = path.replace("/tools", "");
   const toolId = TOOL_ROUTES[toolPath];
   const def = toolId ? getTool(toolId) : getTool(toolPath);

   if (!def) {
    return new Response(JSON.stringify(flumError(
     `Unknown tool: ${path}`,
     `Available tools: ${AVAILABLE_TOOLS}. Use GET /tools to discover all tools.`,
     TOOL_IDS,
    )), { status: 404, headers });
   }

   return new Response(JSON.stringify(toolToFullDetail(def), null, 2), { status: 200, headers });
  }

  // ── POST /compute — natural language entry point ────────────────────────────
  if (request.method === "POST" && path === "/compute") {
   let body: Record<string, unknown>;
   try {
    body = await request.json();
   } catch {
    return new Response(JSON.stringify(flumError("Invalid JSON body.", "Send a JSON object with an 'input' field.", ["compute"])), { status: 400, headers });
   }

   const input = body["input"];
   if (typeof input !== "string" || !input.trim()) {
    return new Response(JSON.stringify(flumError("Missing or empty 'input' field.", "Provide a natural language query like: { \"input\": \"3 inch PVC at 1/4 inch per foot\" }", ["compute"])), { status: 400, headers });
   }

   const parsed = parseIntent(input);
   const response = await compute({
    tool: parsed.tool,
    action: parsed.action,
    params: parsed.params,
    include_advanced: body["include_advanced"] === true,
   });

   return new Response(JSON.stringify(response), { status: 200, headers });
  }

  // ── POST /{tool} — structured entry point (Layer 1 or Layer 2) ──────────────
  if (request.method === "POST") {
   const toolId = TOOL_ROUTES[path];
   if (!toolId) {
    return new Response(JSON.stringify(flumError(`Unknown tool: ${path}`, `Available tools: ${AVAILABLE_TOOLS}. Use GET /tools to discover all tools with schemas.`, TOOL_IDS)), {
     status: 404, headers,
    });
   }

   let body: Record<string, unknown>;
   try {
    body = await request.json();
   } catch {
    return new Response(JSON.stringify(flumError("Invalid JSON body.", "Send a JSON object with the tool's required parameters. Use GET /tools/{tool} to see the full schema.", [toolId])), { status: 400, headers });
   }

   // Merge query string params into body (for GET-like convenience)
   for (const [key, value] of url.searchParams) {
    if (!(key in body)) {
     body[key] = isNaN(Number(value)) ? value : Number(value);
    }
   }

   const response = await compute({
    tool: toolId,
    action: (body["action"] as string) || "compute",
    params: body,
    include_advanced: body["include_advanced"] === true,
   });

   return new Response(JSON.stringify(response), { status: 200, headers });
  }

  // ── Anything else ───────────────────────────────────────────────────────────
  return new Response(JSON.stringify(flumError("Method not allowed.", "Use GET /tools to discover tools, GET /tools/{id} for schemas, POST /compute for natural language, or POST /{tool} for structured input.", ["tools", "compute"])), {
   status: 405, headers,
  });
 },
};
