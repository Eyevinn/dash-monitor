/**
 * Test script to post DASH test streams to the running service API
 * and monitor for errors
 */
import fetch from 'node-fetch';
import {
  basicLiveStreams,
  lowLatencyStreams,
  bufferAndWindowStreams,
  multiPeriodStreams,
  type DASHTestStream,
} from './dash-test-streams';

const API_BASE = 'http://localhost:8080';

interface MonitorResponse {
  monitorId: string;
  state: string;
  createdAt: number;
  streamCount: number;
}

interface ErrorResponse {
  errorType: string;
  description: string;
  streamId: string;
  timestamp: number;
}

/**
 * Create a monitor with a stream
 */
async function createMonitor(stream: DASHTestStream): Promise<string> {
  const response = await fetch(`${API_BASE}/monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls: [stream.url],
      options: {
        monitorInterval: 5000,
        staleLimit: 10000,
        logConsole: false, // Disable console logging to reduce noise
        maxLatency: 10,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create monitor: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as MonitorResponse;
  return data.monitorId;
}

/**
 * Get errors for a monitor
 */
async function getErrors(monitorId: string): Promise<ErrorResponse[]> {
  const response = await fetch(`${API_BASE}/monitor/${monitorId}/status`);

  if (!response.ok) {
    throw new Error(`Failed to get errors: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { errors: ErrorResponse[] };
  return data.errors;
}

/**
 * Delete a monitor
 */
async function deleteMonitor(monitorId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/monitor/${monitorId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete monitor: ${response.status} ${response.statusText}`);
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Test a single stream
 */
async function testStream(stream: DASHTestStream, duration: number = 20000) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${stream.name}`);
  console.log(`URL: ${stream.url}`);
  console.log(`Description: ${stream.description}`);
  console.log(`Features: ${stream.features.join(', ')}`);
  console.log(`Test Purpose: ${stream.testPurpose.join(', ')}`);
  console.log(`${'='.repeat(80)}\n`);

  let monitorId: string | null = null;

  try {
    // Create monitor
    console.log('Creating monitor...');
    monitorId = await createMonitor(stream);
    console.log(`Monitor created: ${monitorId}`);

    // Wait for monitoring to run
    console.log(`Monitoring for ${duration / 1000} seconds...`);
    await sleep(duration);

    // Get errors
    console.log('Fetching errors...');
    const errors = await getErrors(monitorId);

    console.log(`\nTotal errors detected: ${errors.length}`);

    if (errors.length > 0) {
      // Group by error type
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

      console.log('\nSample errors (first 3):');
      errors.slice(0, 3).forEach((error, i) => {
        console.log(`  ${i + 1}. [${error.errorType}] ${error.description}`);
      });
    } else {
      console.log('✅ No errors detected!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    if (monitorId) {
      console.log('\nCleaning up...');
      await deleteMonitor(monitorId);
      console.log('Monitor deleted');
    }
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              DASH Stream API Testing - Sequential Stream Tests            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  const args = process.argv.slice(2);
  const category = args[0];

  const testSets: Record<string, { name: string; streams: DASHTestStream[]; duration: number }> =
    {
      basic: {
        name: 'Basic Live Streams',
        streams: basicLiveStreams,
        duration: 20000,
      },
      latency: {
        name: 'Low-Latency Streams',
        streams: lowLatencyStreams,
        duration: 20000,
      },
      buffer: {
        name: 'Buffer & Window Streams',
        streams: bufferAndWindowStreams,
        duration: 20000,
      },
      period: {
        name: 'Multi-Period Streams',
        streams: multiPeriodStreams,
        duration: 30000, // Longer for period transitions
      },
      all: {
        name: 'All Test Streams',
        streams: [
          ...basicLiveStreams,
          ...lowLatencyStreams,
          ...bufferAndWindowStreams,
          ...multiPeriodStreams,
        ],
        duration: 20000,
      },
    };

  if (!category || !testSets[category]) {
    console.log('\nUsage: npx ts-node test/test-api-streams.ts <category>\n');
    console.log('Available categories:');
    Object.entries(testSets).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(10)} - ${value.name} (${value.streams.length} streams)`);
    });
    console.log('\nExample: npx ts-node test/test-api-streams.ts basic');
    process.exit(0);
  }

  const testSet = testSets[category];
  console.log(`\nTesting category: ${testSet.name}`);
  console.log(`Streams to test: ${testSet.streams.length}`);
  console.log(`Duration per stream: ${testSet.duration / 1000}s\n`);

  for (let i = 0; i < testSet.streams.length; i++) {
    const stream = testSet.streams[i];
    console.log(`\n[${i + 1}/${testSet.streams.length}]`);
    await testStream(stream, testSet.duration);

    // Small delay between tests
    if (i < testSet.streams.length - 1) {
      console.log('\nWaiting 2 seconds before next test...');
      await sleep(2000);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            All Tests Completed                             ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
