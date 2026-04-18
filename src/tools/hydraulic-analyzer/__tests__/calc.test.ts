import { describe, it, expect } from "vitest";
import { analyzeHydraulics } from "../calc";

describe("analyzeHydraulics", () => {
  it("computes basic copper pipe analysis", () => {
    const result = analyzeHydraulics({
      material: "copper", pipe_size: "3/4", length_ft: 50,
      flow_gpm: 8, static_pressure_psi: 55, elevation_rise_ft: 0, fittings_count: 0,
    });
    expect(result.velocity_fps).toBeGreaterThan(0);
    expect(result.residual_pressure_psi).toBeGreaterThan(0);
    expect(result.friction_per_100ft_psi).toBeGreaterThan(0);
  });

  it("rejects zero flow rate", () => {
    const result = analyzeHydraulics({
      material: "copper", pipe_size: "3/4", length_ft: 50,
      flow_gpm: 0, static_pressure_psi: 55, elevation_rise_ft: 0, fittings_count: 0,
    });
    expect(result.velocity_fps).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("rejects negative flow rate", () => {
    const result = analyzeHydraulics({
      material: "copper", pipe_size: "3/4", length_ft: 50,
      flow_gpm: -5, static_pressure_psi: 55, elevation_rise_ft: 0, fittings_count: 0,
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("rejects zero pipe length", () => {
    const result = analyzeHydraulics({
      material: "copper", pipe_size: "3/4", length_ft: 0,
      flow_gpm: 8, static_pressure_psi: 55, elevation_rise_ft: 0, fittings_count: 0,
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns error for unknown pipe size", () => {
    const result = analyzeHydraulics({
      material: "copper", pipe_size: "99", length_ft: 50,
      flow_gpm: 8, static_pressure_psi: 55, elevation_rise_ft: 0, fittings_count: 0,
    });
    expect(result.warnings[0]).toContain("Unknown pipe size");
  });

  it("accounts for elevation loss", () => {
    const flat = analyzeHydraulics({
      material: "copper", pipe_size: "3/4", length_ft: 50,
      flow_gpm: 8, static_pressure_psi: 55, elevation_rise_ft: 0, fittings_count: 0,
    });
    const elevated = analyzeHydraulics({
      material: "copper", pipe_size: "3/4", length_ft: 50,
      flow_gpm: 8, static_pressure_psi: 55, elevation_rise_ft: 20, fittings_count: 0,
    });
    expect(elevated.residual_pressure_psi).toBeLessThan(flat.residual_pressure_psi);
  });

  it("recommends larger pipe when velocity is too high", () => {
    const result = analyzeHydraulics({
      material: "copper", pipe_size: "1/2", length_ft: 10,
      flow_gpm: 30, static_pressure_psi: 80, elevation_rise_ft: 0, fittings_count: 0,
    });
    expect(result.velocity_ok).toBe(false);
    if (result.recommended_size) {
      expect(result.recommended_size).not.toBe("1/2");
    }
  });
});
