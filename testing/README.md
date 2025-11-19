# DASH Monitor Testing Guide

This directory contains test payloads and scripts for testing the DASH Monitor service.

## Quick Start

1. **Start the service:**
```bash
cd /Users/kunwu/Workspace/itv/dash-monitor
node start.js
```

2. **Run the complete test suite:**
```bash
cd testing
./test-commands.sh
```

## Test Files

### JSON Payloads

| File | Description |
|------|-------------|
| `create-monitor.json` | Create monitor with 3 public DASH streams |
| `create-monitor-invalid.json` | Create monitor with invalid URLs (for error testing) |
| `add-streams.json` | Add additional streams to existing monitor |
| `remove-stream.json` | Remove a stream from a monitor |

### Scripts

| File | Description |
|------|-------------|
| `test-commands.sh` | Complete automated test suite |
| `curl-examples.sh` | Individual curl command examples |

## Public DASH Test Streams

These streams are used in the test payloads:

1. **Big Buck Bunny (30fps)**
   - URL: `https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd`
   - Type: VOD
   - Good for: Basic manifest validation

2. **Envivio DASH**
   - URL: `https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd`
   - Type: VOD
   - Good for: Multi-period testing

3. **Sony Test Case**
   - URL: `https://dash.akamaized.net/dash264/TestCases/1a/sony/SNE_DASH_SD_CASE1A_REVISED.mpd`
   - Type: Test case
   - Good for: Standards compliance

## Manual Testing

### Create a Monitor

```bash
curl -X POST http://localhost:8080/monitor \
  -H "Content-Type: application/json" \
  -d @create-monitor.json
```

Response:
```json
{
  "monitorId": "uuid-here",
  "streamCount": 3
}
```

### Check Monitor Status

```bash
curl http://localhost:8080/monitor/{monitorId}/status | jq .
```

### View Prometheus Metrics

```bash
curl http://localhost:8080/metrics
```

### List All Monitors

```bash
curl http://localhost:8080/monitor | jq .
```

### Add Streams

```bash
curl -X PUT http://localhost:8080/monitor/{monitorId}/streams \
  -H "Content-Type: application/json" \
  -d @add-streams.json
```

### Remove Stream

```bash
curl -X DELETE http://localhost:8080/monitor/{monitorId}/stream \
  -H "Content-Type: application/json" \
  -d @remove-stream.json
```

### Clear Errors

```bash
curl -X DELETE http://localhost:8080/monitor/{monitorId}/status
```

### Delete Monitor

```bash
curl -X DELETE http://localhost:8080/monitor/{monitorId}
```

## Test Results

When you run the tests, you should see:

### Successful Operations
✅ Health check responds with status "ok"
✅ Monitors created with unique IDs
✅ Streams added and removed successfully
✅ Errors detected and tracked
✅ Metrics exported in OpenMetrics format

### Expected Errors (Validation Working)
✅ HTTP 404 errors detected for invalid URLs
✅ Manifest fetch errors tracked with status codes
✅ Error counts incremented correctly
✅ Time since last error tracked

## Metrics Examples

After running monitors, check these metrics:

```bash
# Monitor info
curl -s http://localhost:8080/metrics | grep dash_monitor_info

# Error counts
curl -s http://localhost:8080/metrics | grep dash_monitor_stream_total_errors

# Manifest fetch errors
curl -s http://localhost:8080/metrics | grep dash_monitor_manifest_fetch_errors
```

## Troubleshooting

### Service not starting?
```bash
# Check if port 8080 is in use
lsof -i :8080

# Use a different port
node start.js 8081
```

### No errors appearing?
Wait at least one monitoring interval (default: 3-5 seconds) for the monitor to check streams.

### Streams not being monitored?
Check the monitor state:
```bash
curl http://localhost:8080/monitor | jq '.monitors[] | {id: .monitorId, state}'
```

State should be "active".

## Next Steps

1. **Grafana Dashboards**: Import Prometheus metrics into Grafana
2. **Custom Streams**: Test with your own DASH streams
3. **Load Testing**: Create multiple monitors with many streams
4. **Alerting**: Set up alerts based on error thresholds

## Notes

- All test streams are publicly available
- Monitors run continuously once created
- Error limit is 10 by default (FIFO queue)
- Metrics are cumulative (error counts always increase)
- Clearing errors only clears the error list, not the counters
