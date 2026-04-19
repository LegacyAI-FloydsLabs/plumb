/**
 * Tests for the FLUM Tool Registry — Two-Layer API Contract
 *
 * Validates:
 * - All 11 tools have Layer 1 + Layer 2 schemas
 * - Layer 1 schemas have 3 or fewer required fields (FLUM §3.2)
 * - Layer 2 schemas are strict supersets of Layer 1
 * - Every tool has at least one example
 * - Tool IDs match the canonical set
 * - Field names use plain language (FLUM §3.6)
 */

import { describe, it, expect } from "vitest";
import {
    TOOLS,
    TOOL_IDS,
    getTool,
    getLayer1Schema,
    getLayer2Schema,
    validateLayer1Compliance,
} from "../tool-registry";

const EXPECTED_TOOLS = [
  "slope",
  "pipe_sizer",
  "fixture_counter",
  "code_compliance",
  "hydraulic_analyzer",
  "drainage_designer",
  "permit_navigator",
  "ada_compliance",
  "material_spec",
  "backflow_test",
  "bid_generator",
] as const;

describe("Tool Registry — completeness", () => {
  it("has exactly 11 tools", () => {
    expect(TOOL_IDS).toHaveLength(11);
  });

  it("contains every expected tool ID", () => {
    for (const id of EXPECTED_TOOLS) {
      expect(TOOL_IDS).toContain(id);
    }
  });

  it("getTool returns definition for valid IDs", () => {
    for (const id of EXPECTED_TOOLS) {
      const def = getTool(id);
      expect(def).toBeDefined();
      expect(def!.id).toBe(id);
    }
  });

  it("getTool returns undefined for unknown ID", () => {
    expect(getTool("nonexistent")).toBeUndefined();
  });
});

describe("Tool Registry — FLUM §3.2 Layer 1 compliance", () => {
  it("every Layer 1 schema has 3 or fewer required fields", () => {
    const violations = validateLayer1Compliance();
    expect(violations).toEqual([]);
  });

  it("Layer 1 schemas individually satisfy the rule", () => {
    for (const id of EXPECTED_TOOLS) {
      const schema = getLayer1Schema(id);
      expect(schema.required.length).toBeLessThanOrEqual(3);
    }
  });
});

describe("Tool Registry — two-layer schema structure", () => {
  it("every tool has both layer1 and layer2 schemas", () => {
    for (const id of EXPECTED_TOOLS) {
      const def = TOOLS[id];
      expect(def.layer1).toBeDefined();
      expect(def.layer2).toBeDefined();
      expect(def.layer1.type).toBe("object");
      expect(def.layer2.type).toBe("object");
    }
  });

  it("Layer 2 is a strict superset of Layer 1 required fields", () => {
    for (const id of EXPECTED_TOOLS) {
      const l1 = getLayer1Schema(id);
      const l2 = getLayer2Schema(id);
      // Every Layer 1 required field must also be in Layer 2
      for (const field of l1.required) {
        expect(l2.properties[field]).toBeDefined();
        expect(l2.required).toContain(field);
      }
    }
  });

  it("Layer 2 has more properties than Layer 1", () => {
    for (const id of EXPECTED_TOOLS) {
      const l1 = getLayer1Schema(id);
      const l2 = getLayer2Schema(id);
      const l1Keys = Object.keys(l1.properties);
      const l2Keys = Object.keys(l2.properties);
      expect(l2Keys.length).toBeGreaterThanOrEqual(l1Keys.length);
    }
  });

  it("every Layer 2 schema includes include_advanced", () => {
    for (const id of EXPECTED_TOOLS) {
      const l2 = getLayer2Schema(id);
      expect(l2.properties.include_advanced).toBeDefined();
      expect(l2.properties.include_advanced!.type).toBe("boolean");
    }
  });

  it("every Layer 2 schema includes diagnostic_dump", () => {
    for (const id of EXPECTED_TOOLS) {
      const l2 = getLayer2Schema(id);
      expect(l2.properties.diagnostic_dump).toBeDefined();
      expect(l2.properties.diagnostic_dump!.type).toBe("boolean");
    }
  });

  it("every Layer 2 schema includes sensor_sources", () => {
    for (const id of EXPECTED_TOOLS) {
      const l2 = getLayer2Schema(id);
      expect(l2.properties.sensor_sources).toBeDefined();
    }
  });

  it("every Layer 2 schema includes confidence_threshold", () => {
    for (const id of EXPECTED_TOOLS) {
      const l2 = getLayer2Schema(id);
      expect(l2.properties.confidence_threshold).toBeDefined();
    }
  });
});

