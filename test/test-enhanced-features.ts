/**
 * Example Test Script for Enhanced DASH Features
 *
 * This script demonstrates how to test the newly implemented enhanced DASH features
 * using the curated test streams from DASH Industry Forum.
 *
 * Run with: npx ts-node test/test-enhanced-features.ts
 */

import { DASHMonitor } from '../src/DASHMonitor';
import {
  basicLiveStreams,
  lowLatencyStreams,
  bufferAndWindowStreams,
  multiPeriodStreams,
  recommendedTestConfigs,
  type DASHTestStream,
} from './dash-test-streams';

/**
 * Test 1: Basic Live Stream Monitoring
 */
async function testBasicLiveStream() {
  console.log('\n=== Test 1: Basic Live Stream Monitoring ===');

  const stream = basicLiveStreams[0];
  console.log(`Testing: ${stream.name}`);
  console.log(`URL: ${stream.url}`);

  const monitor = new DASHMonitor([stream.url], {
    monitorInterval: 5000,
    staleLimit: 10000,
    logConsole: true,
  });

  await monitor.start();

  // Monitor for 30 seconds
  await sleep(30000);

  const errors = monitor.getErrors();
  console.log(`\nErrors detected: ${errors.length}`);
  errors.forEach((error) => {
    console.log(`  [${error.errorType}] ${error.description}`);
  });

  monitor.stop();
}

/**
 * Test 2: Low-Latency DASH Stream Monitoring
 */
async function testLowLatencyStream() {
  console.log('\n=== Test 2: Low-Latency DASH Stream Monitoring ===');

  const stream = lowLatencyStreams[0];
  console.log(`Testing: ${stream.name}`);
  console.log(`URL: ${stream.url}`);
  console.log('Testing low-latency stream...');

  const monitor = new DASHMonitor([stream.url], {
    monitorInterval: 3000,
    logConsole: true,
  });

  await monitor.start();

  // Monitor for 30 seconds
  await sleep(30000);

  const errors = monitor.getErrors();
  console.log(`\nErrors detected: ${errors.length}`);
  errors.forEach((error) => {
    console.log(`  [${error.errorType}] ${error.description}`);
  });

  monitor.stop();
}

/**
 * Test 3: Time Shift Buffer Validation
 */
async function testBufferAndWindowValidation() {
  console.log('\n=== Test 3: Time Shift Buffer Validation ===');

  const stream = bufferAndWindowStreams[0];
  console.log(`Testing: ${stream.name}`);
  console.log(`URL: ${stream.url}`);
  console.log('Testing time shift buffer features...');

  const monitor = new DASHMonitor([stream.url], {
    monitorInterval: 5000,
    logConsole: true,
  });

  await monitor.start();

  // Monitor for 30 seconds
  await sleep(30000);

  const errors = monitor.getErrors();
  console.log(`\nErrors detected: ${errors.length}`);

  monitor.stop();
}

/**
 * Test 4: Multi-Period Transition Validation
 */
async function testMultiPeriodTransitions() {
  console.log('\n=== Test 4: Multi-Period Transition Validation ===');

  const stream = multiPeriodStreams[1]; // High-frequency periods with continuity
  console.log(`Testing: ${stream.name}`);
  console.log(`URL: ${stream.url}`);
  console.log('Testing multi-period transition features...');

  const monitor = new DASHMonitor([stream.url], {
    monitorInterval: 2000, // Check more frequently for period transitions
    logConsole: true,
  });

  await monitor.start();

  // Monitor for 2 minutes to catch multiple period transitions
  console.log('Monitoring for 2 minutes to observe period transitions...');
  await sleep(120000);

  const errors = monitor.getErrors();
  console.log(`\nErrors detected: ${errors.length}`);

  const periodErrors = errors.filter(
    (e) =>
      e.errorType === 'PERIOD_TRANSITION_ERROR' || e.errorType === 'PERIOD_CONTINUITY_ERROR'
  );

  console.log(`Period transition errors: ${periodErrors.length}`);
  periodErrors.forEach((error) => {
    console.log(`  ${error.description}`);
  });

  monitor.stop();
}

/**
 * Test 5: Segment Availability Check
 */
