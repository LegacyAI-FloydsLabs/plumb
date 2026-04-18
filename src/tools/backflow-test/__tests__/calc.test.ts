import { describe, it, expect } from "vitest";
import { selectBackflowAssembly } from "../calc";

describe("selectBackflowAssembly", () => {
  it("selects RPZ for high hazard (medical)", () => {
    const result = selectBackflowAssembly({ application: "medical dental equipment" });
    expect(result.recommended.abbreviation).toBe("RPZ");
    expect(result.recommended.degree_of_hazard).toBe("high");
  });

  it("selects DCVA for commercial building", () => {
    const result = selectBackflowAssembly({ application: "commercial building water supply" });
    expect(["DCVA", "RPZ"]).toContain(result.recommended.abbreviation);
  });

  it("selects PVB or AVB for irrigation", () => {
    const result = selectBackflowAssembly({ application: "lawn irrigation system" });
    expect(["PVB", "AVB"]).toContain(result.recommended.abbreviation);
  });

  it("includes test procedure and pass criteria", () => {
    const result = selectBackflowAssembly({ application: "irrigation" });
    expect(result.recommended.test_procedure.length).toBeGreaterThan(0);
    expect(result.recommended.pass_criteria.length).toBeGreaterThan(0);
  });

  it("includes installation notes", () => {
    const result = selectBackflowAssembly({ application: "fire suppression with additives" });
    expect(result.installation_notes.length).toBeGreaterThan(0);
    expect(result.testing_requirements.length).toBeGreaterThan(0);
  });

  it("warns when explicit high hazard overrides", () => {
    const result = selectBackflowAssembly({
      application: "garden hose", hazard_degree: "high",
    });
    expect(result.warnings.some((w) => w.includes("High hazard"))).toBe(true);
  });
});
