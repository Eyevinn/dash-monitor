/**
 * DASH Monitor Service
 * REST API service for managing DASH stream monitors
 */
import fastify, { FastifyInstance } from 'fastify';
import { DASHMonitor } from './DASHMonitor';
import { StreamInput, MonitorOptions, State } from './types';

interface CreateMonitorBody {
  urls: (string | StreamInput)[];
  options?: MonitorOptions;
}

interface UpdateStreamsBody {
  urls: (string | StreamInput)[];
}

interface RemoveStreamBody {
  streamId: string;
}

export class DASHMonitorService {
  private server: FastifyInstance;
  private monitors: Map<string, DASHMonitor> = new Map();
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
    this.server = fastify({ logger: true });
    this.setupRoutes();
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.server.get('/', async () => {
      return { status: 'ok', service: 'dash-monitor', monitors: this.monitors.size };
    });

    // Create monitor
    this.server.post<{ Body: CreateMonitorBody }>('/monitor', async (request, reply) => {
      try {
        const { urls, options } = request.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          return reply.code(400).send({ error: 'Invalid urls parameter' });
        }

        // Validate URLs
        for (const url of urls) {
          const urlString = typeof url === 'string' ? url : url.url;
          if (!this.isValidUrl(urlString)) {
            return reply.code(400).send({ error: `Invalid URL: ${urlString}` });
          }
        }

        // Create monitor
        const monitor = new DASHMonitor(urls, options);
        this.monitors.set(monitor.getMonitorId(), monitor);

        // Start monitoring
        void monitor.start();

        return {
          monitorId: monitor.getMonitorId(),
          streamCount: monitor.getStreams().length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return reply.code(500).send({ error: errorMessage });
      }
    });

    // List monitors
    this.server.get('/monitor', async () => {
      const monitors = Array.from(this.monitors.values()).map((monitor) => ({
        monitorId: monitor.getMonitorId(),
        state: monitor.getState(),
        createdAt: monitor.getCreatedAt(),
        streamCount: monitor.getStreams().length,
      }));

      return { monitors };
    });

    // Get monitor status
    this.server.get<{ Params: { monitorId: string } }>(
      '/monitor/:monitorId/status',
      async (request, reply) => {
        const { monitorId } = request.params;
        const monitor = this.monitors.get(monitorId);

        if (!monitor) {
          return reply.code(404).send({ error: 'Monitor not found' });
        }

        const errors = monitor.getErrors();
        const manifestFetchErrors = Object.fromEntries(monitor.getManifestFetchErrors());

        return {
          monitorId,
          state: monitor.getState(),
          lastChecked: monitor.getLastChecked(),
          streamCount: monitor.getStreams().length,
          errorCount: errors.length,
          errors,
          manifestFetchErrors,
        };
      }
    );

    // Get monitor streams
    this.server.get<{ Params: { monitorId: string } }>(
      '/monitor/:monitorId/streams',
      async (request, reply) => {
        const { monitorId } = request.params;
        const monitor = this.monitors.get(monitorId);

        if (!monitor) {
          return reply.code(404).send({ error: 'Monitor not found' });
        }

        return {
          monitorId,
          streams: monitor.getStreams(),
        };
      }
    );

