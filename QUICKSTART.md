# Quick Start Guide

## Prerequisites

- Node.js ^22.23.4 or >= 24.22.1
- npm

## Installation

```bash
cd /Users/kunwu/Workspace/itv/dash-monitor
npm install
npm run build
```

## Running the Service

### Option 1: Command Line

```bash
npm start

# Or with custom port
npm start -- -p 3000
```

The service will be available at http://localhost:8080

### Option 2: Docker

```bash
docker build -t dash-monitor .
docker run -p 8080:8080 dash-monitor
```

### Option 3: Docker Compose (with Prometheus & Grafana)

```bash
docker-compose up -d
```

Access:
- DASH Monitor: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

## Testing the API

### 1. Create a Monitor

```bash
curl -X POST http://localhost:8080/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"]
  }'
```

Response:
```json
{
  "monitorId": "uuid-here",
  "streamCount": 1
}
```

### 2. Check Status

```bash
curl http://localhost:8080/monitor/{monitorId}/status
```

### 3. View Metrics

```bash
curl http://localhost:8080/metrics
```

## Using as a Library

```javascript
const { DASHMonitor } = require('@eyevinn/dash-monitor');

// Create monitor
const monitor = new DASHMonitor([
  'https://example.com/stream.mpd'
], {
  staleLimit: 6000,
  monitorInterval: 3000
});

// Start monitoring
await monitor.start();

// Get errors
const errors = monitor.getErrors();
console.log(errors);

// Stop
monitor.stop();
```

## Testing with Real Streams

Here are some public DASH streams for testing:

```bash
# Big Buck Bunny (30fps)
https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd

# Big Buck Bunny (VOD)
https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd

# Tears of Steel
https://dash.akamaized.net/akamai/test/tears_of_steel/ToS-4k-UHD-DASH.mpd
```

## Next Steps

1. **Configure Grafana**: Import dashboards for visualizing metrics
2. **Add Authentication**: Implement Basic Auth or OAuth if needed
3. **Deploy to OSC**: Follow the OSC deployment guide in README.md
4. **Customize Validation**: Extend validation logic for specific requirements

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
npm start -- -p 8081
```

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Test Failures

```bash
# Run tests
npm test

# Verify build
npm run build
```

## Documentation

- Full README: [README.md](./README.md)
- API Reference: Available in README.md
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