async function testSegmentAvailability() {
  console.log('\n=== Test 5: Segment Availability Check ===');

  const stream = basicLiveStreams[0];
  console.log(`Testing: ${stream.name}`);
  console.log(`URL: ${stream.url}`);
  console.log('Testing segment availability validation (async)...');

  const monitor = new DASHMonitor([stream.url], {
    enableSegmentAvailabilityCheck: true, // Enable async segment checks
    segmentCheckSampleSize: 3, // Check 3 segments per validation
    monitorInterval: 10000, // Check less frequently to avoid overwhelming server
    logConsole: true,
  });

  await monitor.start();

  // Monitor for 30 seconds
  await sleep(30000);

  const errors = monitor.getErrors();
  console.log(`\nErrors detected: ${errors.length}`);

  const availabilityErrors = errors.filter((e) => e.errorType === 'SEGMENT_AVAILABILITY_ERROR');

  console.log(`Segment availability errors: ${availabilityErrors.length}`);
  availabilityErrors.forEach((error) => {
    console.log(`  ${error.description}`);
  });

  monitor.stop();
}

/**
 * Test 6: Comprehensive Multi-Stream Monitoring
 */
async function testComprehensiveMonitoring() {
  console.log('\n=== Test 6: Comprehensive Multi-Stream Monitoring ===');

  const config = recommendedTestConfigs.comprehensiveTesting;
  const streamUrls = config.streams.map((s: DASHTestStream) => s.url);

  console.log('Testing multiple streams with all enhanced features enabled:');
  config.streams.forEach((s: DASHTestStream, i: number) => {
    console.log(`  ${i + 1}. ${s.name}`);
  });

  const monitor = new DASHMonitor(streamUrls, config.options);

  await monitor.start();

  // Monitor for 1 minute
  console.log('\nMonitoring for 1 minute...');
  await sleep(60000);

  const errors = monitor.getErrors();
  console.log(`\n=== Results ===`);
  console.log(`Total errors detected: ${errors.length}`);

  // Group errors by type
  const errorsByType = errors.reduce(
    (acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('\nErrors by type:');
  Object.entries(errorsByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Group errors by stream
  const errorsByStream = errors.reduce(
    (acc, error) => {
      acc[error.streamId] = (acc[error.streamId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('\nErrors by stream:');
  Object.entries(errorsByStream).forEach(([streamId, count]) => {
    console.log(`  ${streamId}: ${count}`);
  });

  monitor.stop();
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main test runner
 */
async function main() {
  console.log('====================================');
  console.log('DASH Enhanced Features Test Suite');
  console.log('====================================');

  const args = process.argv.slice(2);
  const testNumber = args[0] ? parseInt(args[0]) : 0;

  try {
    switch (testNumber) {
      case 1:
        await testBasicLiveStream();
        break;
      case 2:
        await testLowLatencyStream();
        break;
      case 3:
        await testBufferAndWindowValidation();
        break;
      case 4:
        await testMultiPeriodTransitions();
        break;
      case 5:
        await testSegmentAvailability();
        break;
      case 6:
        await testComprehensiveMonitoring();
        break;
      default:
        console.log('\nAvailable tests:');
        console.log('  1: Basic Live Stream Monitoring');
        console.log('  2: Low-Latency DASH Stream Monitoring');
        console.log('  3: Buffer & Availability Window Validation');
        console.log('  4: Multi-Period Transition Validation');
        console.log('  5: Segment Availability Check');
        console.log('  6: Comprehensive Multi-Stream Monitoring');
        console.log('\nUsage: npx ts-node test/test-enhanced-features.ts [test-number]');
        console.log('Example: npx ts-node test/test-enhanced-features.ts 2');
        console.log('\nOr run all tests:');
        console.log('  npx ts-node test/test-enhanced-features.ts 1');
        console.log('  npx ts-node test/test-enhanced-features.ts 2');
        console.log('  ... etc');
        break;
    }
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }

  console.log('\nTest completed successfully!');
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  testBasicLiveStream,
  testLowLatencyStream,
  testBufferAndWindowValidation,
  testMultiPeriodTransitions,
  testSegmentAvailability,
  testComprehensiveMonitoring,
};
