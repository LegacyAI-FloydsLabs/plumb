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
 * Rate limit: 60 req/min per IP. No request-body persistence. No logs of call content.
 */

import {
  compute,
  parseIntent,
  type FlumComputeRequest,
  type FlumResponse,
  type ToolId,
} from "../../../src/llm/flum";

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

// ── FLUM error response ─────────────────────────────────────────────────────────

function flumError(what: string, howToFix: string, nextSteps: string[] = []): FlumResponse {
  return {
    status: "failure",
    result: what,
    hint: howToFix,
    actions_available: nextSteps,
  };
}

// ── Tool routing ────────────────────────────────────────────────────────────────

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

const TOOL_INFO = [
  { id: "slope", name: "Slope Reader", description: "Pipe slope and belly calculation from survey stations", required_params: ["stations"] },
  { id: "pipe_sizer", name: "Pipe Sizer", description: "Water supply, drain, and vent pipe sizing by fixture units", required_params: ["wsfu", "dfu"] },
  { id: "fixture_counter", name: "Fixture Counter", description: "DFU and WSFU fixture unit counting with bathroom group reduction", required_params: ["fixtures"] },
  { id: "code_compliance", name: "Code Book", description: "IPC/UPC code section lookup and compliance check", required_params: ["query"] },
  { id: "hydraulic_analyzer", name: "Pressure Reader", description: "Pressure, flow, velocity, and friction loss analysis", required_params: ["flow_gpm", "pipe_size"] },
  { id: "drainage_designer", name: "Drain Layout", description: "Stack sizing, cleanout placement, and vent layout", required_params: ["total_fu"] },
  { id: "permit_navigator", name: "Permit Finder", description: "Permit requirements, fee estimation, and document checklist", required_params: ["description"] },
  { id: "ada_compliance", name: "Clearance Check", description: "ADA clearance verification for plumbing fixtures", required_params: ["measurements"] },
  { id: "material_spec", name: "Material Match", description: "Material compatibility check and transition fitting selection", required_params: ["material_a", "material_b"] },
  { id: "backflow_test", name: "Backflow Log", description: "Backflow assembly selection and test criteria", required_params: ["application"] },
  { id: "bid_generator", name: "Bid Writer", description: "Bid estimation with materials, labor, and overhead", required_params: ["material_quantities"] },
];

const AVAILABLE_TOOLS = TOOL_INFO.map((t) => t.id).join(", ");

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

    // ── GET /tools — discovery endpoint ────────────────────────────────────────
    if (request.method === "GET" && path === "/tools") {
      return new Response(JSON.stringify(TOOL_INFO), { status: 200, headers });
    }

    // ── POST /compute — natural language entry point ───────────────────────────
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

    // ── POST /{tool} — structured entry point ──────────────────────────────────
    if (request.method === "POST") {
      const toolId = TOOL_ROUTES[path];
      if (!toolId) {
        return new Response(JSON.stringify(flumError(`Unknown tool: ${path}`, `Available tools: ${AVAILABLE_TOOLS}.`, TOOL_INFO.map((t) => t.id))), {
          status: 404, headers,
        });
      }

      let body: Record<string, unknown>;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify(flumError("Invalid JSON body.", "Send a JSON object with the tool's required parameters.", [toolId])), { status: 400, headers });
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

    // ── Anything else ──────────────────────────────────────────────────────────
    return new Response(JSON.stringify(flumError("Method not allowed.", "Use GET /tools to discover tools, POST /compute for natural language, or POST /{tool} for structured input.", ["tools", "compute"])), {
      status: 405, headers,
    });
  },
};
