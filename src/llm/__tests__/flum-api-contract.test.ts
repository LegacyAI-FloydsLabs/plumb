/**
 * FLUM API Contract Integration Test
 *
 * Tests the compute() function — the same entry point the Commons API worker uses.
 * This validates the entire FLUM Standard 000 contract end-to-end:
 * - One Door In: compute() is the sole entry point
 * - Floor-Level Simplicity: 3 or fewer required fields
 * - Self-Documenting Responses: status, result, hint, actions_available
 * - Error Messages are Instructions: what + how to fix + next steps
 */
import { describe, it, expect } from "vitest";
import { compute, parseIntent, type FlumResponse } from "../flum";

// ── Response shape validation ────────────────────────────────────────────────

function expectValidEnvelope(r: FlumResponse) {
  expect(["success", "failure", "pending"]).toContain(r.status);
  expect(typeof r.result).toBe("string");
  expect(r.result.length).toBeGreaterThan(0);
  expect(typeof r.hint).toBe("string");
  expect(Array.isArray(r.actions_available)).toBe(true);
}

function expectSuccess(r: FlumResponse) {
  expectValidEnvelope(r);
  expect(r.status).toBe("success");
  expect(r.metadata).toBeDefined();
  expect(typeof r.metadata!.confidence).toBe("number");
  expect(r.metadata!.confidence).toBeGreaterThan(0);
  expect(r.metadata!.confidence).toBeLessThanOrEqual(1);
}

function expectFailure(r: FlumResponse) {
  expectValidEnvelope(r);
  expect(r.status).toBe("failure");
}

// ── Slope Reader ──────────────────────────────────────────────────────────────

describe("FLUM compute — slope", () => {
  it("computes slope from stations", async () => {
    const r = await compute({
      tool: "slope",
      action: "compute",
      params: {
        stations: [
          { label: 1, distance: 0, rodReading: 4.5, depth: 6.2 },
          { label: 2, distance: 50, rodReading: 4.7, depth: 6.0 },
          { label: 3, distance: 100, rodReading: 4.9, depth: 5.8 },
        ],
      },
    });
    expectSuccess(r);
    expect(r.result).toMatch(/CODE COMPLIANT|MARGINAL|BELOW MINIMUM/);
    expect(r.data).toBeDefined();
  });

  it("classifies a slope percentage", async () => {
    const r = await compute({
      tool: "slope",
      action: "classify",
      params: { pct: 2.083 },
    });
    expectSuccess(r);
    expect(r.result).toContain("2.083%");
  });

  it("returns failure for missing stations", async () => {
    const r = await compute({
      tool: "slope",
      action: "compute",
      params: {},
    });
    expectFailure(r);
    expect(r.hint).toContain("stations");
  });
});

// ── Pipe Sizer ────────────────────────────────────────────────────────────────

describe("FLUM compute — pipe_sizer", () => {
  it("sizes pipes from fixture units", async () => {
    const r = await compute({
      tool: "pipe_sizer",
      action: "compute",
      params: { wsfu: 12, dfu: 6, longest_run_ft: 60, stories: 2 },
    });
    expectSuccess(r);
    expect(r.result).toContain('"');
  });

  it("returns failure for missing fixture units", async () => {
    const r = await compute({
      tool: "pipe_sizer",
      action: "compute",
      params: {},
    });
    expectFailure(r);
    expect(r.hint).toContain("wsfu");
  });
});

// ── Fixture Counter ───────────────────────────────────────────────────────────

describe("FLUM compute — fixture_counter", () => {
  it("counts fixtures with bathroom group reduction", async () => {
    const r = await compute({
      tool: "fixture_counter",
      action: "compute",
      params: {
        fixtures: { water_closet: 2, lavatory: 2, bathtub: 1 },
        bathroom_groups: 1,
        occupancy: "private",
        code: "ipc-2021",
      },
    });
    expectSuccess(r);
    expect(r.result).toContain("DFU");
  });

  it("returns failure for empty fixtures", async () => {
    const r = await compute({
      tool: "fixture_counter",
      action: "compute",
      params: {},
    });
    expectFailure(r);
    expect(r.hint).toContain("fixtures");
  });
});