    // Add streams to monitor
    this.server.put<{ Params: { monitorId: string }; Body: UpdateStreamsBody }>(
      '/monitor/:monitorId/streams',
      async (request, reply) => {
        const { monitorId } = request.params;
        const { urls } = request.body;
        const monitor = this.monitors.get(monitorId);

        if (!monitor) {
          return reply.code(404).send({ error: 'Monitor not found' });
        }

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          return reply.code(400).send({ error: 'Invalid urls parameter' });
        }

        // Validate URLs
        for (const url of urls) {
          const urlString = typeof url === 'string' ? url : url.url;
          if (!this.isValidUrl(urlString)) {
            return reply.code(400).send({ error: `Invalid URL: ${urlString}` });
          }
        }

        await monitor.update(urls);

        return {
          monitorId,
          streamCount: monitor.getStreams().length,
        };
      }
    );

    // Remove stream from monitor
    this.server.delete<{ Params: { monitorId: string }; Body: RemoveStreamBody }>(
      '/monitor/:monitorId/stream',
      async (request, reply) => {
        const { monitorId } = request.params;
        const { streamId } = request.body;
        const monitor = this.monitors.get(monitorId);

        if (!monitor) {
          return reply.code(404).send({ error: 'Monitor not found' });
        }

        if (!streamId) {
          return reply.code(400).send({ error: 'Missing streamId' });
        }

        const removed = await monitor.removeStream(streamId);

        if (!removed) {
          return reply.code(404).send({ error: 'Stream not found' });
        }

        return {
          monitorId,
          removed: true,
          streamCount: monitor.getStreams().length,
        };
      }
    );

    // Clear monitor errors
    this.server.delete<{ Params: { monitorId: string } }>(
      '/monitor/:monitorId/status',
      async (request, reply) => {
        const { monitorId } = request.params;
        const monitor = this.monitors.get(monitorId);

        if (!monitor) {
          return reply.code(404).send({ error: 'Monitor not found' });
        }

        monitor.clearErrors();

        return {
          monitorId,
          cleared: true,
        };
      }
    );

    // Delete monitor
    this.server.delete<{ Params: { monitorId: string } }>(
      '/monitor/:monitorId',
      async (request, reply) => {
        const { monitorId } = request.params;
        const monitor = this.monitors.get(monitorId);

        if (!monitor) {
          return reply.code(404).send({ error: 'Monitor not found' });
        }

        monitor.stop();
        this.monitors.delete(monitorId);

        return {
          deleted: true,
        };
      }
    );

    // Delete all monitors
    this.server.delete('/monitor', async () => {
      this.monitors.forEach((monitor) => monitor.stop());
      this.monitors.clear();

      return {
        deleted: true,
      };
    });

    // Prometheus metrics endpoint
    this.server.get('/metrics', async (_request, reply) => {
      const metrics = this.generateMetrics();

      reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      return metrics;
    });
  }

  /**
   * Generate Prometheus metrics in OpenMetrics format
   */
  private generateMetrics(): string {
    const lines: string[] = [];
    const now = Date.now();

    // Helper to escape labels
    const escapeLabel = (str: string): string => {
      return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    };

    lines.push('# HELP dash_monitor_info Information about DASH monitors');
    lines.push('# TYPE dash_monitor_info gauge');

    this.monitors.forEach((monitor) => {
      const monitorId = escapeLabel(monitor.getMonitorId());
      const streamCount = monitor.getStreams().length;
      const createdAt = monitor.getCreatedAt();

      lines.push(
        `dash_monitor_info{monitor_id="${monitorId}",stream_count="${streamCount}",created_at="${createdAt}"} 1`
      );
    });

    lines.push('');
    lines.push('# HELP dash_monitor_state State of monitor (1=active, 0=inactive)');
    lines.push('# TYPE dash_monitor_state gauge');

    this.monitors.forEach((monitor) => {
      const monitorId = escapeLabel(monitor.getMonitorId());
      const state = monitor.getState();

      lines.push(
        `dash_monitor_state{monitor_id="${monitorId}",state="active"} ${state === State.ACTIVE ? 1 : 0}`
      );
      lines.push(
        `dash_monitor_state{monitor_id="${monitorId}",state="inactive"} ${state === State.INACTIVE ? 1 : 0}`
      );
      lines.push(
        `dash_monitor_state{monitor_id="${monitorId}",state="idle"} ${state === State.IDLE ? 1 : 0}`
      );
    });

    lines.push('');
    lines.push('# HELP dash_monitor_stream_total_errors Total errors per stream');
    lines.push('# TYPE dash_monitor_stream_total_errors counter');

    this.monitors.forEach((monitor) => {
      const monitorId = escapeLabel(monitor.getMonitorId());
      const totalErrors = monitor.getTotalErrorsPerStream();

      totalErrors.forEach((count, streamId) => {
        lines.push(
          `dash_monitor_stream_total_errors{monitor_id="${monitorId}",stream_id="${escapeLabel(streamId)}"} ${count}`
        );
      });
    });

    lines.push('');
    lines.push(
      '# HELP dash_monitor_stream_time_since_last_error_seconds Time since last error in seconds'
    );
    lines.push('# TYPE dash_monitor_stream_time_since_last_error_seconds gauge');

    this.monitors.forEach((monitor) => {
      const monitorId = escapeLabel(monitor.getMonitorId());
      const lastErrorTimes = monitor.getLastErrorTimePerStream();

      lastErrorTimes.forEach((timestamp, streamId) => {
        const secondsSince = Math.floor((now - timestamp) / 1000);
        lines.push(
          `dash_monitor_stream_time_since_last_error_seconds{monitor_id="${monitorId}",stream_id="${escapeLabel(streamId)}"} ${secondsSince}`
        );
      });
    });

    lines.push('');
    lines.push('# HELP dash_monitor_manifest_fetch_errors Manifest fetch errors by status code');
    lines.push('# TYPE dash_monitor_manifest_fetch_errors counter');

    this.monitors.forEach((monitor) => {
      const monitorId = escapeLabel(monitor.getMonitorId());
      const fetchErrors = monitor.getManifestFetchErrors();

      fetchErrors.forEach((error, url) => {
        lines.push(
          `dash_monitor_manifest_fetch_errors{monitor_id="${monitorId}",url="${escapeLabel(url)}",status_code="${error.statusCode}"} 1`
        );
      });
    });

    lines.push('');
    lines.push('# HELP dash_monitor_error_count Current number of errors in memory');
    lines.push('# TYPE dash_monitor_error_count gauge');

    this.monitors.forEach((monitor) => {
      const monitorId = escapeLabel(monitor.getMonitorId());
      const errorCount = monitor.getErrors().length;

      lines.push(`dash_monitor_error_count{monitor_id="${monitorId}"} ${errorCount}`);
    });

    lines.push('');
    lines.push('# EOF');

    return lines.join('\n');
  }

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    try {
      await this.server.listen({ port: this.port, host: '0.0.0.0' });
      console.log(`DASH Monitor Service listening on port ${this.port}`);
    } catch (error) {
      console.error('Failed to start service:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    this.monitors.forEach((monitor) => monitor.stop());
    await this.server.close();
  }
}
