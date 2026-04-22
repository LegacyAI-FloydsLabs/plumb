/**
 * Master Plumber Integration Tests
 * 
 * Real-world scenarios from IPC (International Plumbing Code) and field practice.
 * 
 * IPC Table 704.1 - Slope of Horizontal Drainage Piping:
 *   2-1/2" or less: 1/4" per foot (2.083%)
 *   3" to 6": 1/8" per foot (1.042%)
 *   8" or larger: 1/16" per foot (0.521%)
 */

import { describe, expect, it } from "vitest";
import {
  classifySlope,
  computeSegment,
  computeSurvey,
  slopePctToInPerFt,
  validate,
} from "../calc";
import type { Station, Survey, Units } from "../types";

function station(label: number, distance: number, rodReading: number, depth: number): Station {
  return { id: `s${label}`, label, distance, rodReading, depth };
}

function survey(units: Units, stations: Station[]): Survey {
  return { units, jobId: "MASTER-TEST", completedAt: new Date().toISOString(), stations };
}

// IPC Table 704.1 Verification Tests
describe("IPC Table 704.1 - 4-inch pipe (1/4\" per foot minimum)", () => {
  it("2.083% slope = exactly minimum is code compliant", () => {
    const v = classifySlope(2.083, { pipeDiameterIn: 4 });
    expect(v.kind).toBe("code_compliant");
  });

  it("2.5% slope is code compliant", () => {
    expect(classifySlope(2.5, { pipeDiameterIn: 4 }).kind).toBe("code_compliant");
  });

  it("1.5% slope is marginal (50-100% of minimum)", () => {
    expect(classifySlope(1.5, { pipeDiameterIn: 4 }).kind).toBe("marginal");
  });

  it("1.0% slope is below minimum", () => {
    expect(classifySlope(1.0, { pipeDiameterIn: 4 }).kind).toBe("below_minimum");
  });
});

describe("IPC Table 704.1 - 6-inch pipe (1/8\" per foot minimum)", () => {
  it("1.042% slope = exactly minimum is code compliant", () => {
    expect(classifySlope(1.042, { pipeDiameterIn: 6 }).kind).toBe("code_compliant");
  });

  it("1.5% slope is code compliant", () => {
    expect(classifySlope(1.5, { pipeDiameterIn: 6 }).kind).toBe("code_compliant");
  });

  it("0.7% slope is marginal (50-100% of minimum)", () => {
    expect(classifySlope(0.7, { pipeDiameterIn: 6 }).kind).toBe("marginal");
  });

  it("0.5% slope is below minimum", () => {
    expect(classifySlope(0.5, { pipeDiameterIn: 6 }).kind).toBe("below_minimum");
  });
});

// Field Survey Scenarios
describe("Field scenario: residential building drain", () => {
  it("standard 2.5% run is code compliant for 4\" pipe", () => {
    // rod 5.0→6.25 = +1.25, depth 4.0→4.0 = 0, drop=1.25, run=50, slope=2.5%
    const result = computeSurvey(survey("imperial", [
      station(1, 0, 5.0, 4.0),
      station(2, 50, 6.25, 4.0),
    ]));
    expect(result.overallSlopePct).toBeCloseTo(2.5, 1);
    expect(result.verdict.kind).toBe("code_compliant");
  });

  it("flat run fails code", () => {
    const result = computeSurvey(survey("imperial", [
      station(1, 0, 5.0, 4.0),
      station(2, 50, 5.01, 4.0),
    ]));
    expect(result.overallSlopePct).toBeLessThan(0.1);
    expect(result.verdict.kind).toBe("below_minimum");
  });
});

describe("Field scenario: commercial 6\" sanitary main", () => {
        it("6\" main at 1.5% is code compliant", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 5.0),
                        station(2, 100, 6.5, 5.0),
                ]), { pipeDiameterIn: 6 });
                expect(result.overallSlopePct).toBeCloseTo(1.5, 1);
                expect(result.verdict.kind).toBe("code_compliant");
        });

        it("6\" main at 0.75% is marginal", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 5.0),
                        station(2, 100, 5.75, 5.0),
                ]), { pipeDiameterIn: 6 });
                expect(result.overallSlopePct).toBeCloseTo(0.75, 1);
                expect(result.verdict.kind).toBe("marginal");
        });
});

describe("Field scenario: belly detection (reverse grade)", () => {
  it("detects belly when pipe rises mid-run", () => {
    const result = computeSurvey(survey("imperial", [
      station(1, 0, 5.0, 4.0),
      station(2, 30, 6.0, 4.0),   // +1 ft drop
      station(3, 60, 5.0, 4.0),   // -1 ft (UP!) = BELLY
      station(4, 100, 7.0, 4.0),  // +2 ft drop
    ]));
    expect(result.bellyCount).toBe(1);
    expect(result.segments[1].isBelly).toBe(true);
  });

  it("flags multiple bellies", () => {
    const result = computeSurvey(survey("imperial", [
      station(1, 0, 5.0, 4.0),
      station(2, 20, 6.0, 4.0),   // +1 ft drop
      station(3, 40, 5.0, 4.0),   // -1 ft UP = BELLY 1
      station(4, 60, 6.5, 4.0),   // +1.5 ft drop
      station(5, 80, 5.5, 4.0),   // -1 ft UP = BELLY 2
      station(6, 100, 7.0, 4.0),  // +2 ft drop
    ]));
    expect(result.bellyCount).toBe(2);
  });
});