// ── Code Compliance ───────────────────────────────────────────────────────────

describe("FLUM compute — code_compliance", () => {
  it("looks up code sections by query", async () => {
    const r = await compute({
      tool: "code_compliance",
      action: "compute",
      params: { query: "trap arm length" },
    });
    expectSuccess(r);
    expect(r.data).toBeDefined();
  });

  it("returns failure for empty query", async () => {
    const r = await compute({
      tool: "code_compliance",
      action: "compute",
      params: {},
    });
    expectFailure(r);
  });
});

// ── Hydraulic Analyzer ────────────────────────────────────────────────────────

describe("FLUM compute — hydraulic_analyzer", () => {
  it("analyzes pressure and velocity", async () => {
    const r = await compute({
      tool: "hydraulic_analyzer",
      action: "compute",
      params: {
        flow_gpm: 8,
        pipe_size: "3/4",
        material: "copper",
        length_ft: 50,
        static_pressure_psi: 55,
      },
    });
    expectSuccess(r);
    expect(r.result).toContain("psi");
    expect(r.result).toContain("ft/s");
  });

  it("returns failure for missing flow/pipe", async () => {
    const r = await compute({
      tool: "hydraulic_analyzer",
      action: "compute",
      params: {},
    });
    expectFailure(r);
    expect(r.hint).toContain("flow");
  });
});

// ── Drainage Designer ─────────────────────────────────────────────────────────

describe("FLUM compute — drainage_designer", () => {
  it("designs drainage layout from fixture units", async () => {
    const r = await compute({
      tool: "drainage_designer",
      action: "compute",
      params: { total_fu: 20 },
    });
    expectSuccess(r);
    expect(r.result).toContain("cleanout");
  });

  it("returns failure for missing fixture units", async () => {
    const r = await compute({
      tool: "drainage_designer",
      action: "compute",
      params: {},
    });
    expectFailure(r);
  });
});

// ── Permit Navigator ──────────────────────────────────────────────────────────

describe("FLUM compute — permit_navigator", () => {
  it("navigates permits by description", async () => {
    const r = await compute({
      tool: "permit_navigator",
      action: "compute",
      params: { description: "bathroom remodel" },
    });
    expectSuccess(r);
    expect(r.result).toContain("permit");
  });

  it("returns failure for empty description", async () => {
    const r = await compute({
      tool: "permit_navigator",
      action: "compute",
      params: {},
    });
    expectFailure(r);
  });
});

// ── ADA Compliance ────────────────────────────────────────────────────────────

describe("FLUM compute — ada_compliance", () => {
  it("checks ADA compliance from measurements", async () => {
    const r = await compute({
      tool: "ada_compliance",
      action: "compute",
      params: { measurements: { wc_centerline: 18, seat_height: 17 } },
    });
    expectSuccess(r);
    expect(r.result).toContain("compliance");
  });

  it("returns failure for empty measurements", async () => {
    const r = await compute({
      tool: "ada_compliance",
      action: "compute",
      params: {},
    });
    expectFailure(r);
  });
});

// ── Material Spec ─────────────────────────────────────────────────────────────

describe("FLUM compute — material_spec", () => {
  it("checks material compatibility", async () => {
    const r = await compute({
      tool: "material_spec",
      action: "compute",
      params: { material_a: "copper", material_b: "pex" },
    });
    expectSuccess(r);
    expect(r.result).toContain("copper");
    expect(r.result).toContain("pex");
  });

  it("returns failure for missing materials", async () => {
    const r = await compute({
      tool: "material_spec",
      action: "compute",
      params: {},
    });
    expectFailure(r);
  });
});

// ── Backflow Test ─────────────────────────────────────────────────────────────

