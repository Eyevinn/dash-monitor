/**
 * Basic integration tests
 */
const { DASHMonitor, State } = require('../dist');

console.log('Running basic tests...\n');

// Test 1: Create monitor
console.log('Test 1: Create DASHMonitor');
try {
  const monitor = new DASHMonitor(['https://example.com/stream.mpd']);
  console.log('✓ Monitor created with ID:', monitor.getMonitorId());
  console.log('✓ Initial state:', monitor.getState());
  console.log('✓ Streams:', monitor.getStreams().length);
} catch (error) {
  console.error('✗ Failed:', error.message);
  process.exit(1);
}

// Test 2: Multiple streams
console.log('\nTest 2: Multiple streams');
try {
  const monitor = new DASHMonitor([
    'https://example.com/stream1.mpd',
    'https://example.com/stream2.mpd'
  ]);
  const streams = monitor.getStreams();
  if (streams.length !== 2) {
    throw new Error(`Expected 2 streams, got ${streams.length}`);
  }
  console.log('✓ Created monitor with', streams.length, 'streams');
} catch (error) {
  console.error('✗ Failed:', error.message);
  process.exit(1);
}

// Test 3: Custom stream IDs
console.log('\nTest 3: Custom stream IDs');
try {
  const monitor = new DASHMonitor([
    { url: 'https://example.com/stream1.mpd', id: 'custom-1' },
    { url: 'https://example.com/stream2.mpd', id: 'custom-2' }
  ]);
  const streams = monitor.getStreams();
  if (streams[0].id !== 'custom-1') {
    throw new Error('Custom ID not preserved');
  }
  console.log('✓ Custom IDs:', streams.map(s => s.id).join(', '));
} catch (error) {
  console.error('✗ Failed:', error.message);
  process.exit(1);
}

// Test 4: Update streams
console.log('\nTest 4: Update streams');
(async () => {
  try {
    const monitor = new DASHMonitor(['https://example.com/stream1.mpd']);
    await monitor.update(['https://example.com/stream2.mpd']);
    const streams = monitor.getStreams();
    if (streams.length !== 2) {
      throw new Error(`Expected 2 streams after update, got ${streams.length}`);
    }
    console.log('✓ Updated to', streams.length, 'streams');
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  // Test 5: Remove stream
  console.log('\nTest 5: Remove stream');
  try {
    const monitor = new DASHMonitor([
      { url: 'https://example.com/stream1.mpd', id: 'stream-1' },
      { url: 'https://example.com/stream2.mpd', id: 'stream-2' }
    ]);
    await monitor.removeStream('stream-1');
    const streams = monitor.getStreams();
    if (streams.length !== 1) {
      throw new Error(`Expected 1 stream after removal, got ${streams.length}`);
    }
    console.log('✓ Removed stream, remaining:', streams.length);
  } catch (error) {
    console.error('✗ Failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ All basic tests passed!');
})();
