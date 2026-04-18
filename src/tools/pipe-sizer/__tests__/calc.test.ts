import { describe, it, expect } from "vitest";
import { computePipeSizer } from "../calc";

describe("computePipeSizer", () => {
  it("sizes a basic residential system (IPC)", () => {
    const result = computePipeSizer({
      wsfu: 12, dfu: 6, longest_run_ft: 60, elevation_rise_ft: 0,
      code: "ipc-2021", stories: 1,
    });
    expect(result.water_service_size).toBeTruthy();
    expect(result.main_drain_size).toBeTruthy();
    expect(result.vent_size).toBeTruthy();
    expect(result.pressure_ok).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("sizes a larger commercial system (UPC)", () => {
    const result = computePipeSizer({
      wsfu: 42, dfu: 72, longest_run_ft: 150, elevation_rise_ft: 10,
      code: "upc-2021", stories: 3,
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.stack_size).toBeTruthy();
  });

  it("rejects negative WSFU", () => {
    const result = computePipeSizer({
      wsfu: -1, dfu: 6, longest_run_ft: 60, elevation_rise_ft: 0,
      code: "ipc-2021", stories: 1,
    });
    expect(result.confidence).toBe(0);
    expect(result.warnings).toContain("WSFU (-1) and DFU (6) must be non-negative.");
  });

  it("rejects zero WSFU and DFU", () => {
    const result = computePipeSizer({
      wsfu: 0, dfu: 0, longest_run_ft: 60, elevation_rise_ft: 0,
      code: "ipc-2021", stories: 1,
    });
    expect(result.confidence).toBe(0);
  });

  it("rejects zero run length", () => {
    const result = computePipeSizer({
      wsfu: 5, dfu: 3, longest_run_ft: 0, elevation_rise_ft: 0,
      code: "ipc-2021", stories: 1,
    });
    expect(result.confidence).toBe(0);
  });

  it("flags low residual pressure", () => {
    const result = computePipeSizer({
      wsfu: 100, dfu: 80, longest_run_ft: 300, elevation_rise_ft: 50,
      code: "ipc-2021", stories: 5, available_pressure_psi: 30,
    });
    expect(result.pressure_ok).toBe(false);
  });

  it("uses default 55 psi when available_pressure_psi omitted", () => {
    const result = computePipeSizer({
      wsfu: 5, dfu: 3, longest_run_ft: 50, elevation_rise_ft: 0,
      code: "ipc-2021", stories: 1,
    });
    expect(result.confidence).toBeGreaterThan(0);
  });
});