describe("FLUM compute — backflow_test", () => {
  it("selects backflow assembly by application", async () => {
    const r = await compute({
      tool: "backflow_test",
      action: "compute",
      params: { application: "irrigation system" },
    });
    expectSuccess(r);
    expect(r.result).toContain("hazard");
  });

  it("returns failure for empty application", async () => {
    const r = await compute({
      tool: "backflow_test",
      action: "compute",
      params: {},
    });
    expectFailure(r);
  });
});

// ── Bid Generator ─────────────────────────────────────────────────────────────

describe("FLUM compute — bid_generator", () => {
  it("generates bid from materials and tasks", async () => {
    const r = await compute({
      tool: "bid_generator",
      action: "compute",
      params: {
        material_quantities: { "3/4 copper pipe": 50, "copper fittings": 12 },
        tasks: ["install_water_heater"],
      },
    });
    expectSuccess(r);
    expect(r.result).toContain("$");
  });

  it("returns failure for empty materials and tasks", async () => {
    const r = await compute({
      tool: "bid_generator",
      action: "compute",
      params: {},
    });
    expectFailure(r);
  });
});

// ── Error routing ─────────────────────────────────────────────────────────────

describe("FLUM compute — error routing", () => {
  it("returns error for unknown tool", async () => {
    const r = await compute({
      tool: "nonexistent" as any,
      action: "compute",
      params: {},
    });
    expectFailure(r);
    expect(r.hint).toContain("slope");
  });

  it("returns error for unknown action", async () => {
    const r = await compute({
      tool: "slope",
      action: "nonexistent",
      params: {},
    });
    expectFailure(r);
    expect(r.hint).toContain("compute");
  });
});

// ── Natural language routing (parseIntent) ────────────────────────────────────

describe("FLUM parseIntent — natural language routing", () => {
  it("routes slope queries", () => {
    const intent = parseIntent("what's the slope on this 4 inch lateral");
    expect(intent.tool).toBe("slope");
    expect(intent.confidence).toBeGreaterThan(0);
  });

  it("routes pipe sizing queries", () => {
    const intent = parseIntent("size a pipe for 12 wsfu");
    expect(intent.tool).toBe("pipe_sizer");
  });

  it("routes fixture count queries", () => {
    const intent = parseIntent("how many dfu for a bathroom group");
    expect(intent.tool).toBe("fixture_counter");
  });

  it("routes code queries", () => {
    const intent = parseIntent("what does IPC say about trap arms");
    expect(intent.tool).toBe("code_compliance");
  });

  it("routes pressure queries", () => {
    const intent = parseIntent("pressure loss on 3/4 copper at 8 gpm");
    expect(intent.tool).toBe("hydraulic_analyzer");
  });

  it("routes drainage queries", () => {
    const intent = parseIntent("drainage stack and cleanout layout");
    expect(intent.tool).toBe("drainage_designer");
  });

  it("routes permit queries", () => {
    const intent = parseIntent("permit and fee for bathroom remodel");
    expect(intent.tool).toBe("permit_navigator");
  });

  it("routes ADA queries", () => {
    const intent = parseIntent("ADA clearance for grab bar");
    expect(intent.tool).toBe("ada_compliance");
  });

  it("routes material queries", () => {
    const intent = parseIntent("can I connect copper to PEX");
    expect(intent.tool).toBe("material_spec");
  });

  it("routes backflow queries", () => {
    const intent = parseIntent("backflow assembly for irrigation");
    expect(intent.tool).toBe("backflow_test");
  });

  it("routes bid queries", () => {
    const intent = parseIntent("estimate for water heater replacement");
    expect(intent.tool).toBe("bid_generator");
  });

  it("defaults to slope for ambiguous input", () => {
    const intent = parseIntent("hello world");
    expect(intent.tool).toBe("slope");
    expect(intent.confidence).toBeLessThan(0.5);
  });
});
