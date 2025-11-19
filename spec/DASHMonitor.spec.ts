/**
 * Tests for DASHMonitor
 */
import { DASHMonitor } from '../src/DASHMonitor';
import { State, ErrorType } from '../src/types';

describe('DASHMonitor', () => {
  it('should create a monitor with a single stream', () => {
    const monitor = new DASHMonitor(['https://example.com/stream.mpd']);

    expect(monitor.getMonitorId()).toBeDefined();
    expect(monitor.getState()).toBe(State.IDLE);
    expect(monitor.getStreams()).toHaveSize(1);
  });

  it('should create a monitor with multiple streams', () => {
    const monitor = new DASHMonitor([
      'https://example.com/stream1.mpd',
      'https://example.com/stream2.mpd'
    ]);

    expect(monitor.getStreams()).toHaveSize(2);
  });

  it('should normalize stream IDs', () => {
    const monitor = new DASHMonitor([
      { url: 'https://example.com/stream.mpd', id: 'custom-id' }
    ]);

    const streams = monitor.getStreams();
    expect(streams[0].id).toBe('custom-id');
  });

  it('should handle duplicate stream IDs', () => {
    const monitor = new DASHMonitor([
      'https://example.com/stream1.mpd',
      'https://example.com/stream2.mpd'
    ]);

    const streams = monitor.getStreams();
    const ids = streams.map(s => s.id);

    // Check all IDs are unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should update monitor with new streams', async () => {
    const monitor = new DASHMonitor(['https://example.com/stream1.mpd']);

    expect(monitor.getStreams()).toHaveSize(1);

    await monitor.update(['https://example.com/stream2.mpd']);

    expect(monitor.getStreams()).toHaveSize(2);
  });

  it('should remove a stream', async () => {
    const monitor = new DASHMonitor([
      { url: 'https://example.com/stream1.mpd', id: 'stream-1' },
      { url: 'https://example.com/stream2.mpd', id: 'stream-2' }
    ]);

    expect(monitor.getStreams()).toHaveSize(2);

    const removed = await monitor.removeStream('stream-1');

    expect(removed).toBe(true);
    expect(monitor.getStreams()).toHaveSize(1);
  });

  it('should clear errors', () => {
    const monitor = new DASHMonitor(['https://example.com/stream.mpd']);

    monitor.clearErrors();

    const errors = monitor.getErrors();
    expect(errors).toHaveSize(0);
  });

  it('should track monitor state', () => {
    const monitor = new DASHMonitor(['https://example.com/stream.mpd']);

    expect(monitor.getState()).toBe(State.IDLE);

    monitor.stop();

    expect(monitor.getState()).toBe(State.INACTIVE);
  });
});
