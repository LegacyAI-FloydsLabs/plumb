import { describe, it, expect } from "vitest";
import { checkMaterial, MATERIALS } from "../calc";

describe("checkMaterial", () => {
  it("finds copper-to-pex compatible", () => {
    const result = checkMaterial({ material_a: "copper", material_b: "pex" });
    expect(result.compatibility.compatible).toBe(true);
    expect(result.compatibility.transition).toBeTruthy();
  });

  it("finds copper-to-galvanized requires dielectric", () => {
    const result = checkMaterial({ material_a: "copper", material_b: "galvanized" });
    expect(result.compatibility.compatible).toBe(true);
    expect(result.compatibility.transition.toLowerCase()).toContain("dielectric");
  });

  it("finds PVC-to-PVC compatible", () => {
    const result = checkMaterial({ material_a: "pvc", material_b: "pvc" });
    expect(result.compatibility.compatible).toBe(true);
    expect(result.compatibility.code_reference).toBeTruthy();
  });

  it("returns warning for unknown pairing", () => {
    const result = checkMaterial({ material_a: "brass", material_b: "no_hub_cast" });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("generates BOM when pipe_size and joint_count provided", () => {
    const result = checkMaterial({
      material_a: "copper", material_b: "pex",
      pipe_size: "3/4", joint_count: 5,
    });
    expect(result.bom.length).toBeGreaterThan(0);
    expect(result.estimated_cost.low).toBeGreaterThan(0);
  });

  it("exposes a non-empty materials list", () => {
    expect(MATERIALS.length).toBeGreaterThan(5);
  });
});
