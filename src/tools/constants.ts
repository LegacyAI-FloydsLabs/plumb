/**
 * Shared plumbing engineering constants.
 *
 * Single source of truth for values used across multiple calc engines.
 * All values sourced from IPC 2021 / UPC 2021.
 */

// ---------------------------------------------------------------------------
// Pressure
// ---------------------------------------------------------------------------

/** PSI gain/loss per vertical foot of water column */
export const PSI_PER_FOOT_ELEVATION = 0.433;

/** Minimum residual pressure at the farthest fixture (IPC §608.3) */
export const MIN_RESIDUAL_PRESSURE_PSI = 20;

// ---------------------------------------------------------------------------
// Velocity (water supply)
// ---------------------------------------------------------------------------

/** Minimum acceptable velocity in ft/s (prevents stagnation) */
export const MIN_VELOCITY_FPS = 2;

/** Maximum acceptable velocity in ft/s (prevents erosion/noise) */
export const MAX_VELOCITY_FPS = 8;

// ---------------------------------------------------------------------------
// Hazen-Williams (hydraulic analysis)
// ---------------------------------------------------------------------------

/** Hazen-Williams formula constant */
export const HW_CONSTANT = 4.52;

/** GPM to ft/s conversion factor for circular pipes */
export const GPM_TO_FPS_FACTOR = 0.3208;

// ---------------------------------------------------------------------------
// Fitting equivalent length
// ---------------------------------------------------------------------------

/** Rough equivalent length per fitting (ft) — simplified field estimate */
export const EQUIV_LENGTH_PER_FITTING_FT = 5;

// ---------------------------------------------------------------------------
// Slope (minimum grades per IPC §704.1)
// ---------------------------------------------------------------------------

/** Minimum slope for 4" pipe: 1/4" per foot as percentage */
export const MIN_SLOPE_4IN_PCT = 2.083;

/** Minimum slope for 6"+ pipe: 1/8" per foot as percentage */
export const MIN_SLOPE_6IN_PCT = 1.042;
