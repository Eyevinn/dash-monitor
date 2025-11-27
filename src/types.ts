/**
 * Types and interfaces for DASH Stream Monitor
 */

/**
 * Custom error class for MPD parsing errors
 */
export class MPDParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MPDParseError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MPDParseError);
    }
  }
}

/**
 * Custom error class for MPD fetch errors
 */
export class MPDFetchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MPDFetchError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MPDFetchError);
    }
  }
}

/**
 * Interface for mpd-parser output structure
 * Based on mpd-parser library which converts DASH MPD to HLS-like structure
 */
export interface MPDParserOutput {
  allowCache?: boolean;
  endList?: boolean;
  mediaSequence?: number;
  discontinuitySequence?: number;
  playlistType?: string;
  targetDuration?: number;
  totalDuration?: number;
  duration?: number;
  playlists?: Playlist[];
  mediaGroups?: MediaGroups;
  segments?: Segment[];
  discontinuityStarts?: number[];
  dateTimeString?: string;
  dateTimeObject?: Date;
  contentSteering?: ContentSteering;
  [key: string]: any;
}

export interface Playlist {
  attributes?: {
    BANDWIDTH?: number;
    CODECS?: string;
    'PROGRAM-ID'?: number;
    RESOLUTION?: {
      width: number;
      height: number;
    };
    [key: string]: unknown;
  };
  endList?: boolean;
  uri?: string;
  timeline?: number;
  resolvedUri?: string;
  targetDuration?: number;
  discontinuitySequence?: number;
  discontinuityStarts?: number[];
  timelineStarts?: TimelineStart[];
  mediaSequence?: number;
  segments?: Segment[];
  [key: string]: unknown;
}

export interface TimelineStart {
  start?: number;
  end?: number;
  [key: string]: unknown;
}

export interface Segment {
  duration?: number;
  timeline?: number;
  uri?: string;
  resolvedUri?: string;
  map?: {
    uri?: string;
    resolvedUri?: string;
  };
  number?: number;
  presentationTime?: number;
  dateTimeObject?: Date;
  dateTimeString?: string;
  [key: string]: unknown;
}

export interface MediaGroups {
  AUDIO?: { [groupId: string]: { [label: string]: any } };
  VIDEO?: { [groupId: string]: { [label: string]: any } };
  'CLOSED-CAPTIONS'?: { [groupId: string]: { [label: string]: any } };
  SUBTITLES?: { [groupId: string]: { [label: string]: any } };
}

export interface ContentSteering {
  defaultServiceLocation?: string;
  proxyServerURL?: string;
  queryBeforeStart?: boolean;
  serverURL?: string;
}

export enum State {
  IDLE = 'idle',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum MediaType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  SUBTITLE = 'SUBTITLE',
  MASTER = 'MASTER',
}

export enum ErrorType {
  MANIFEST_FETCH_ERROR = 'MANIFEST_FETCH_ERROR',
  XML_PARSE_ERROR = 'XML_PARSE_ERROR',
  MPD_STRUCTURE_ERROR = 'MPD_STRUCTURE_ERROR',
  PERIOD_CONTINUITY_ERROR = 'PERIOD_CONTINUITY_ERROR',
  SEGMENT_TIMELINE_ERROR = 'SEGMENT_TIMELINE_ERROR',
  STALE_MANIFEST = 'STALE_MANIFEST',
  PUBLISH_TIME_ERROR = 'PUBLISH_TIME_ERROR',
  SEGMENT_AVAILABILITY_ERROR = 'SEGMENT_AVAILABILITY_ERROR',
  PERIOD_TRANSITION_ERROR = 'PERIOD_TRANSITION_ERROR',
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
  lastMPD?: ParsedMPD;
}

export interface MonitorOptions {
  staleLimit?: number; // Milliseconds before manifest considered stale (default: 6000)
  monitorInterval?: number; // Milliseconds between checks (default: 3000)
  errorLimit?: number; // Maximum errors to store per stream (default: 10)
  logConsole?: boolean; // Enable console logging (default: true)
  enableSegmentAvailabilityCheck?: boolean; // Enable segment availability validation (default: false)
  segmentCheckSampleSize?: number; // Number of segments to check for availability (default: 3)
}

export interface MonitorInfo {
  monitorId: string;
  state: State;
  createdAt: number;
  streamCount: number;
}

export interface ParsedMPD {
  // Playlists (equivalent to MPD periods/representations)
  playlists?: any[];

  // MPD properties used for validation
  type?: string; // 'static' or 'dynamic'
  mediaPresentationDuration?: number;
  publishTime?: number;
  periods?: any[];

  [key: string]: any;
}
