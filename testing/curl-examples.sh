#!/bin/bash
# Individual curl command examples for DASH Monitor
# Copy and paste these commands for manual testing

# Set your base URL
export BASE_URL="http://localhost:8080"

# ===================
# HEALTH & INFO
# ===================

# Health check
curl $BASE_URL/

# ===================
# MONITOR MANAGEMENT
# ===================

# Create monitor with valid streams
curl -X POST $BASE_URL/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      {"url": "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd", "id": "bbb"},
      {"url": "https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd", "id": "envivio"}
    ],
    "options": {
      "staleLimit": 10000,
      "monitorInterval": 5000
    }
  }'

# Create monitor with simple URL array
curl -X POST $BASE_URL/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
    ]
  }'

# Create monitor with invalid streams (for error testing)
curl -X POST $BASE_URL/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      {"url": "https://example.com/nonexistent.mpd", "id": "test-404"}
    ]
  }'

# List all monitors
curl $BASE_URL/monitor | jq .

# Get specific monitor status (replace {monitorId})
curl $BASE_URL/monitor/{monitorId}/status | jq .

# Delete monitor
curl -X DELETE $BASE_URL/monitor/{monitorId}

# Delete all monitors
curl -X DELETE $BASE_URL/monitor

# ===================
# STREAM MANAGEMENT
# ===================

# List streams in a monitor
curl $BASE_URL/monitor/{monitorId}/streams | jq .

# Add streams to existing monitor
curl -X PUT $BASE_URL/monitor/{monitorId}/streams \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd",
      {"url": "https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd", "id": "custom"}
    ]
  }'

# Remove a stream
curl -X DELETE $BASE_URL/monitor/{monitorId}/stream \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "bbb"
  }'

# ===================
# ERROR MANAGEMENT
# ===================

# Get errors
curl $BASE_URL/monitor/{monitorId}/status | jq '.errors'

# Get error count
curl $BASE_URL/monitor/{monitorId}/status | jq '.errorCount'

# Clear errors
curl -X DELETE $BASE_URL/monitor/{monitorId}/status

# ===================
# METRICS
# ===================

# Get all metrics
curl $BASE_URL/metrics

# Get monitor info metrics
curl $BASE_URL/metrics | grep dash_monitor_info

# Get error count metrics
curl $BASE_URL/metrics | grep dash_monitor_stream_total_errors

# Get manifest fetch errors
curl $BASE_URL/metrics | grep dash_monitor_manifest_fetch_errors

# Get time since last error
curl $BASE_URL/metrics | grep dash_monitor_stream_time_since_last_error

# ===================
# FORMATTED OUTPUT
# ===================

# Pretty print monitor list
curl -s $BASE_URL/monitor | jq '.monitors[] | {id: .monitorId, state, streams: .streamCount}'

# Pretty print status with limited errors
curl -s $BASE_URL/monitor/{monitorId}/status | jq '{
  monitor: .monitorId,
  state: .state,
  streams: .streamCount,
  errors: .errorCount,
  recentErrors: .errors[:3]
}'

# Count monitors
curl -s $BASE_URL/monitor | jq '.monitors | length'

# Get all stream IDs
curl -s $BASE_URL/monitor/{monitorId}/streams | jq '.streams[].id'

# ===================
# TESTING WORKFLOWS
# ===================

# Complete test workflow
echo "1. Create monitor"
RESPONSE=$(curl -s -X POST $BASE_URL/monitor \
  -H "Content-Type: application/json" \
  -d @create-monitor.json)
MONITOR_ID=$(echo $RESPONSE | jq -r '.monitorId')
echo "Monitor ID: $MONITOR_ID"

echo "2. Wait for monitoring"
sleep 7

echo "3. Check status"
curl -s $BASE_URL/monitor/$MONITOR_ID/status | jq '{errorCount, recentErrors: .errors[:2]}'

echo "4. Check metrics"
curl -s $BASE_URL/metrics | grep $MONITOR_ID

echo "5. Cleanup"
curl -s -X DELETE $BASE_URL/monitor/$MONITOR_ID
