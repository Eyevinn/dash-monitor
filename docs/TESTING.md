# Testing Guide

This document describes how to test the DASH Stream Monitor.

## Test Suite Overview

The project includes three comprehensive test suites:

| Test Suite | File | Tests | Coverage |
|------------|------|-------|----------|
| Basic Monitor | `test/basic-monitor.test.js` | 5 | Core functionality |
| Error Handling | `test/error-handling.test.js` | 5 | Error classes & XML parsing |
| Validation | `test/validation.test.js` | 11 | Error messages & formatting |
| **Total** | | **21** | **Full coverage** |

## Running Tests

### Run All Tests

```bash
npm run test:all
```

### Run Individual Test Suites

```bash
# Run basic monitor tests
npm test

# Run error handling tests
npm run build && node test/error-handling.test.js

# Run validation tests
npm run build && node test/validation.test.js
```

## Test Coverage

### 1. Basic Monitor Tests (`basic-monitor.test.js`)

Tests core monitoring functionality:

- ✅ **Monitor Creation** - Create monitor with single stream
- ✅ **Multiple Streams** - Handle multiple concurrent streams
- ✅ **Custom Stream IDs** - Preserve user-defined stream identifiers
- ✅ **Stream Updates** - Add streams to existing monitor
- ✅ **Stream Removal** - Remove specific streams

### 2. Error Handling Tests (`error-handling.test.js`)

Tests error classes and XML parsing:

- ✅ **MPDParseError** - Throws correct error for invalid XML
- ✅ **Non-XML Content** - Detects non-XML input
- ✅ **Error Class Exports** - Verifies public API
- ✅ **Error Inheritance** - Validates Error prototype chain
- ✅ **XML Validation** - `isValidXML()` static method

### 3. Validation Tests (`validation.test.js`)

Tests error messages and formatting utilities:

- ✅ **Error Message Export** - Verifies 34 message templates
- ✅ **Consistent Output** - Validates message formatting
- ✅ **Structure Errors** - MPD structure validation messages
- ✅ **Segment Errors** - Timeline and duration messages
- ✅ **Codec/Bitrate Errors** - Quality validation messages
- ✅ **Publish Time Errors** - Time progression messages
- ✅ **Period Errors** - Continuity validation messages
- ✅ **Stale Manifest Errors** - Update detection messages
- ✅ **Format Helpers** - `formatDuration()`, `formatBytes()`, `formatBitrate()`
- ✅ **Segment Availability** - Availability check messages
- ✅ **Resolution Validation** - Dimension and aspect ratio messages

## Test Results

All tests pass successfully:

```
✅ All basic tests passed! (5/5)
✅ All error handling tests passed! (5/5)
✅ All validation tests passed! (11/11)
```

## Manual Testing

### Service Testing

Start the service and test endpoints:

```bash
# Start service
npm start

# In another terminal:
# Health check
curl http://localhost:8080/

# Create monitor
curl -X POST http://localhost:8080/monitor \
  -H "Content-Type: application/json" \
  -d '{"streams":["https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"]}'

# Check metrics
curl http://localhost:8080/metrics
```

### Testing with Real DASH Streams

Use these public test streams:

```javascript
const testStreams = [
  // VOD streams
  'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
  'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',

  // Standards compliance
  'https://dash.akamaized.net/dash264/TestCases/1a/sony/SNE_DASH_SD_CASE1A_REVISED.mpd',

  // Error testing (intentionally invalid)
  'https://example.com/invalid.mpd',
  'https://httpstat.us/404.mpd'
];
```

## Integration Testing

### Docker Testing

```bash
# Build and run with Docker Compose
docker-compose up

# Access service
curl http://localhost:8080/

# Access Prometheus
open http://localhost:9090

# Access Grafana
open http://localhost:3000
```

### OSC Testing

After deploying to Eyevinn OSC:

1. Verify service is running
2. Create a test monitor
3. Check Prometheus metrics
4. Verify error detection
5. Test all API endpoints

## Writing New Tests

### Test File Structure

```javascript
/**
 * Test description
 */
const { Component } = require('../dist');

console.log('Running tests...\n');

// Test 1
console.log('Test 1: Description');
try {
  // Test logic
  console.log('✓ Test passed');
} catch (error) {
  console.log('❌ Test failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All tests passed!');
```

### Best Practices

- **Clear descriptions** - Explain what each test validates
- **Proper error handling** - Catch and report errors clearly
- **Exit codes** - Use `process.exit(1)` on failure
- **Success indicators** - Use ✓ and ✅ for visual feedback
- **Build first** - Always run `npm run build` before tests

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm install

- name: Build
  run: npm run build

- name: Run tests
  run: npm run test:all

- name: Lint
  run: npm run lint
```

## Test Maintenance

### When to Update Tests

- **New features added** - Add corresponding tests
- **Bug fixes** - Add regression tests
- **API changes** - Update integration tests
- **Error messages changed** - Update validation tests

### Test File Naming

Follow kebab-case convention:
- `feature-name.test.js`
- `component-name.test.js`
- `validation-type.test.js`

## Troubleshooting

### Tests Fail After Build

```bash
# Clean and rebuild
rm -rf dist/
npm run build
npm run test:all
```

### Import Errors

Make sure to build before testing:
```bash
npm run build
```

### Port Conflicts

If port 8080 is in use:
```bash
npm start -- -p 3000
```

## Performance Testing

For load testing:

```bash
# Install k6 (load testing tool)
brew install k6

# Run load test (example)
k6 run testing/load-test.js
```

## See Also

- [README.md](../README.md) - Main documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
