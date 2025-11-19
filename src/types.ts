/**
 * Types and interfaces for DASH Stream Monitor
 */

export enum State {
  IDLE = "idle",
  ACTIVE = "active",
  INACTIVE = "inactive"
}

export enum MediaType {
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  SUBTITLE = "SUBTITLE",
  MASTER = "MASTER"
}

export enum ErrorType {
  MANIFEST_FETCH_ERROR = "MANIFEST_FETCH_ERROR",
  XML_PARSE_ERROR = "XML_PARSE_ERROR",
  MPD_STRUCTURE_ERROR = "MPD_STRUCTURE_ERROR",
  PERIOD_CONTINUITY_ERROR = "PERIOD_CONTINUITY_ERROR",
  SEGMENT_TIMELINE_ERROR = "SEGMENT_TIMELINE_ERROR",
  STALE_MANIFEST = "STALE_MANIFEST",
  PUBLISH_TIME_ERROR = "PUBLISH_TIME_ERROR",
  SEGMENT_AVAILABILITY_ERROR = "SEGMENT_AVAILABILITY_ERROR"
}

export interface StreamInput {
  url: string;
  id?: string;
}

export interface StreamItem {
  url: string;
  id: string;
}

export interface MonitorError {
  id: string;
  timestamp: string;
  errorType: ErrorType;
  mediaType: MediaType;
  bitrate?: number;
  description: string;
  streamUrl: string;
  streamId: string;
  httpStatusCode?: number;
}

export interface ManifestFetchError {
  statusCode: number;
  timestamp: number;
}

export interface VariantData {
  bandwidth?: number;
  codecs?: string;
  mimeType?: string;
  lastPublishTime?: number;
  lastSegmentNumber?: number;
  segmentCount?: number;
  errors: MonitorError[];
}

export interface StreamData {
  variants: Map<string, VariantData>;
  lastChecked: number;
  lastMPD?: any;
}

export interface MonitorOptions {
  staleLimit?: number;      // Milliseconds before manifest considered stale (default: 6000)
  monitorInterval?: number;  // Milliseconds between checks (default: 3000)
  errorLimit?: number;       // Maximum errors to store per stream (default: 10)
  logConsole?: boolean;      // Enable console logging (default: true)
}

export interface MonitorInfo {
  monitorId: string;
  state: State;
  createdAt: number;
  streamCount: number;
}

export interface ParsedMPD {
  type?: string;  // 'static' or 'dynamic'
  mediaPresentationDuration?: number;
  minimumUpdatePeriod?: number;
  publishTime?: number;
  availabilityStartTime?: number;
  timeShiftBufferDepth?: number;
  suggestedPresentationDelay?: number;
  periods?: any[];
  [key: string]: any;
}
