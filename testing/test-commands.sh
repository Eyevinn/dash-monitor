#!/bin/bash
# DASH Monitor Test Commands
# Run these commands to test the DASH Monitor service

BASE_URL="http://localhost:8080"

echo "================================"
echo "DASH Monitor Testing Script"
echo "================================"
echo ""

# 1. Health Check
echo "1. Testing health check..."
curl -s $BASE_URL/ | jq .
echo ""

# 2. Create Monitor with Valid Streams
echo "2. Creating monitor with valid DASH streams..."
MONITOR_RESPONSE=$(curl -s -X POST $BASE_URL/monitor \
  -H "Content-Type: application/json" \
  -d @create-monitor.json)
MONITOR_ID=$(echo $MONITOR_RESPONSE | jq -r '.monitorId')
echo "Created monitor: $MONITOR_ID"
echo $MONITOR_RESPONSE | jq .
echo ""

# Wait for monitoring
echo "3. Waiting 10 seconds for monitoring to run..."
sleep 10
echo ""

# 4. Check Status
echo "4. Checking monitor status..."
curl -s $BASE_URL/monitor/$MONITOR_ID/status | jq '{monitorId, state, streamCount, errorCount, recentErrors: .errors[:3]}'
echo ""

# 5. List All Monitors
echo "5. Listing all monitors..."
curl -s $BASE_URL/monitor | jq .
echo ""

# 6. Get Streams
echo "6. Getting streams for monitor..."
curl -s $BASE_URL/monitor/$MONITOR_ID/streams | jq .
echo ""

# 7. Add Streams
echo "7. Adding streams to monitor..."
curl -s -X PUT $BASE_URL/monitor/$MONITOR_ID/streams \
  -H "Content-Type: application/json" \
  -d @add-streams.json | jq .
echo ""

# 8. Remove Stream
echo "8. Removing a stream..."
curl -s -X DELETE $BASE_URL/monitor/$MONITOR_ID/stream \
  -H "Content-Type: application/json" \
  -d @remove-stream.json | jq .
echo ""

# 9. Clear Errors
echo "9. Clearing errors..."
curl -s -X DELETE $BASE_URL/monitor/$MONITOR_ID/status | jq .
echo ""

# 10. Check Metrics
echo "10. Checking Prometheus metrics..."
curl -s $BASE_URL/metrics | head -30
echo ""

# 11. Create Monitor with Invalid Streams
echo "11. Creating monitor with invalid streams (for error detection)..."
INVALID_RESPONSE=$(curl -s -X POST $BASE_URL/monitor \
  -H "Content-Type: application/json" \
  -d @create-monitor-invalid.json)
INVALID_MONITOR_ID=$(echo $INVALID_RESPONSE | jq -r '.monitorId')
echo "Created monitor: $INVALID_MONITOR_ID"
echo $INVALID_RESPONSE | jq .
echo ""

# Wait for errors
echo "12. Waiting 7 seconds for error detection..."
sleep 7
echo ""

# 13. Check Errors
echo "13. Checking errors from invalid streams..."
curl -s $BASE_URL/monitor/$INVALID_MONITOR_ID/status | jq '{errorCount, errors}'
echo ""

# 14. Delete Monitor
echo "14. Deleting test monitor..."
curl -s -X DELETE $BASE_URL/monitor/$INVALID_MONITOR_ID | jq .
echo ""

# 15. Final Status
echo "15. Final monitor list..."
curl -s $BASE_URL/monitor | jq .
echo ""

echo "================================"
echo "Testing Complete!"
echo "================================"
