import { describe, expect, it } from "vitest";
import {
  classifySlope,
  computeSegment,
  computeSurvey,
  slopePctToInPerFt,
  validate,
} from "../calc";
import type { Station, Survey } from "../types";

function station(
  label: number,
  distance: number,
  rodReading: number,
  depth: number,
): Station {
  return { id: `s${label}`, label, distance, rodReading, depth };
}

function survey(stations: Station[]): Survey {
  return {
    units: "imperial",
    jobId: "TEST",
    completedAt: "2026-04-17T00:00:00Z",
    stations,
  };
}

describe("slopePctToInPerFt", () => {
  it("converts 2.083% to 0.25 in/ft (1/4\" per foot)", () => {
    expect(slopePctToInPerFt(2.083)).toBeCloseTo(0.25, 3);
  });

  it("returns 0 for 0%", () => {
    expect(slopePctToInPerFt(0)).toBe(0);
  });

  it("preserves sign for negative slopes", () => {
    expect(slopePctToInPerFt(-1)).toBeCloseTo(-0.12, 2);
  });
});

describe("computeSegment", () => {
  it("computes 2% drop with rising rod reading and constant depth", () => {
    // Station at 0ft: rod=5.00, depth=4.00 -> invert = HI - 9.00
    // Station at 50ft: rod=6.00, depth=4.00 -> invert = HI - 10.00
    // drop = 1.00 ft over 50 ft run = 2% slope
    const seg = computeSegment(
      station(1, 0, 5.0, 4.0),
      station(2, 50, 6.0, 4.0),
    );
    expect(seg.drop).toBeCloseTo(1.0, 6);
    expect(seg.run).toBe(50);
    expect(seg.slopePct).toBeCloseTo(2.0, 6);
    expect(seg.isBelly).toBe(false);
  });

  it("flags belly when downstream invert is higher than upstream", () => {
    const seg = computeSegment(
      station(1, 0, 6.0, 4.0),
      station(2, 30, 5.0, 4.0),
    );
    expect(seg.drop).toBeCloseTo(-1.0, 6);
    expect(seg.slopePct).toBeLessThan(0);
    expect(seg.isBelly).toBe(true);
  });

  it("treats zero run as zero slope, not infinity", () => {
    const seg = computeSegment(
      station(1, 10, 5.0, 4.0),
      station(2, 10, 6.0, 5.0),
    );
    expect(seg.slopePct).toBe(0);
  });

  it("accumulates rod and depth changes correctly", () => {
    // rod: 4 -> 6 (+2), depth: 3 -> 4 (+1) => drop = 3 over 100 = 3%
    const seg = computeSegment(
      station(1, 0, 4.0, 3.0),
      station(2, 100, 6.0, 4.0),
    );
    expect(seg.drop).toBeCloseTo(3.0, 6);
    expect(seg.slopePct).toBeCloseTo(3.0, 6);
  });
});

describe("validate", () => {
  it("requires at least two stations", () => {
    const issues = validate(survey([station(1, 0, 5, 4)]));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/two stations/i);
  });

  it("rejects non-monotonic distances", () => {
    const issues = validate(
      survey([station(1, 0, 5, 4), station(2, 0, 5.5, 4)]),
    );
    expect(issues.some((i) => i.includes("must be greater"))).toBe(true);
  });

  it("rejects negative depth", () => {
    const issues = validate(
      survey([station(1, 0, 5, 4), station(2, 30, 6, -1)]),
    );
    expect(issues.some((i) => i.includes("depth cannot be negative"))).toBe(true);
  });

  it("returns empty list for a valid survey", () => {
    const issues = validate(
      survey([station(1, 0, 5, 4), station(2, 30, 5.6, 4)]),
    );
    expect(issues).toEqual([]);
  });
});

describe("computeSurvey", () => {
  it("computes overall slope across multiple stations", () => {
    // 3 stations, 100 ft total, 2 ft total drop => 2% overall
    const result = computeSurvey(
      survey([
        station(1, 0, 5.0, 4.0),
        station(2, 50, 6.0, 4.0),
        station(3, 100, 7.0, 4.0),
      ]),
    );
    expect(result.overallSlopePct).toBeCloseTo(2.0, 6);
    expect(result.segments).toHaveLength(2);
    expect(result.bellyCount).toBe(0);
    expect(result.verdict.kind).toBe("marginal");
  });

  it("identifies a belly even when overall slope is positive", () => {
    // Run goes down, then up, then down. Net positive but with a belly.
    const result = computeSurvey(
      survey([
        station(1, 0, 5.0, 4.0),  // invert 0
        station(2, 30, 6.0, 4.0), // invert -1 (down 1)
        station(3, 60, 5.0, 4.0), // invert  0 (back up 1) -> belly segment
        station(4, 100, 7.0, 4.0), // invert -2 (down 2)
      ]),
    );
    expect(result.bellyCount).toBe(1);
    expect(result.overallSlopePct).toBeCloseTo(2.0, 6);
    expect(result.segments[1].isBelly).toBe(true);
  });

  it("invert profile starts at 0 for station 1 and decreases for downhill", () => {
    const result = computeSurvey(
      survey([
        station(1, 0, 5.0, 4.0),
        station(2, 50, 6.0, 4.0),
      ]),
    );
    expect(result.invertProfile[0].invert).toBe(0);
    expect(result.invertProfile[1].invert).toBeLessThan(0);
  });

  it("returns indeterminate verdict and surfaces issues for invalid input", () => {
    const result = computeSurvey(survey([station(1, 0, 5, 4)]));
    expect(result.verdict.kind).toBe("indeterminate");
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe("classifySlope", () => {
  it("flags <50% of code minimum as below_minimum (4\")", () => {
    const v = classifySlope(0.5, { pipeDiameterIn: 4 });
    expect(v.kind).toBe("below_minimum");
  });

  it("flags 50-100% of code minimum as marginal (4\")", () => {
    const v = classifySlope(1.5, { pipeDiameterIn: 4 });
    expect(v.kind).toBe("marginal");
  });

  it("flags >=code minimum as code_compliant (4\")", () => {
    const v = classifySlope(2.5, { pipeDiameterIn: 4 });
    expect(v.kind).toBe("code_compliant");
  });

  it("uses 6\" thresholds when specified", () => {
    // 1.04% min for 6"
    expect(classifySlope(1.5, { pipeDiameterIn: 6 }).kind).toBe("code_compliant");
    expect(classifySlope(0.7, { pipeDiameterIn: 6 }).kind).toBe("marginal");
  });
});
