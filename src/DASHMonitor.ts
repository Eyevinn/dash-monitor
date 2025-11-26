/**
 * DASH Stream Monitor
 * Monitors DASH/MPEG-DASH streams for errors and inconsistencies
 */
import { Mutex } from 'async-mutex';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { MPDLoader } from './MpdLoader';
import { ErrorsList } from './ErrorsList';
import { ErrorMessages } from './errorMessages';
import {
  State,
  MediaType,
  ErrorType,
  StreamInput,
  StreamItem,
  StreamData,
  MonitorError,
  MonitorOptions,
  ManifestFetchError,
  ParsedMPD,
  MPDParseError,
  MPDFetchError,
} from './types';

export class DASHMonitor {
  private monitorId: string;
  private state: State = State.IDLE;
  private streams: StreamItem[] = [];
  private streamData: Map<string, StreamData> = new Map();
  private errorsList: ErrorsList;
  private options: Required<MonitorOptions>;
  private createdAt: number;
  private lastChecked: number = 0;
  private mutex: Mutex = new Mutex();
  private mpdLoader: MPDLoader;

  // Error tracking
  private manifestFetchErrors: Map<string, ManifestFetchError> = new Map();
  private totalErrorsPerStream: Map<string, number> = new Map();
  private lastErrorTimePerStream: Map<string, number> = new Map();

  constructor(streamInputs: (string | StreamInput)[], options: MonitorOptions = {}) {
    this.monitorId = uuidv4();
    this.createdAt = Date.now();
    this.mpdLoader = new MPDLoader();

    // Set default options
    this.options = {
      staleLimit: options.staleLimit ?? 6000,
      monitorInterval: options.monitorInterval ?? 3000,
      errorLimit: options.errorLimit ?? 10,
      logConsole: options.logConsole ?? true,
    };

    this.errorsList = new ErrorsList(this.options.errorLimit);

    // Normalize and add streams
    this.streams = this.normalizeStreams(streamInputs);
    this.initializeStreamData();
  }

  /**
   * Normalize stream inputs to StreamItem[]
   */
  private normalizeStreams(inputs: (string | StreamInput)[]): StreamItem[] {
    const streamMap = new Map<string, string>();

    inputs.forEach((input) => {
      const url = typeof input === 'string' ? input : input.url;
      let id =
        typeof input === 'string'
          ? this.normalizeStreamId(url)
          : input.id || this.normalizeStreamId(url);

      // Handle duplicate IDs
      let finalId = id;
      let counter = 1;
      while (Array.from(streamMap.values()).includes(finalId)) {
        finalId = `${id}_${counter}`;
        counter++;
      }

      streamMap.set(url, finalId);
    });

    return Array.from(streamMap.entries()).map(([url, id]) => ({ url, id }));
  }

