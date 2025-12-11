import { describe, expect, it } from 'vitest';

import { normalizeResponse, normalizeStatus } from '../src/providers/httpProvider';

describe('normalizeStatus', () => {
  it('maps various states to sdk statuses', () => {
    expect(normalizeStatus('queued')).toBe('queued');
    expect(normalizeStatus('pending')).toBe('queued');
    expect(normalizeStatus('running')).toBe('processing');
    expect(normalizeStatus('streaming')).toBe('streaming');
    expect(normalizeStatus('success')).toBe('succeeded');
    expect(normalizeStatus('failed')).toBe('failed');
    expect(normalizeStatus('unexpected')).toBe('processing');
  });
});

describe('normalizeResponse', () => {
  it('normalizes common response shapes', () => {
    const result = normalizeResponse({
      id: 'abc123',
      status: 'completed',
      progress: 80,
      video_url: 'https://example.com/video.mp4',
      preview: 'https://example.com/thumb.jpg'
    });

    expect(result.requestId).toBe('abc123');
    expect(result.status).toBe('succeeded');
    expect(result.progress).toBeCloseTo(0.8);
    expect(result.videoUrl).toContain('video.mp4');
    expect(result.coverUrl).toContain('thumb.jpg');
  });
});