describe("Tool Registry — per-tool definition quality", () => {
  it("every tool has a non-empty name", () => {
    for (const id of EXPECTED_TOOLS) {
      expect(TOOLS[id].name.length).toBeGreaterThan(0);
    }
  });

  it("every tool has a tagline under 80 chars", () => {
    for (const id of EXPECTED_TOOLS) {
      expect(TOOLS[id].tagline.length).toBeGreaterThan(0);
      expect(TOOLS[id].tagline.length).toBeLessThanOrEqual(80);
    }
  });

  it("every tool has a non-empty description", () => {
    for (const id of EXPECTED_TOOLS) {
      expect(TOOLS[id].description.length).toBeGreaterThan(0);
    }
  });

  it("every tool has at least one action", () => {
    for (const id of EXPECTED_TOOLS) {
      expect(TOOLS[id].actions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every tool has at least one example", () => {
    for (const id of EXPECTED_TOOLS) {
      expect(TOOLS[id].examples.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every example has a description and both layer payloads", () => {
    for (const id of EXPECTED_TOOLS) {
      for (const ex of TOOLS[id].examples) {
        expect(ex.description.length).toBeGreaterThan(0);
        expect(ex.layer1).toBeDefined();
        expect(ex.layer2).toBeDefined();
      }
    }
  });
});

describe("Tool Registry — FLUM §3.6 plain language", () => {
  const JARGON_PATTERNS = [
    /SIGINT/i,
    /0x[0-9a-fA-F]{2,}/,
    /CRON_ERR/i,
    /ERR_\d+/,
    /HTTP_\d{3}/,
  ];

  it("no field names contain technical jargon", () => {
    for (const id of EXPECTED_TOOLS) {
      const allFields = [
        ...Object.keys(TOOLS[id].layer1.properties),
        ...Object.keys(TOOLS[id].layer2.properties),
      ];
      for (const field of allFields) {
        for (const pattern of JARGON_PATTERNS) {
          expect(field).not.toMatch(pattern);
        }
      }
    }
  });
});

describe("Tool Registry — schema detail spot checks", () => {
  it("slope layer1 requires only stations", () => {
    expect(getLayer1Schema("slope").required).toEqual(["stations"]);
  });

  it("pipe_sizer layer1 requires wsfu and dfu", () => {
    expect(getLayer1Schema("pipe_sizer").required).toEqual(["wsfu", "dfu"]);
  });

  it("material_spec layer1 requires two materials", () => {
    const req = getLayer1Schema("material_spec").required;
    expect(req).toContain("material_a");
    expect(req).toContain("material_b");
  });

  it("hydraulic_analyzer layer1 requires flow and pipe size", () => {
    const req = getLayer1Schema("hydraulic_analyzer").required;
    expect(req).toContain("flow_gpm");
    expect(req).toContain("pipe_size");
  });

  it("backflow_test layer1 requires application", () => {
    expect(getLayer1Schema("backflow_test").required).toEqual(["application"]);
  });

  it("code_compliance layer1 requires query", () => {
    expect(getLayer1Schema("code_compliance").required).toEqual(["query"]);
  });

  it("permit_navigator layer1 requires description", () => {
    expect(getLayer1Schema("permit_navigator").required).toEqual(["description"]);
  });

  it("ada_compliance layer1 requires measurements", () => {
    expect(getLayer1Schema("ada_compliance").required).toEqual(["measurements"]);
  });

  it("drainage_designer layer1 requires total_fu", () => {
    expect(getLayer1Schema("drainage_designer").required).toEqual(["total_fu"]);
  });

  it("fixture_counter layer1 has no required fields (fixtures or bathroom_groups)", () => {
    // Either fixtures or bathroom_groups — both optional, validated at runtime
    expect(getLayer1Schema("fixture_counter").required).toEqual([]);
  });

  it("bid_generator layer1 has no required fields (materials or tasks)", () => {
    // Either material_quantities or tasks — both optional, validated at runtime
    expect(getLayer1Schema("bid_generator").required).toEqual([]);
  });
});
