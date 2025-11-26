# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-26

### Fixed
- **Critical**: Fixed segment timeline validation to use relative timestamps instead of absolute values
- Resolved false positive timeline errors by calculating presentation time relative to first segment
- Improved timeline gap/overlap detection accuracy for live and VOD streams
- Timeline validation now properly handles period transitions and timestamp resets

### Technical Details
- Modified `validateSegmentTimeline()` in `DASHMonitor.ts` to establish baseline time from first segment
- Added `baseTime` variable to track initial presentation timestamp
- Changed timeline calculations from absolute to relative time comparisons
- Fixed edge case where absolute timestamps were incorrectly compared to cumulative durations

### Testing
- Verified with multiple DASH-IF reference streams
- Tested live streams with period transitions (periods_60 test case)
- Confirmed no false timeline errors on working streams
- Timeline overlaps still correctly detected during legitimate period transitions

## [1.0.0] - 2025-11-19

### Added
- Initial release of DASH Stream Monitor
- Core monitoring functionality for DASH/MPEG-DASH streams
- REST API with 10 endpoints for monitor management
- Prometheus metrics in OpenMetrics format
- MPD manifest validation (structure, periods, timing)
- HTTP error detection with status codes
- Dynamic stream management (add/remove streams)
- Thread-safe operations with async-mutex
- Configurable monitoring intervals and staleness detection
- FIFO error storage (10 items per monitor)
- Docker and docker-compose support
- Complete documentation and testing suite
- TypeScript source with compiled JavaScript distribution
- CLI for standalone service mode
- Library mode for programmatic integration

### Features
- Monitor multiple DASH streams concurrently
- Validate MPD structure and required attributes
- Detect stale manifests (configurable threshold)
- Track publish time progression for live streams
- Monitor period continuity
- Export comprehensive Prometheus metrics
- Support custom stream IDs
- Thread-safe concurrent operations
- Graceful error handling and recovery

### API Endpoints
- `GET /` - Health check
- `POST /monitor` - Create monitor
- `GET /monitor` - List all monitors
- `GET /monitor/:id/status` - Get monitor status
- `GET /monitor/:id/streams` - List streams
- `PUT /monitor/:id/streams` - Add streams
- `DELETE /monitor/:id/stream` - Remove stream
- `DELETE /monitor/:id/status` - Clear errors
- `DELETE /monitor/:id` - Delete monitor
- `GET /metrics` - Prometheus metrics

### Metrics
- `dash_monitor_info` - Monitor metadata
- `dash_monitor_state` - Monitor state tracking
- `dash_monitor_stream_total_errors` - Cumulative errors
- `dash_monitor_stream_time_since_last_error_seconds` - Error timing
- `dash_monitor_manifest_fetch_errors` - HTTP errors
- `dash_monitor_error_count` - Current error count

### Documentation
- Complete README with API reference
- Quick start guide
- Testing guide with examples
- Contribution guidelines
- Testing summary report
- Docker deployment guide
- OSC deployment instructions

[1.0.0]: https://github.com/Eyevinn/dash-monitor/releases/tag/v1.0.0
