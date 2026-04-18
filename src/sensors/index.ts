/**
 * Sensor Abstraction Layer
 *
 * Provides a unified interface for phone sensors (camera, LiDAR, gyro,
 * barometer, GPS). In the web app, these return mock data with confidence
 * scores. When deployed as a native app (PWA with sensor APIs or React
 * Native), real sensor data flows through the same interfaces.
 *
 * FLUM Standard 000 §3.5: The server does the thinking.
 * Sensor data is INPUT — the calculation engines are deterministic
 * and don't care whether the input came from a human, a sensor, or a mock.
 */

// ---------------------------------------------------------------------------
// Sensor Reading Type
// ---------------------------------------------------------------------------

export interface SensorReading<T = number> {
  /** The measured value. */
  value: T;
  /** Unit of measurement. */
  unit: string;
  /** Confidence level 0-1. 1 = certain, <0.95 requires human confirmation. */
  confidence: number;
  /** Which sensor provided this reading. */
  source: SensorSource;
  /** Timestamp of the reading. */
  timestamp: string;
  /** Raw sensor data for verification. */
  raw?: unknown;
}

export type SensorSource =
  | "manual_entry"
  | "camera"
  | "lidar"
  | "gyroscope"
  | "barometer"
  | "gps"
  | "microphone";

// ---------------------------------------------------------------------------
// Camera Perception Result
// ---------------------------------------------------------------------------

export interface PerceptionResult {
  /** What the camera identified. */
  label: string;
  /** Confidence in the identification (0-1). */
  confidence: number;
  /** Extracted text (from gauges, nameplates, labels). */
  extractedText?: string;
  /** Numerical values extracted from the image. */
  extractedValues?: Record<string, number>;
  /** Bounding boxes of identified objects. */
  regions?: {
    label: string;
    confidence: number;
    bounds: { x: number; y: number; width: number; height: number };
  }[];
}

// ---------------------------------------------------------------------------
// Sensor Interface (implemented per platform)
// ---------------------------------------------------------------------------

export interface SensorAdapter {
  /** Measure distance between two points using LiDAR. */
  measureDistance(from: string, to: string): Promise<SensorReading<number>>;

  /** Measure slope angle using gyroscope. */
  measureSlope(): Promise<SensorReading<number>>;

  /** Measure elevation using barometer. */
  measureElevation(): Promise<SensorReading<number>>;

  /** Get current GPS location for jurisdiction lookup. */
  getLocation(): Promise<SensorReading<{ lat: number; lng: number; address?: string }>>;

  /** Capture a photo and run LLM perception. */
  perceive(imageUri?: string): Promise<PerceptionResult>;

  /** Read a gauge/label from camera. */
  readGauge(type: "pressure" | "temperature" | "flow"): Promise<SensorReading<number>>;
}

// ---------------------------------------------------------------------------
// Web Sensor Adapter (Mock for PWA — returns manual-entry data with confidence 0.7)
// ---------------------------------------------------------------------------

/**
 * Web implementation that prompts for manual entry with sensor-like
 * confidence scoring. When deployed as a native app, this gets replaced
 * with real sensor calls.
 */
export class WebSensorAdapter implements SensorAdapter {
  async measureDistance(_from: string, _to: string): Promise<SensorReading<number>> {
    // In web mode, distance comes from manual entry.
    // Real LiDAR would provide this automatically.
    return {
      value: 0,
      unit: "ft",
      confidence: 0.7, // Manual entry — moderate confidence
      source: "manual_entry",
      timestamp: new Date().toISOString(),
    };
  }

  async measureSlope(): Promise<SensorReading<number>> {
    return {
      value: 0,
      unit: "%",
      confidence: 0.7,
      source: "manual_entry",
      timestamp: new Date().toISOString(),
    };
  }

  async measureElevation(): Promise<SensorReading<number>> {
    return {
      value: 0,
      unit: "ft",
      confidence: 0.7,
      source: "manual_entry",
      timestamp: new Date().toISOString(),
    };
  }

  async getLocation(): Promise<SensorReading<{ lat: number; lng: number; address?: string }>> {
    // Web geolocation API could be used here:
    // navigator.geolocation.getCurrentPosition(...)
    // For now, return empty with a nudge to use GPS
    return {
      value: { lat: 0, lng: 0 },
      unit: "degrees",
      confidence: 0.3,
      source: "gps",
      timestamp: new Date().toISOString(),
      raw: { hint: "Enable location services for automatic jurisdiction detection" },
    };
  }

  async perceive(_imageUri?: string): Promise<PerceptionResult> {
    // Camera perception requires native integration.
    // Web version returns empty with a nudge to upload a photo.
    return {
      label: "camera_not_available",
      confidence: 0,
      extractedText: undefined,
      extractedValues: undefined,
    };
  }

  async readGauge(_type: "pressure" | "temperature" | "flow"): Promise<SensorReading<number>> {
    return {
      value: 0,
      unit: "psi",
      confidence: 0.7,
      source: "manual_entry",
      timestamp: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Unified Sensor Access (single entry point per FLUM §3.1)
// ---------------------------------------------------------------------------

let adapterInstance: SensorAdapter | null = null;

/**
 * Get the sensor adapter. In web mode, returns WebSensorAdapter.
 * In native mode (future), returns NativeSensorAdapter.
 */
export function getSensorAdapter(): SensorAdapter {
  if (!adapterInstance) {
    adapterInstance = new WebSensorAdapter();
  }
  return adapterInstance;
}

/**
 * Replace the sensor adapter (for native apps or testing).
 */
export function setSensorAdapter(adapter: SensorAdapter): void {
  adapterInstance = adapter;
}