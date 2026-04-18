/**
 * Sensor Source Types
 *
 * Defines the sensor source identifiers used for confidence scoring
 * in the FLUM orchestration layer.
 *
 * The full sensor adapter interface (SensorAdapter, WebSensorAdapter, etc.)
 * will be restored when native sensor integration is implemented.
 */

export type SensorSource =
  | "manual_entry"
  | "camera"
  | "lidar"
  | "gyroscope"
  | "barometer"
  | "gps"
  | "microphone";
