/**
 * Pure slope-calculation functions for the sonde-and-grade survey method.
 *
 * NO React, NO DOM, NO I/O. Everything here is deterministic and unit-tested.
 *
 * Method (per supplemental report PSI-20260417-001):
 *   ground_elev(N) = HI - rod(N)
 *   invert_elev(N) = ground_elev(N) - depth(N) = HI - rod(N) - depth(N)
 *   drop(a -> b)   = invert(a) - invert(b)
 *                  = (rod(b) - rod(a)) + (depth(b) - depth(a))
 *   slope%         = (drop / run) * 100
 *
 * Sign convention: positive slope means the downstream invert is lower than
 * the upstream invert (i.e., gravity pulls water from a to b — what you want).
 * Negative slope flags a belly.
 */

import type {
  Segment,
  SlopeVerdict,
  Station,
  Survey,
  SurveyResult,
  Units,
} from "./types";

/** Code-minimum slope thresholds expressed as percent. */
const CODE_MIN_PCT_BY_DIAMETER_IN = {
  4: 2.083, // 1/4" per foot
  6: 1.042, // 1/8" per foot
} as const;

export interface CalcOptions {
  /** Nominal pipe inside diameter in inches (4 or 6 typical). */
  pipeDiameterIn?: 4 | 6;
}

/** Convert a percent slope to inches per foot (imperial display). */
export function slopePctToInPerFt(pct: number): number {
  return (pct / 100) * 12;
}

/**
 * Compute the segment slope between two adjacent stations.
 * Caller is responsible for passing them in upstream -> downstream order.
 */
export function computeSegment(
  upstream: Station,
  downstream: Station,
): Segment {
  const drop =
    (downstream.rodReading - upstream.rodReading) +
    (downstream.depth - upstream.depth);
  const run = downstream.distance - upstream.distance;
  const slopePct = run > 0 ? (drop / run) * 100 : 0;
  return {
    fromLabel: upstream.label,
    toLabel: downstream.label,
    drop,
    run,
    slopePct,
    slopeInPerFt: slopePctToInPerFt(slopePct),
    isBelly: drop < 0,
  };
}

/**
 * Validate a survey before computing. Returns a list of human-readable
 * issues. An empty list means the survey is computable.
 */
export function validate(survey: Survey): string[] {
  const issues: string[] = [];
  if (survey.stations.length < 2) {
    issues.push(
      "At least two stations are required to compute a slope.",
    );
  }
  const distances = survey.stations.map((s) => s.distance);
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] <= distances[i - 1]) {
      issues.push(
        `Station ${survey.stations[i].label} distance (${distances[i]}) ` +
          `must be greater than station ${survey.stations[i - 1].label} ` +
          `distance (${distances[i - 1]}).`,
      );
    }
  }
  for (const s of survey.stations) {
    if (Number.isNaN(s.rodReading) || Number.isNaN(s.depth)) {
      issues.push(`Station ${s.label}: rod and depth must be numbers.`);
    }
    if (s.depth < 0) {
      issues.push(`Station ${s.label}: depth cannot be negative.`);
    }
  }
  return issues;
}

/** Compute the full survey result. Safe to call on invalid surveys. */
export function computeSurvey(
  survey: Survey,
  opts: CalcOptions = {},
): SurveyResult {
  const issues = validate(survey);
  if (issues.length > 0) {
    return emptyResult(issues);
  }

  const segments: Segment[] = [];
  for (let i = 1; i < survey.stations.length; i++) {
    segments.push(computeSegment(survey.stations[i - 1], survey.stations[i]));
  }

  const ref = survey.stations[0];
  // Pipe invert relative to station 1 (which is fixed at 0).
  // Derivation:
  //   invert(N) = HI - rod(N) - depth(N)
  //   invert(N) - invert(1) = (rod(1) - rod(N)) + (depth(1) - depth(N))
  // Negative result => N is below station 1 => downstream-correct flow direction.
  const invertProfile = survey.stations.map((s) => ({
    label: s.label,
    distance: s.distance,
    invert: (ref.rodReading - s.rodReading) + (ref.depth - s.depth),
  }));

  const first = survey.stations[0];
  const last = survey.stations[survey.stations.length - 1];
  const overall = computeSegment(first, last);

  const bellies = segments.filter((s) => s.isBelly);
  const bellyRunTotal = bellies.reduce((acc, s) => acc + s.run, 0);

  const verdict = classifySlope(overall.slopePct, opts);

  return {
    segments,
    invertProfile,
    overallSlopePct: overall.slopePct,
    overallSlopeInPerFt: overall.slopeInPerFt,
    bellyCount: bellies.length,
    bellyRunTotal,
    verdict,
    issues: [],
  };
}

function emptyResult(issues: string[]): SurveyResult {
  return {
    segments: [],
    invertProfile: [],
    overallSlopePct: 0,
    overallSlopeInPerFt: 0,
    bellyCount: 0,
    bellyRunTotal: 0,
    verdict: { kind: "indeterminate", reason: issues[0] ?? "no data" },
    issues,
  };
}

/**
 * Map a numeric overall slope to a code-comparison verdict.
 * Defaults to 4" lateral thresholds when pipe diameter is unspecified.
 */
export function classifySlope(
  pct: number,
  opts: CalcOptions = {},
): SlopeVerdict {
  const dia = opts.pipeDiameterIn ?? 4;
  const minPct = CODE_MIN_PCT_BY_DIAMETER_IN[dia];
  if (pct >= minPct) return { kind: "code_compliant", minPct };
  if (pct >= minPct * 0.5) return { kind: "marginal", minPct };
  return { kind: "below_minimum", minPct };
}

/** Convenience: human label for the unit shown in the UI. */
export function unitShort(units: Units): { distance: string; depth: string } {
  return units === "imperial"
    ? { distance: "ft", depth: "ft" }
    : { distance: "m", depth: "m" };
}
