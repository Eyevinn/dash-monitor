# DASH Stream Monitor

A TypeScript/Node.js service to monitor DASH/MPEG-DASH live streams for errors and inconsistencies. Provides REST API and Prometheus metrics for integration with monitoring dashboards.

## Features

- 🎯 **DASH/MPEG-DASH Monitoring** - Monitor one or more DASH streams continuously
- 📊 **Prometheus Metrics** - OpenMetrics endpoint for Grafana dashboards
- 🔍 **Error Detection** - Validates MPD structure, periods, timing, and staleness
- 🚀 **REST API** - Full API for programmatic control
- 🐳 **Docker Ready** - Includes Dockerfile and docker-compose setup
- 📦 **Library & CLI** - Use as a library or standalone service

## Validation Checks

The monitor performs comprehensive validation:

### Core Validations
- ✅ **Manifest Availability** - HTTP fetch success with proper error codes
- ✅ **XML Parsing** - Valid MPD XML structure
- ✅ **MPD Structure** - Required attributes and proper schema
- ✅ **Period Continuity** - No gaps or overlaps in periods
- ✅ **Publish Time** - Progressive updates for live streams
- ✅ **Staleness Detection** - Configurable threshold for manifest updates
- ✅ **Segment Timeline** - Timeline gaps, overlaps, and duration validation
- ✅ **Codec & Bitrate** - Validates codec formats and bitrate ranges
- ✅ **Resolution & Aspect Ratio** - Quality metadata validation

### Enhanced DASH Features 🆕
- ⏱️ **Time Shift Buffer** - Ensures proper DVR window configuration
- 🎯 **Presentation Delay** - Validates suggested presentation delay settings
- 🔄 **Multi-Period Transitions** - Detects gaps and overlaps at period boundaries
- 📡 **Segment Availability** - Optional HTTP checks for actual segment availability

## Installation

```bash
npm install @eyevinn/dash-monitor
```

Or clone and build:

```bash
git clone https://github.com/Eyevinn/dash-monitor.git
cd dash-monitor
npm install
npm run build
```

## Quick Start

### As a Service

```bash
# Start the service
npm start

# Or with custom port
npm start -- -p 3000

# Using Docker
docker-compose up
```

### As a Library

```javascript
const { DASHMonitor } = require('@eyevinn/dash-monitor');

const monitor = new DASHMonitor([
  'https://example.com/stream.mpd'
], {
  staleLimit: 6000,      // 6 seconds
  monitorInterval: 3000  // Check every 3 seconds
});

// Start monitoring
await monitor.start();

// Get errors
const errors = monitor.getErrors();
console.log(errors);

// Stop monitoring
monitor.stop();
```

## API Reference

### REST API Endpoints

#### Create Monitor
```http
POST /monitor
Content-Type: application/json

{
  "urls": [
    "https://example.com/stream.mpd",
    { "url": "https://example.com/stream2.mpd", "id": "custom-id" }
  ],
  "options": {
    "staleLimit": 6000,
    "monitorInterval": 3000,
    "errorLimit": 10
  }
}

Response: { "monitorId": "uuid", "streamCount": 2 }
```

#### List Monitors
```http
GET /monitor

Response: {
  "monitors": [
    {
      "monitorId": "uuid",
      "state": "active",
      "createdAt": 1234567890,
      "streamCount": 2
    }
  ]
}
```

#### Get Monitor Status
```http
GET /monitor/:monitorId/status

Response: {
  "monitorId": "uuid",
  "state": "active",
  "lastChecked": 1234567890,
  "streamCount": 2,
  "errorCount": 5,
  "errors": [...],
  "manifestFetchErrors": {...}
}
```

#### Add Streams
```http
PUT /monitor/:monitorId/streams
Content-Type: application/json

{
  "urls": ["https://example.com/new-stream.mpd"]
}

Response: { "monitorId": "uuid", "streamCount": 3 }
```

#### Remove Stream
```http
DELETE /monitor/:monitorId/stream
Content-Type: application/json

{
  "streamId": "stream-id"
}

Response: { "monitorId": "uuid", "removed": true, "streamCount": 2 }
```

#### Clear Errors
```http
DELETE /monitor/:monitorId/status

Response: { "monitorId": "uuid", "cleared": true }
```

#### Delete Monitor
```http
DELETE /monitor/:monitorId

Response: { "deleted": true }
```

### Prometheus Metrics

Access metrics at `/metrics`:

