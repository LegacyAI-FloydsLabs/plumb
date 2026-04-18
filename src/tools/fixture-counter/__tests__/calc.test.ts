import { describe, it, expect } from "vitest";
import { countFixtures, FIXTURES } from "../calc";

describe("countFixtures", () => {
  it("counts a single water closet", () => {
    const result = countFixtures({
      fixtures: { water_closet_tank: 1 }, bathroom_groups: 0,
      occupancy: "private", code: "ipc-2021",
    });
    expect(result.total_dfu).toBe(3);
    expect(result.total_wsfu).toBe(2.2);
  });

  it("counts multiple fixture types", () => {
    const result = countFixtures({
      fixtures: { water_closet_tank: 1, lavatory: 1, kitchen_sink: 1 },
      bathroom_groups: 0, occupancy: "private", code: "ipc-2021",
    });
    expect(result.total_dfu).toBe(3 + 1 + 1.5);
  });

  it("applies bathroom group DFU instead of individual fixture DFU", () => {
    const withGroup = countFixtures({
      fixtures: { water_closet_tank: 1, lavatory: 1, bathtub_shower: 1 },
      bathroom_groups: 1, occupancy: "private", code: "ipc-2021",
    });
    // Bathroom group replaces individual DFU with the group rate (6 DFU per group)
    const groupLine = withGroup.breakdown.find((b) => b.fixture.includes("Bathroom Group"));
    expect(groupLine).toBeDefined();
    expect(groupLine!.dfu).toBe(6);
  });

  it("warns on unknown fixture key", () => {
    const result = countFixtures({
      fixtures: { bogus_fixture: 2 }, bathroom_groups: 0,
      occupancy: "private", code: "ipc-2021",
    });
    expect(result.warnings).toContain('Unknown fixture: "bogus_fixture" — skipped');
  });

  it("returns zero for empty input", () => {
    const result = countFixtures({
      fixtures: {}, bathroom_groups: 0,
      occupancy: "private", code: "ipc-2021",
    });
    expect(result.total_dfu).toBe(0);
    expect(result.total_wsfu).toBe(0);
  });

  it("uses public WSFU values when occupancy is public", () => {
    const priv = countFixtures({
      fixtures: { urinal_flushometer: 1 }, bathroom_groups: 0,
      occupancy: "private", code: "ipc-2021",
    });
    const pub = countFixtures({
      fixtures: { urinal_flushometer: 1 }, bathroom_groups: 0,
      occupancy: "public", code: "ipc-2021",
    });
    expect(pub.total_wsfu).toBe(1);
    expect(priv.total_wsfu).toBe(0);
  });

  it("exposes a non-empty fixture database", () => {
    expect(Object.keys(FIXTURES).length).toBeGreaterThan(10);
  });
});