describe("Field scenario: existing installation inspection", () => {
        it("4\" line at 1% is below minimum", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 4.0),
                        station(2, 100, 6.0, 4.0),
                ]));
                expect(result.overallSlopePct).toBeCloseTo(1.0, 1);
                expect(result.verdict.kind).toBe("below_minimum");
        });

        it("6\" line at 1.5% is code compliant", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 5.0),
                        station(2, 100, 6.5, 5.0),
                ]), { pipeDiameterIn: 6 });
                expect(result.overallSlopePct).toBeCloseTo(1.5, 1);
                expect(result.verdict.kind).toBe("code_compliant");
        });
});

// Edge Cases
describe("Edge cases", () => {
  it("handles zero-length segment", () => {
    const seg = computeSegment(
      station(1, 50, 5.0, 4.0),
      station(2, 50, 6.0, 5.0),
    );
    expect(seg.run).toBe(0);
    expect(seg.slopePct).toBe(0);
  });

  it("handles zero drop (perfectly flat)", () => {
    const seg = computeSegment(
      station(1, 0, 5.0, 4.0),
      station(2, 100, 5.0, 4.0),
    );
    expect(seg.drop).toBeCloseTo(0, 6);
    expect(seg.slopePct).toBeCloseTo(0, 6);
    expect(seg.isBelly).toBe(false);
  });

  it("handles negative depth", () => {
    const issues = validate(survey("imperial", [
      station(1, 0, 5.0, 4.0),
      station(2, 30, 6.0, -1.0),
    ]));
    expect(issues.some(i => i.toLowerCase().includes("depth"))).toBe(true);
  });

  it("handles extremely steep slope", () => {
    const result = computeSurvey(survey("imperial", [
      station(1, 0, 5.0, 4.0),
      station(2, 10, 10.0, 4.0),
    ]));
    expect(result.overallSlopePct).toBeCloseTo(50, 0);
    expect(result.verdict.kind).toBe("code_compliant");
  });
});

describe("Metric support", () => {
        it("converts slopePctToInPerFt correctly", () => {
                expect(slopePctToInPerFt(2.0)).toBeCloseTo(0.24, 2);
                expect(slopePctToInPerFt(1.0)).toBeCloseTo(0.12, 2);
        });

        it("computes metric survey with rod decreasing", () => {
                const result = computeSurvey(survey("metric", [
                        { id: "s1", label: 1, distance: 0, rodReading: 1.5, depth: 1.2 },
                        { id: "s2", label: 2, distance: 30, rodReading: 0.3, depth: 1.2 },
                ]), { pipeDiameterIn: 6 });
                expect(result.segments[0].drop).toBeCloseTo(-1.2, 1);
                expect(result.overallSlopePct).toBeCloseTo(-4.0, 1);
                expect(result.verdict.kind).toBe("code_compliant");
        });
});

// Validation Rules
describe("Survey validation", () => {
  it("requires minimum 2 stations", () => {
    const issues = validate(survey("imperial", [station(1, 0, 5.0, 4.0)]));
    expect(issues.length).toBeGreaterThan(0);
  });

  it("requires monotonic increasing distances", () => {
    const issues = validate(survey("imperial", [
      station(1, 0, 5.0, 4.0),
      station(2, 30, 6.0, 4.0),
      station(3, 20, 6.5, 4.0),
    ]));
    expect(issues.some(i => i.toLowerCase().includes("greater"))).toBe(true);
  });
});

describe("MASTER PLUMBER USE CASES", () => {
        it("Verify new 4\" install meets code", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 4.0),
                        station(2, 50, 6.25, 4.0),
                ]));
                expect(result.overallSlopePct).toBeCloseTo(2.5, 1);
                expect(result.verdict.kind).toBe("code_compliant");
        });

        it("Inspect 6\" line at 1.5% (metric)", () => {
                const result = computeSurvey(survey("metric", [
                        { id: "s1", label: 1, distance: 0, rodReading: 2.0, depth: 1.5 },
                        { id: "s2", label: 2, distance: 100, rodReading: 0.5, depth: 1.5 },
                ]), { pipeDiameterIn: 6 });
                expect(result.overallSlopePct).toBeCloseTo(-1.5, 1);
                expect(result.verdict.kind).toBe("code_compliant");
        });

        it("Find belly in existing line", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 4.0),
                        station(2, 40, 6.0, 4.0),
                        station(3, 80, 5.5, 4.0),
                ]));
                expect(result.bellyCount).toBe(1);
                expect(result.segments[1].isBelly).toBe(true);
        });

        it("Reject obviously bad survey (too flat)", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 4.0),
                        station(2, 100, 5.1, 4.0),
                ]));
                expect(result.verdict.kind).toBe("below_minimum");
        });

        it("Calculate exact in/ft for inspector report", () => {
                const result = computeSurvey(survey("imperial", [
                        station(1, 0, 5.0, 4.0),
                        station(2, 48, 6.0, 4.0),
                ]));
                expect(result.overallSlopePct).toBeCloseTo(2.083, 1);
                expect(result.segments[0].slopeInPerFt).toBeCloseTo(0.25, 2);
                expect(result.verdict.kind).toBe("code_compliant");
        });
});
