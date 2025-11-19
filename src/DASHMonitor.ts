/**
 * DASH Stream Monitor
 * Monitors DASH/MPEG-DASH streams for errors and inconsistencies
 */
import { Mutex } from 'async-mutex';
import { v4 as uuidv4 } from 'uuid';
import { MPDLoader } from './MPDLoader';
import { ErrorsList } from './ErrorsList';
import {
  State,
  MediaType,
  ErrorType,
  StreamInput,
  StreamItem,
  StreamData,
  VariantData,
  MonitorError,
  MonitorOptions,
  ManifestFetchError,
  ParsedMPD
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

  constructor(
    streamInputs: (string | StreamInput)[],
    options: MonitorOptions = {}
  ) {
    this.monitorId = uuidv4();
    this.createdAt = Date.now();
    this.mpdLoader = new MPDLoader();

    // Set default options
    this.options = {
      staleLimit: options.staleLimit ?? 6000,
      monitorInterval: options.monitorInterval ?? 3000,
      errorLimit: options.errorLimit ?? 10,
      logConsole: options.logConsole ?? true
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

    inputs.forEach(input => {
      const url = typeof input === 'string' ? input : input.url;
      let id = typeof input === 'string' ? this.normalizeStreamId(url) : (input.id || this.normalizeStreamId(url));

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
    this.streams.forEach(stream => {
      this.streamData.set(stream.id, {
        variants: new Map(),
        lastChecked: 0
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
      errors.forEach(error => {
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

    return errors;
  }

  /**
   * Validate MPD structure
   */
  private validateMPDStructure(mpd: ParsedMPD, stream: StreamItem): MonitorError[] {
    const errors: MonitorError[] = [];

    // Check required attributes
    if (!mpd.type) {
      errors.push(this.createError(
        ErrorType.MPD_STRUCTURE_ERROR,
        'Missing MPD type attribute',
        stream,
        MediaType.MASTER
      ));
    }

    if (mpd.type === 'static' && !mpd.mediaPresentationDuration) {
      errors.push(this.createError(
        ErrorType.MPD_STRUCTURE_ERROR,
        'Static MPD missing mediaPresentationDuration',
        stream,
        MediaType.MASTER
      ));
    }

    if (!mpd.periods || mpd.periods.length === 0) {
      errors.push(this.createError(
        ErrorType.MPD_STRUCTURE_ERROR,
        'MPD has no periods',
        stream,
        MediaType.MASTER
      ));
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
      errors.push(this.createError(
        ErrorType.STALE_MANIFEST,
        `Manifest has not updated in ${timeSinceLastUpdate}ms (publishTime unchanged)`,
        stream,
        MediaType.MASTER
      ));
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
          errors.push(this.createError(
            ErrorType.PERIOD_CONTINUITY_ERROR,
            `Period ${i} starts before period ${i - 1}`,
            stream,
            MediaType.MASTER
          ));
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
      errors.push(this.createError(
        ErrorType.PUBLISH_TIME_ERROR,
        `Publish time went backwards (${lastPublishTime} -> ${currentPublishTime})`,
        stream,
        MediaType.MASTER
      ));
    }

    return errors;
  }

  /**
   * Handle manifest fetch errors
   */
  private handleFetchError(error: any, stream: StreamItem): void {
    const statusCode = this.extractStatusCode(error);

    this.manifestFetchErrors.set(stream.url, {
      statusCode,
      timestamp: Date.now()
    });

    const monitorError = this.createError(
      ErrorType.MANIFEST_FETCH_ERROR,
      error.message || 'Failed to fetch manifest',
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
      httpStatusCode
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

      newStreams.forEach(newStream => {
        // Check if stream already exists
        const exists = this.streams.some(s => s.url === newStream.url);
        if (!exists) {
          this.streams.push(newStream);
          this.streamData.set(newStream.id, {
            variants: new Map(),
            lastChecked: 0
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
      const index = this.streams.findIndex(s => s.id === streamId);
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(message: string): void {
    if (this.options.logConsole) {
      console.log(`[DASHMonitor ${this.monitorId}] ${message}`);
    }
  }
}
