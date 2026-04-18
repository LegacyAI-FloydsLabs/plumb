import { describe, it, expect } from "vitest";
import { designDrainage } from "../calc";

describe("designDrainage", () => {
  it("designs a basic residential drainage system", () => {
    const result = designDrainage({
      total_fu: 20, building_drain_size: "4", total_run_ft: 100,
      direction_changes: 2, stories: 1, code: "ipc-2021",
    });
    expect(result.stack_size).toBeTruthy();
    expect(result.cleanout_count).toBeGreaterThan(0);
    expect(result.drain_ok).toBe(true);
  });

  it("flags undersized drain", () => {
    const result = designDrainage({
      total_fu: 100, building_drain_size: "3", total_run_ft: 100,
      direction_changes: 0, stories: 1, code: "ipc-2021",
    });
    expect(result.drain_ok).toBe(false);
    expect(result.recommended_drain_size).toBeTruthy();
  });

  it("adds cleanouts for direction changes", () => {
    const straight = designDrainage({
      total_fu: 10, building_drain_size: "4", total_run_ft: 100,
      direction_changes: 0, stories: 1, code: "ipc-2021",
    });
    const bent = designDrainage({
      total_fu: 10, building_drain_size: "4", total_run_ft: 100,
      direction_changes: 5, stories: 1, code: "ipc-2021",
    });
    expect(bent.cleanout_count).toBeGreaterThan(straight.cleanout_count);
  });

  it("includes trap arm limits", () => {
    const result = designDrainage({
      total_fu: 10, building_drain_size: "4", total_run_ft: 50,
      direction_changes: 0, stories: 1, code: "ipc-2021",
    });
    expect(result.trap_arm_limits.length).toBeGreaterThan(0);
    const twoInch = result.trap_arm_limits.find((t) => t.size === "2");
    expect(twoInch).toBeDefined();
    expect(twoInch!.max_length_ft).toBe(5);
  });

  it("upsizes stack for tall buildings with high FU", () => {
    const result = designDrainage({
      total_fu: 80, building_drain_size: "4", total_run_ft: 100,
      direction_changes: 0, stories: 4, code: "ipc-2021",
    });
    expect(result.warnings.some((w) => w.includes("6"))).toBe(true);
  });
});