  /**
   * Normalize stream ID from URL
   */
  private normalizeStreamId(url: string): string {
    return url
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 50);
  }

  /**
   * Initialize stream data storage
   */
  private initializeStreamData(): void {
    this.streams.forEach((stream) => {
      this.streamData.set(stream.id, {
        variants: new Map(),
        lastChecked: 0,
      });
      this.totalErrorsPerStream.set(stream.id, 0);
    });
  }

  /**
   * Start monitoring (continuous loop)
   */
  async start(): Promise<void> {
    if (this.state === State.ACTIVE) {
      return;
    }

    this.state = State.ACTIVE;
    this.log('Monitor started');
    await this.create();
  }

  /**
   * Main monitoring loop
   */
  private async create(): Promise<void> {
    while (this.state === State.ACTIVE) {
      await this.parseMPDs();
      this.lastChecked = Date.now();
      await this.sleep(this.options.monitorInterval);
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.state = State.INACTIVE;
    this.log('Monitor stopped');
  }

  /**
   * Parse all MPD manifests and validate
   */
  private async parseMPDs(): Promise<void> {
    const release = await this.mutex.acquire();

    try {
      for (const stream of this.streams) {
        await this.checkStream(stream);
      }
    } finally {
      release();
    }
  }

  /**
   * Check a single stream
   */
  private async checkStream(stream: StreamItem): Promise<void> {
    try {
      const streamData = this.streamData.get(stream.id);
      if (!streamData) return;

      // Load MPD manifest
      const mpd = await this.mpdLoader.load(stream.url, streamData.lastMPD);

      // Clear any previous fetch errors
      if (this.manifestFetchErrors.has(stream.url)) {
        this.manifestFetchErrors.delete(stream.url);
      }

      // Validate MPD
      const errors = this.validateMPD(mpd, stream);

      // Store errors
      errors.forEach((error) => {
        this.addError(error, stream.id);
      });

      // Update stream data
      streamData.lastMPD = mpd;
      streamData.lastChecked = Date.now();
    } catch (error) {
      this.handleFetchError(error, stream);
    }
  }

  /**
   * Validate MPD manifest
   */
  private validateMPD(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];

    // 1. Check MPD structure
    errors.push(...this.validateMPDStructure(mpd, stream));

    // 2. Check for stale manifest (dynamic only)
    if (mpd.type === 'dynamic') {
      errors.push(...this.validateStaleness(mpd, stream));
    }

    // 3. Validate periods
    errors.push(...this.validatePeriods(mpd, stream));

    // 4. Validate publish time progression (dynamic only)
    if (mpd.type === 'dynamic') {
      errors.push(...this.validatePublishTime(mpd, stream));
    }

    // 5. Validate segment timeline
    errors.push(...this.validateSegmentTimeline(mpd, stream));

    // 6. Validate codec and bitrate information
    errors.push(...this.validateCodecAndBitrate(mpd, stream));

    return errors;
  }

  /**
   * Validate MPD structure
   */
  private validateMPDStructure(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];

    // Check required attributes
    if (!mpd.type) {
      errors.push(
        this.createError(
          ErrorType.MPD_STRUCTURE_ERROR,
          ErrorMessages.STRUCTURE_MISSING_TYPE(),
          stream,
          MediaType.MASTER
        )
      );
    }

    if (mpd.type === 'static' && !mpd.mediaPresentationDuration) {
      errors.push(
        this.createError(
          ErrorType.MPD_STRUCTURE_ERROR,
          ErrorMessages.STRUCTURE_MISSING_DURATION(),
          stream,
          MediaType.MASTER
        )
      );
    }

    if (!mpd.periods || mpd.periods.length === 0) {
      errors.push(
        this.createError(
          ErrorType.MPD_STRUCTURE_ERROR,
          ErrorMessages.STRUCTURE_NO_PERIODS(),
          stream,
          MediaType.MASTER
        )
      );
    }

    return errors;
  }

  /**
   * Validate manifest staleness
   */
  private validateStaleness(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];
    const streamData = this.streamData.get(stream.id);

    if (!streamData?.lastMPD) {
      return errors; // First check, no comparison possible
    }

    const lastMPD = streamData.lastMPD;
    const timeSinceLastUpdate = Date.now() - streamData.lastChecked;

    // Check if manifest has been updated
    if (lastMPD.publishTime === mpd.publishTime && timeSinceLastUpdate > this.options.staleLimit) {
      errors.push(
        this.createError(
          ErrorType.STALE_MANIFEST,
          ErrorMessages.STALE_NO_UPDATE(timeSinceLastUpdate, lastMPD.publishTime),
          stream,
          MediaType.MASTER
        )
      );
    }

    return errors;
  }

  /**
   * Validate periods
   */
  private validatePeriods(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];

    if (!mpd.periods || mpd.periods.length === 0) {
      return errors;
    }

    // Check period continuity
    for (let i = 1; i < mpd.periods.length; i++) {
      const prevPeriod = mpd.periods[i - 1];
      const currPeriod = mpd.periods[i];

      if (prevPeriod.start !== undefined && currPeriod.start !== undefined) {
        if (currPeriod.start < prevPeriod.start) {
          errors.push(
            this.createError(
              ErrorType.PERIOD_CONTINUITY_ERROR,
              ErrorMessages.PERIOD_START_BACKWARDS(i, i - 1, currPeriod.start, prevPeriod.start),
              stream,
              MediaType.MASTER
            )
          );
        }
      }
    }

    return errors;
  }

  /**
   * Validate publish time progression
   */
  private validatePublishTime(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];
    const streamData = this.streamData.get(stream.id);

    if (!streamData?.lastMPD || !streamData.lastMPD.publishTime) {
      return errors;
    }

    const lastPublishTime = streamData.lastMPD.publishTime;
    const currentPublishTime = mpd.publishTime;

    if (currentPublishTime && currentPublishTime < lastPublishTime) {
      const diff = lastPublishTime - currentPublishTime;
      errors.push(
        this.createError(
          ErrorType.PUBLISH_TIME_ERROR,
          ErrorMessages.PUBLISH_TIME_BACKWARDS(lastPublishTime, currentPublishTime, diff),
          stream,
          MediaType.MASTER
        )
      );
    }

    return errors;
  }

  /**
   * Validate segment timeline consistency
   * Checks for gaps, overlaps, and discontinuities in segment timeline
   */
  private validateSegmentTimeline(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];

    // Only validate if we have playlists with segments
    if (!mpd.playlists || mpd.playlists.length === 0) {
      return errors;
    }

    // Check each playlist (representation)
    for (const playlist of mpd.playlists) {
      if (!playlist.segments || playlist.segments.length === 0) {
        continue;
      }

      const segments = playlist.segments;
      let expectedTime = 0;
      let baseTime: number | undefined = undefined;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Check for missing duration
        if (segment.duration === undefined || segment.duration === null) {
          errors.push(
            this.createError(
              ErrorType.SEGMENT_TIMELINE_ERROR,
              ErrorMessages.SEGMENT_MISSING_DURATION(i),
              stream,
              MediaType.VIDEO
            )
          );
          continue;
        }

        // Check for timeline consistency (if presentationTime is available)
        if (segment.presentationTime !== undefined) {
          // Set base time from first segment
          if (baseTime === undefined) {
            baseTime = segment.presentationTime;
            expectedTime = 0;
          } else if (i > 0) {
            const tolerance = 0.1; // 100ms tolerance for floating point comparison
            const relativeTime = segment.presentationTime - baseTime;
            const gap = relativeTime - expectedTime;

            if (Math.abs(gap) > tolerance) {
              if (gap > tolerance) {
                // Gap detected
                errors.push(
                  this.createError(
                    ErrorType.SEGMENT_TIMELINE_ERROR,
                    ErrorMessages.SEGMENT_TIMELINE_GAP(
                      i,
                      expectedTime,
                      relativeTime,
                      gap
                    ),
                    stream,
                    MediaType.VIDEO
                  )
                );
              } else if (gap < -tolerance) {
                // Overlap detected
                errors.push(
                  this.createError(
                    ErrorType.SEGMENT_TIMELINE_ERROR,
                    ErrorMessages.SEGMENT_TIMELINE_OVERLAP(
                      i,
                      expectedTime,
                      relativeTime,
                      Math.abs(gap)
                    ),
                    stream,
                    MediaType.VIDEO
                  )
                );
              }
            }
          }
        }

        expectedTime += segment.duration;
      }
    }

    return errors;
  }

  /**
   * Validate codec and bitrate information
   * Checks that representations have valid codec strings and bitrates
   */
  private validateCodecAndBitrate(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];

    // Only validate if we have playlists
    if (!mpd.playlists || mpd.playlists.length === 0) {
      return errors;
    }

    // Check each playlist (representation)
    for (let i = 0; i < mpd.playlists.length; i++) {
      const playlist = mpd.playlists[i];
      const representationId = playlist.uri || `representation_${i}`;

      // Check for codec information
      const codecs = playlist.attributes?.CODECS;
      if (!codecs) {
        errors.push(
          this.createError(
            ErrorType.MPD_STRUCTURE_ERROR,
            ErrorMessages.CODEC_MISSING(representationId),
            stream,
            MediaType.VIDEO
          )
        );
      } else {
        // Basic codec validation - check for common patterns
        const validCodecPattern = /^(avc[1-3]|hev[1c]|vp[89]|av01|mp4a|opus|vorbis)/i;
        if (!validCodecPattern.test(codecs)) {
          errors.push(
            this.createError(
              ErrorType.MPD_STRUCTURE_ERROR,
              ErrorMessages.CODEC_INVALID(codecs, 'Unrecognized codec format'),
              stream,
              MediaType.VIDEO
            )
          );
        }
      }

      // Check for bitrate information
      const bandwidth = playlist.attributes?.BANDWIDTH;
      if (!bandwidth) {
        errors.push(
          this.createError(
            ErrorType.MPD_STRUCTURE_ERROR,
            ErrorMessages.BITRATE_MISSING(representationId),
            stream,
            MediaType.VIDEO
          )
        );
      } else {
        // Validate bitrate is within reasonable range (1kbps to 100Mbps)
        const minBitrate = 1000; // 1 Kbps
        const maxBitrate = 100000000; // 100 Mbps

        if (bandwidth < minBitrate || bandwidth > maxBitrate) {
          errors.push(
            this.createError(
              ErrorType.MPD_STRUCTURE_ERROR,
              ErrorMessages.BITRATE_INVALID(bandwidth, minBitrate, maxBitrate),
              stream,
              MediaType.VIDEO
            )
          );
        }
      }

      // Check resolution if available
      const resolution = playlist.attributes?.RESOLUTION;
      if (resolution) {
        const { width, height } = resolution;

        // Validate resolution is reasonable (16x16 to 8192x8192)
        if (width < 16 || height < 16 || width > 8192 || height > 8192) {
          errors.push(
            this.createError(
              ErrorType.MPD_STRUCTURE_ERROR,
              ErrorMessages.RESOLUTION_INVALID(
                width,
                height,
                'Resolution outside valid range (16-8192)'
              ),
              stream,
              MediaType.VIDEO
            )
          );
        }

        // Check aspect ratio is reasonable (0.5 to 4.0)
        const aspectRatio = width / height;
        if (aspectRatio < 0.5 || aspectRatio > 4.0) {
          errors.push(
            this.createError(
              ErrorType.MPD_STRUCTURE_ERROR,
              ErrorMessages.RESOLUTION_INVALID(
                width,
                height,
                `Unusual aspect ratio: ${aspectRatio.toFixed(2)}`
              ),
              stream,
              MediaType.VIDEO
            )
          );
        }
      }
    }

    return errors;
  }

  /**
   * Check segment availability (async - samples a few segments)
   * Note: This is optional and should be used sparingly to avoid overwhelming servers
   * @param mpd Parsed MPD
   * @param stream Stream item
   * @param sampleSize Number of segments to check (default: 3)
   */
  private async validateSegmentAvailability(
    mpd: ParsedMPD,
    stream: StreamItem,
    sampleSize: number = 3
  ): Promise<MonitorError[]> {
    const errors: MonitorError[] = [];

    // Only validate if we have playlists with segments
    if (!mpd.playlists || mpd.playlists.length === 0) {
      return errors;
    }

    // Check first playlist only to avoid too many requests
    const playlist = mpd.playlists[0];
    if (!playlist.segments || playlist.segments.length === 0) {
      return errors;
    }

    // Sample a few segments (first, middle, last)
    const segments = playlist.segments;
    const segmentsToCheck: number[] = [];

    if (segments.length <= sampleSize) {
      // Check all segments if we have few
      segmentsToCheck.push(...Array.from({ length: segments.length }, (_, i) => i));
    } else {
      // Sample first, middle, and last segments
      segmentsToCheck.push(0); // First
      segmentsToCheck.push(Math.floor(segments.length / 2)); // Middle
      segmentsToCheck.push(segments.length - 1); // Last
    }

    let unavailableCount = 0;

    for (const index of segmentsToCheck) {
      const segment = segments[index];
      const segmentUrl = segment.resolvedUri || segment.uri;

      if (!segmentUrl) {
        continue;
      }

      try {
        // Use HEAD request to check availability without downloading
        const response = await fetch(segmentUrl, { method: 'HEAD' });

        if (!response.ok) {
          unavailableCount++;
          errors.push(
            this.createError(
              ErrorType.SEGMENT_AVAILABILITY_ERROR,
              ErrorMessages.SEGMENT_NOT_AVAILABLE(segmentUrl, response.status),
              stream,
              MediaType.VIDEO
            )
          );
        }
      } catch (error) {
        unavailableCount++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(
          this.createError(
            ErrorType.SEGMENT_AVAILABILITY_ERROR,
            ErrorMessages.SEGMENT_CHECK_FAILED(segmentUrl, message),
            stream,
            MediaType.VIDEO
          )
        );
      }
    }

    // If too many segments are unavailable, add summary error
    if (unavailableCount > 0) {
      const percentage = (unavailableCount / segmentsToCheck.length) * 100;
      if (percentage > 50) {
        errors.push(
          this.createError(
            ErrorType.SEGMENT_AVAILABILITY_ERROR,
            ErrorMessages.SEGMENT_TOO_MANY_UNAVAILABLE(
              unavailableCount,
              segmentsToCheck.length,
              percentage
            ),
            stream,
            MediaType.VIDEO
          )
        );
      }
    }

    return errors;
  }

  /**
   * Handle manifest fetch and parse errors
   */
  private handleFetchError(error: any, stream: StreamItem): void {
    let errorType: ErrorType;
    let statusCode: number | undefined;
    let description: string;

    // Determine error type based on error class
    if (error instanceof MPDParseError) {
      // XML parsing error
      errorType = ErrorType.XML_PARSE_ERROR;
      description = error.message;
      statusCode = undefined;
    } else if (error instanceof MPDFetchError) {
      // HTTP fetch error
      errorType = ErrorType.MANIFEST_FETCH_ERROR;
      description = error.message;
      statusCode = error.statusCode || this.extractStatusCode(error);

      // Track fetch errors separately
      this.manifestFetchErrors.set(stream.url, {
        statusCode: statusCode || 0,
        timestamp: Date.now(),
      });
    } else {
      // Unknown error - treat as fetch error
      errorType = ErrorType.MANIFEST_FETCH_ERROR;
      description = error?.message || 'Unknown error';
      statusCode = this.extractStatusCode(error);

      this.manifestFetchErrors.set(stream.url, {
        statusCode: statusCode || 0,
        timestamp: Date.now(),
      });
    }

    const monitorError = this.createError(
      errorType,
      description,
      stream,
      MediaType.MASTER,
      statusCode
    );

    this.addError(monitorError, stream.id);
  }

  /**
   * Extract HTTP status code from error
   */
  private extractStatusCode(error: any): number {
    if (error.message && error.message.includes('HTTP')) {
      const match = error.message.match(/HTTP (\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 0;
  }

  /**
   * Create a monitor error
   */
  private createError(
    errorType: ErrorType,
    description: string,
    stream: StreamItem,
    mediaType: MediaType,
    httpStatusCode?: number
  ): MonitorError {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      errorType,
      mediaType,
      description,
      streamUrl: stream.url,
      streamId: stream.id,
      httpStatusCode,
    };
  }

  /**
   * Add error to storage and update counters
   */
  private addError(error: MonitorError, streamId: string): void {
    this.errorsList.add(error);

    // Update counters
    const currentTotal = this.totalErrorsPerStream.get(streamId) || 0;
    this.totalErrorsPerStream.set(streamId, currentTotal + 1);
    this.lastErrorTimePerStream.set(streamId, Date.now());

    this.log(`Error detected: ${error.errorType} - ${error.description}`);
  }

  /**
   * Update streams (add new streams)
   */
  async update(streamInputs: (string | StreamInput)[]): Promise<void> {
    const release = await this.mutex.acquire();

    try {
      const newStreams = this.normalizeStreams(streamInputs);

      newStreams.forEach((newStream) => {
        // Check if stream already exists
        const exists = this.streams.some((s) => s.url === newStream.url);
        if (!exists) {
          this.streams.push(newStream);
          this.streamData.set(newStream.id, {
            variants: new Map(),
            lastChecked: 0,
          });
          this.totalErrorsPerStream.set(newStream.id, 0);
          this.log(`Added stream: ${newStream.id}`);
        }
      });
    } finally {
      release();
    }
  }

  /**
   * Remove a stream
   */
  async removeStream(streamId: string): Promise<boolean> {
    const release = await this.mutex.acquire();

    try {
      const index = this.streams.findIndex((s) => s.id === streamId);
      if (index === -1) {
        return false;
      }

      const stream = this.streams[index];
      this.streams.splice(index, 1);
      this.streamData.delete(streamId);
      this.totalErrorsPerStream.delete(streamId);
      this.lastErrorTimePerStream.delete(streamId);
      this.manifestFetchErrors.delete(stream.url);

      this.log(`Removed stream: ${streamId}`);
      return true;
    } finally {
      release();
    }
  }

  // Getters
  getMonitorId(): string {
    return this.monitorId;
  }

  getState(): State {
    return this.state;
  }

  getCreatedAt(): number {
    return this.createdAt;
  }

  getStreams(): StreamItem[] {
    return [...this.streams];
  }

  getErrors(): MonitorError[] {
    return this.errorsList.getAll();
  }

  clearErrors(): void {
    this.errorsList.clear();
  }

  getManifestFetchErrors(): Map<string, ManifestFetchError> {
    return new Map(this.manifestFetchErrors);
  }

  getTotalErrorsPerStream(): Map<string, number> {
    return new Map(this.totalErrorsPerStream);
  }

  getLastErrorTimePerStream(): Map<string, number> {
    return new Map(this.lastErrorTimePerStream);
  }

  getLastChecked(): number {
    return this.lastChecked;
  }

  // Utilities
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(message: string): void {
    if (this.options.logConsole) {
      console.log(`[DASHMonitor ${this.monitorId}] ${message}`);
    }
  }
}
