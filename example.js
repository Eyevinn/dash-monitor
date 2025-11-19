/**
 * Example usage of DASH Monitor
 */
const { DASHMonitor } = require('./dist');

// Example 1: Monitor a single DASH stream
async function example1() {
  console.log('Example 1: Monitor a single DASH stream');

  const monitor = new DASHMonitor([
    'https://example.com/stream.mpd'
  ], {
    staleLimit: 6000,
    monitorInterval: 3000
  });

  // Start monitoring
  await monitor.start();

  // Check errors after 10 seconds
  setTimeout(() => {
    const errors = monitor.getErrors();
    console.log(`Found ${errors.length} errors:`, errors);

    monitor.stop();
  }, 10000);
}

// Example 2: Monitor multiple streams with custom IDs
async function example2() {
  console.log('Example 2: Monitor multiple streams with custom IDs');

  const monitor = new DASHMonitor([
    { url: 'https://example.com/stream1.mpd', id: 'stream-1' },
    { url: 'https://example.com/stream2.mpd', id: 'stream-2' }
  ]);

  await monitor.start();

  // Add more streams dynamically
  setTimeout(async () => {
    await monitor.update([
      { url: 'https://example.com/stream3.mpd', id: 'stream-3' }
    ]);
    console.log('Added stream-3');
  }, 5000);

  // Remove a stream
  setTimeout(async () => {
    await monitor.removeStream('stream-2');
    console.log('Removed stream-2');
  }, 10000);
}

// Example 3: Using the service
const { DASHMonitorService } = require('./dist');

async function example3() {
  console.log('Example 3: Start HTTP service');

  const service = new DASHMonitorService(8080);
  await service.start();

  console.log('Service started on port 8080');
  console.log('API endpoints:');
  console.log('  POST   /monitor              - Create monitor');
  console.log('  GET    /monitor              - List monitors');
  console.log('  GET    /monitor/:id/status   - Get status');
  console.log('  GET    /metrics              - Prometheus metrics');
}

// Run example
if (require.main === module) {
  // Uncomment the example you want to run:
  // example1();
  // example2();
  example3();
}
