/**
 * Tests for ErrorsList
 */
import { ErrorsList } from '../src/ErrorsList';
import { MonitorError, ErrorType, MediaType } from '../src/types';

describe('ErrorsList', () => {
  it('should add errors', () => {
    const list = new ErrorsList(10);

    const error: MonitorError = {
      id: '1',
      timestamp: new Date().toISOString(),
      errorType: ErrorType.MANIFEST_FETCH_ERROR,
      mediaType: MediaType.MASTER,
      description: 'Test error',
      streamUrl: 'https://example.com/stream.mpd',
      streamId: 'test-stream'
    };

    list.add(error);

    expect(list.count()).toBe(1);
    expect(list.getAll()).toHaveSize(1);
  });

  it('should enforce FIFO limit', () => {
    const list = new ErrorsList(3);

    for (let i = 0; i < 5; i++) {
      list.add({
        id: `error-${i}`,
        timestamp: new Date().toISOString(),
        errorType: ErrorType.MANIFEST_FETCH_ERROR,
        mediaType: MediaType.MASTER,
        description: `Error ${i}`,
        streamUrl: 'https://example.com/stream.mpd',
        streamId: 'test-stream'
      });
    }

    expect(list.count()).toBe(3);

    const errors = list.getAll();
    // Should have the last 3 errors (2, 3, 4)
    expect(errors[0].id).toBe('error-2');
    expect(errors[2].id).toBe('error-4');
  });

  it('should clear all errors', () => {
    const list = new ErrorsList(10);

    list.add({
      id: '1',
      timestamp: new Date().toISOString(),
      errorType: ErrorType.MANIFEST_FETCH_ERROR,
      mediaType: MediaType.MASTER,
      description: 'Test error',
      streamUrl: 'https://example.com/stream.mpd',
      streamId: 'test-stream'
    });

    expect(list.count()).toBe(1);

    list.clear();

    expect(list.count()).toBe(0);
  });

  it('should auto-generate error IDs if missing', () => {
    const list = new ErrorsList(10);

    const errorWithoutId: any = {
      timestamp: new Date().toISOString(),
      errorType: ErrorType.MANIFEST_FETCH_ERROR,
      mediaType: MediaType.MASTER,
      description: 'Test error',
      streamUrl: 'https://example.com/stream.mpd',
      streamId: 'test-stream'
    };

    list.add(errorWithoutId);

    const errors = list.getAll();
    expect(errors[0].id).toBeDefined();
  });
});
