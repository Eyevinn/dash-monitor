/**
 * Standardized error messages for DASH Monitor
 * Centralizes all error message templates for consistency
 */

export const ErrorMessages = {
  // Fetch errors
  FETCH_HTTP_ERROR: (status: number, statusText: string) => `HTTP ${status}: ${statusText}`,
  FETCH_NETWORK_ERROR: (url: string, message: string) =>
    `Network error fetching ${url}: ${message}`,
  FETCH_TIMEOUT: (url: string, timeout: number) => `Request timeout after ${timeout}ms for ${url}`,
  FETCH_UNKNOWN: (message: string) => `Unknown fetch error: ${message}`,

  // Parse errors
  PARSE_INVALID_XML: () => 'Invalid XML: manifest does not start with XML declaration or MPD tag',
  PARSE_XML_MALFORMED: (message: string) => `Malformed XML: ${message}`,
  PARSE_FAILED: (message: string) => `Failed to parse MPD: ${message}`,

  // MPD structure errors
  STRUCTURE_MISSING_TYPE: () => 'Missing required MPD type attribute (static or dynamic)',
  STRUCTURE_MISSING_DURATION: () =>
    'Static MPD missing required mediaPresentationDuration attribute',
  STRUCTURE_NO_PERIODS: () => 'MPD has no periods defined',
  STRUCTURE_INVALID_TYPE: (type: string) =>
    `Invalid MPD type "${type}" (must be "static" or "dynamic")`,
  STRUCTURE_MISSING_MINIMUM_UPDATE_PERIOD: () =>
    'Dynamic MPD missing minimumUpdatePeriod attribute',

  // Period continuity errors
  PERIOD_START_BACKWARDS: (
    currentIndex: number,
    prevIndex: number,
    currentStart: number,
    prevStart: number
  ) =>
    `Period ${currentIndex} starts at ${currentStart}s, before period ${prevIndex} which starts at ${prevStart}s`,
  PERIOD_GAP_DETECTED: (currentIndex: number, prevIndex: number, gapDuration: number) =>
    `Gap of ${gapDuration}s detected between period ${prevIndex} and period ${currentIndex}`,
  PERIOD_OVERLAP_DETECTED: (currentIndex: number, prevIndex: number, overlapDuration: number) =>
    `Overlap of ${overlapDuration}s detected between period ${prevIndex} and period ${currentIndex}`,

  // Stale manifest errors
  STALE_NO_UPDATE: (elapsedMs: number, lastPublishTime?: number) =>
    lastPublishTime
      ? `Manifest has not updated in ${elapsedMs}ms (publishTime unchanged: ${lastPublishTime})`
      : `Manifest has not updated in ${elapsedMs}ms`,
  STALE_NO_NEW_SEGMENTS: (elapsedMs: number) => `No new segments added in ${elapsedMs}ms`,

  // Publish time errors
  PUBLISH_TIME_BACKWARDS: (lastTime: number, currentTime: number, diff: number) =>
    `Publish time went backwards by ${diff}s (${lastTime} -> ${currentTime})`,
  PUBLISH_TIME_MISSING: () => 'Dynamic MPD missing publishTime attribute',

  // Segment timeline errors
  SEGMENT_TIMELINE_GAP: (
    segmentIndex: number,
    expectedTime: number,
    actualTime: number,
    gap: number
  ) =>
    `Segment timeline gap detected at segment ${segmentIndex}: expected ${expectedTime}s, got ${actualTime}s (gap: ${gap}s)`,
  SEGMENT_TIMELINE_OVERLAP: (
    segmentIndex: number,
    expectedTime: number,
    actualTime: number,
    overlap: number
  ) =>
    `Segment timeline overlap detected at segment ${segmentIndex}: expected ${expectedTime}s, got ${actualTime}s (overlap: ${overlap}s)`,
  SEGMENT_DURATION_MISMATCH: (segmentIndex: number, expected: number, actual: number) =>
    `Segment ${segmentIndex} duration mismatch: expected ${expected}s, got ${actual}s`,
  SEGMENT_MISSING_DURATION: (segmentIndex: number) =>
    `Segment ${segmentIndex} missing duration attribute`,
  SEGMENT_DISCONTINUITY_INVALID: (segmentIndex: number) =>
    `Invalid discontinuity at segment ${segmentIndex}`,

  // Segment availability errors
  SEGMENT_NOT_AVAILABLE: (segmentUrl: string, statusCode: number) =>
    `Segment not available: ${segmentUrl} (HTTP ${statusCode})`,
  SEGMENT_CHECK_FAILED: (segmentUrl: string, message: string) =>
    `Failed to check segment availability for ${segmentUrl}: ${message}`,
  SEGMENT_TOO_MANY_UNAVAILABLE: (
    unavailableCount: number,
    totalCount: number,
    percentage: number
  ) =>
    `Too many segments unavailable: ${unavailableCount}/${totalCount} (${percentage.toFixed(1)}%)`,

  // Codec/Quality validation errors
  CODEC_INVALID: (codec: string, reason: string) => `Invalid codec "${codec}": ${reason}`,
  CODEC_MISSING: (representationId: string) =>
    `Representation ${representationId} missing codec information`,
  BITRATE_INVALID: (bitrate: number, min: number, max: number) =>
    `Invalid bitrate ${bitrate}bps (expected between ${min}-${max}bps)`,
  BITRATE_MISSING: (representationId: string) =>
    `Representation ${representationId} missing bitrate information`,
  RESOLUTION_INVALID: (width: number, height: number, reason: string) =>
    `Invalid resolution ${width}x${height}: ${reason}`,

  // General validation errors
  VALIDATION_FAILED: (reason: string) => `Validation failed: ${reason}`,
  CONFIGURATION_INVALID: (param: string, reason: string) =>
    `Invalid configuration for ${param}: ${reason}`,
} as const;

/**
 * Helper to format time in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Helper to format bytes in human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${(bytes / 1073741824).toFixed(1)}GB`;
}

/**
 * Helper to format bitrate in human-readable format
 */
export function formatBitrate(bps: number): string {
  if (bps < 1000) return `${bps}bps`;
  if (bps < 1000000) return `${(bps / 1000).toFixed(1)}Kbps`;
  return `${(bps / 1000000).toFixed(1)}Mbps`;
}
