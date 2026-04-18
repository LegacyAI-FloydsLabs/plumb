/**
 * Domain types for the sonde-and-grade slope module.
 *
 * Units: All linear measurements are stored as numeric values in the unit
 * declared by `Survey.units`. Mixing units within a single Survey is not
 * supported by design — convert at input time.
 */

export type Units = "imperial" | "metric";

/** A single field measurement station along the lateral. */
export interface Station {
  /** Stable id for React keys / persistence. */
  id: string;
  /** Sequence label shown to the technician (1-based, monotonic). */
  label: number;
  /**
   * Cumulative distance from the access point (cleanout) along the pipe.
   * Imperial: feet. Metric: meters.
   */
  distance: number;
  /**
   * Laser-level rod reading at the surface mark above this station.
   * Higher number = ground is lower beneath the laser plane.
   * Imperial: feet (decimal). Metric: meters.
   */
  rodReading: number;
  /**
   * Locator depth-to-sonde reading at this station.
   * Imperial: feet (decimal). Metric: meters.
   */
  depth: number;
  /** Optional free-text note from the technician. */
  note?: string;
}

/** Complete survey collected on site. */
export interface Survey {
  units: Units;
  /** Job/site identifier — typically the original PSI report id. */
  jobId: string;
  /** ISO 8601 timestamp the survey was completed. */
  completedAt: string;
  stations: Station[];
}

/** A computed slope between two adjacent stations. */
export interface Segment {
  fromLabel: number;
  toLabel: number;
  /** Pipe drop from upstream to downstream station, in survey units. */
  drop: number;
  /** Horizontal pipe distance between the two stations, in survey units. */
  run: number;
  /** Slope as a percentage. Positive = downstream is lower (good). */
  slopePct: number;
  /** Slope in inches per foot (always imperial, regardless of survey units). */
  slopeInPerFt: number;
  /** True if drop is negative — water would pool against this segment. */
  isBelly: boolean;
}

/** Aggregate result over the entire survey. */
export interface SurveyResult {
  segments: Segment[];
  /** Pipe invert elevations (relative to station 1 = 0), in survey units. */
  invertProfile: { label: number; distance: number; invert: number }[];
  /** Overall slope from first to last station. */
  overallSlopePct: number;
  overallSlopeInPerFt: number;
  /** Belly count and total negative-drop length. */
  bellyCount: number;
  bellyRunTotal: number;
  /** Code-comparison verdict for the overall slope. */
  verdict: SlopeVerdict;
  /** Validation issues that prevent a clean result. Empty when survey is OK. */
  issues: string[];
}

export type SlopeVerdict =
  | { kind: "below_minimum"; minPct: number }
  | { kind: "marginal"; minPct: number }
  | { kind: "code_compliant"; minPct: number }
  | { kind: "indeterminate"; reason: string };
