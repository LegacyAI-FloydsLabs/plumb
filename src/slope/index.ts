/**
 * PSI Slope Calculator — public module surface.
 *
 * The host application (PWA, Next.js space, etc.) should import from this
 * file only. Anything not re-exported here is considered private.
 */

export { SlopeCalculator } from "./SlopeCalculator";
export type { SlopeCalculatorProps, ExportPayload } from "./SlopeCalculator";

export {
  classifySlope,
  computeSegment,
  computeSurvey,
  slopePctToInPerFt,
  unitShort,
  validate,
} from "./calc";

export type {
  Segment,
  SlopeVerdict,
  Station,
  Survey,
  SurveyResult,
  Units,
} from "./types";
