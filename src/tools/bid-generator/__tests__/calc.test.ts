import { describe, it, expect } from "vitest";
import { generateBid, MATERIAL_CATALOG, TASK_TIMES } from "../calc";

describe("generateBid", () => {
  it("generates a bid with materials and labor", () => {
    const result = generateBid({
      project_type: "remodel",
      material_quantities: { "Water Closet (Tank-type, ADA)": 2, "Lavatory (Drop-in)": 1 },
      tasks: ["install_toilet", "install_lavatory"],
    });
    expect(result.grand_total).toBeGreaterThan(0);
    expect(result.material_subtotal).toBeGreaterThan(0);
    expect(result.labor_subtotal).toBeGreaterThan(0);
    expect(result.materials.length).toBe(2);
    expect(result.labor.length).toBe(2);
  });

  it("applies overhead percentage", () => {
    const result = generateBid({
      project_type: "remodel",
      material_quantities: { "Water Closet (Tank-type, ADA)": 1 },
      tasks: ["replace_toilet"],
      overhead_pct: 25,
    });
    expect(result.overhead_amount).toBeGreaterThan(0);
    expect(result.breakdown.find((b) => b.category === "overhead_profit")).toBeDefined();
  });

  it("adds permit fees to total", () => {
    const without = generateBid({
      project_type: "remodel",
      material_quantities: { "Lavatory (Drop-in)": 1 },
      tasks: ["install_lavatory"],
      permit_fees: 0,
    });
    const withPermit = generateBid({
      project_type: "remodel",
      material_quantities: { "Lavatory (Drop-in)": 1 },
      tasks: ["install_lavatory"],
      permit_fees: 200,
    });
    expect(withPermit.grand_total - without.grand_total).toBeCloseTo(200 + 200 * 0.2, 0);
  });

  it("handles empty materials (labor-only bid)", () => {
    const result = generateBid({
      project_type: "repair",
      material_quantities: {},
      tasks: ["replace_toilet"],
    });
    expect(result.grand_total).toBeGreaterThan(0);
    expect(result.material_subtotal).toBe(0);
  });

  it("handles empty tasks (materials-only bid)", () => {
    const result = generateBid({
      project_type: "repair",
      material_quantities: { "Stop Valve (1/2\")": 4 },
      tasks: [],
    });
    expect(result.grand_total).toBeGreaterThan(0);
    expect(result.labor_subtotal).toBe(0);
  });

  it("warns on unknown materials", () => {
    const result = generateBid({
      project_type: "remodel",
      material_quantities: { "unobtainium pipe": 10 },
      tasks: [],
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("warns on emergency projects", () => {
    const result = generateBid({
      project_type: "emergency",
      material_quantities: {},
      tasks: ["water_heater_replace"],
    });
    expect(result.warnings.some((w) => w.includes("Emergency"))).toBe(true);
  });

  it("exposes non-empty catalog and task database", () => {
    expect(MATERIAL_CATALOG.length).toBeGreaterThan(20);
    expect(Object.keys(TASK_TIMES).length).toBeGreaterThan(5);
  });
});