```
# Monitor info
dash_monitor_info{monitor_id, stream_count, created_at}

# Monitor state
dash_monitor_state{monitor_id, state}

# Total errors per stream
dash_monitor_stream_total_errors{monitor_id, stream_id}

# Time since last error
dash_monitor_stream_time_since_last_error_seconds{monitor_id, stream_id}

# Manifest fetch errors
dash_monitor_manifest_fetch_errors{monitor_id, url, status_code}

# Current error count
dash_monitor_error_count{monitor_id}
```

## Configuration

### Monitor Options

#### Core Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `staleLimit` | number | 6000 | Milliseconds before manifest considered stale |
| `monitorInterval` | number | 3000 | Milliseconds between checks |
| `errorLimit` | number | 10 | Maximum errors to store (FIFO) |
| `logConsole` | boolean | true | Enable console logging |

#### Enhanced DASH Options 🆕
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableSegmentAvailabilityCheck` | boolean | false | Enable HTTP segment availability checks (use cautiously) |
| `segmentCheckSampleSize` | number | 3 | Number of segments to check when availability checking is enabled |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 8080 |
| `NODE_ENV` | Environment | development |

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t dash-monitor .

# Run container
docker run -p 8080:8080 dash-monitor
```

### Docker Compose (with Prometheus & Grafana)

```bash
docker-compose up -d
```

Access:
- DASH Monitor: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

## OSC Deployment

Deploy to Eyevinn Open Source Cloud:

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/dash-monitor.git
git push -u origin main
```

2. **Deploy with Web Runner**
```bash
osc create eyevinn-web-runner dash-monitor \
  -o GitHubUrl=https://github.com/your-org/dash-monitor \
  -o GitHubToken="{{secrets.ghtoken}}" \
  -o OscAccessToken="{{secrets.osctoken}}"
```

3. **Create Monitor Manager** (Optional)

Similar to the HLS monitor setup, you can create a manager service that reads from CouchDB and automatically adds/removes streams.

## Error Types

### Core Error Types
| Error Type | Description |
|------------|-------------|
| `MANIFEST_FETCH_ERROR` | Failed to fetch MPD manifest |
| `XML_PARSE_ERROR` | Invalid XML structure |
| `MPD_STRUCTURE_ERROR` | Missing required MPD attributes |
| `PERIOD_CONTINUITY_ERROR` | Period timing issues |
| `STALE_MANIFEST` | Manifest hasn't updated within threshold |
| `PUBLISH_TIME_ERROR` | Publish time went backwards |
| `SEGMENT_TIMELINE_ERROR` | Segment timeline inconsistencies |
| `SEGMENT_AVAILABILITY_ERROR` | Segments not available |

### Enhanced Error Types 🆕
| Error Type | Description |
|------------|-------------|
| `PERIOD_TRANSITION_ERROR` | Gaps or overlaps detected at period transitions |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

## Testing with Real Streams

Test with public DASH streams:

```bash
curl -X POST http://localhost:8080/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
    ]
  }'
```

Check metrics:
```bash
curl http://localhost:8080/metrics
```

## Architecture

```
┌─────────────────┐
│  DASHMonitor    │  Core monitoring engine
│  - Validates    │
│  - Tracks errors│
│  - Manages state│
└────────┬────────┘
         │
         ├─ MPDLoader (fetch & parse)
         ├─ ErrorsList (FIFO storage)
         └─ Validation Logic
              ├─ Structure
              ├─ Periods
              ├─ Timing
              └─ Staleness

┌─────────────────────┐
│ DASHMonitorService  │  REST API & Metrics
│  - Fastify server   │
│  - API endpoints    │
│  - Prometheus export│
└─────────────────────┘
```

## Comparison with HLS Monitor

| Feature | HLS Monitor | DASH Monitor |
|---------|-------------|--------------|
| Manifest Format | M3U8 (text) | MPD (XML) |
| Parser Library | @eyevinn/m3u8 | mpd-parser |
| Key Validations | Media sequences, discontinuities | Periods, publish time, XML structure |
| API Pattern | ✅ Same | ✅ Same |
| Metrics | ✅ Prometheus | ✅ Prometheus |
| Docker | ✅ Yes | ✅ Yes |

## [Contributing](CONTRIBUTING.md)

In addition to contributing code, you can help to triage issues. This can include reproducing bug reports or asking for vital information such as version numbers or reproduction instructions.

## License (MIT)

Copyright 2024 Eyevinn Technology

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open-source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specializing in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This gives us room for innovation, team building, and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!