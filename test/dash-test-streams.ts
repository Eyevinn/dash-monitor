/**
 * DASH Test Streams for Enhanced Feature Testing
 *
 * This file contains curated test streams from the DASH Industry Forum
 * for testing the enhanced DASH monitoring features.
 *
 * Sources:
 * - https://github.com/Dash-Industry-Forum/dash-live-source-simulator/wiki/Test-URLs
 * - https://livesim.dashif.org/
 * - https://livesim2.dashif.org/
 */

export interface DASHTestStream {
  name: string;
  url: string;
  type: 'live' | 'vod';
  description: string;
  features: string[];
  testPurpose: string[];
}

/**
 * Basic Live Streaming Test Streams
 */
export const basicLiveStreams: DASHTestStream[] = [
  {
    name: 'Basic Live Stream (2s segments)',
    url: 'https://livesim.dashif.org/livesim2/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Continuous 24/7 live stream with 2-second segments',
    features: ['$Number$ template', 'dynamic', 'continuous'],
    testPurpose: ['staleness detection', 'publish time progression', 'basic validation'],
  },
  {
    name: 'SegmentTimeline Based Stream',
    url: 'https://livesim.dashif.org/livesim2/segtimeline_1/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Live stream using SegmentTimeline instead of $Number$',
    features: ['SegmentTimeline', 'dynamic', 'timeline-based indexing'],
    testPurpose: ['segment timeline validation', 'timeline consistency'],
  },
];

/**
 * Low-Latency DASH Test Streams
 */
export const lowLatencyStreams: DASHTestStream[] = [
  {
    name: 'Low-Latency with Chunked Transfer (1s chunks)',
    url: 'https://livesim.dashif.org/livesim2/chunkdur_1/ato_7/testpic4_8s/Manifest.mpd',
    type: 'live',
    description: '8-second segments chunked into 1-second pieces with availabilityTimeOffset=7',
    features: ['chunked transfer', 'ato=7', 'low-latency', 'HTTP/1.1'],
    testPurpose: [
      'latency measurement',
      'low-latency validation',
      'progressive delivery',
    ],
  },
  {
    name: 'Ultra Low-Latency (0.5s chunks)',
    url: 'https://livesim.dashif.org/livesim2/chunkdur_0.5/ato_7/testpic4_8s/Manifest.mpd',
    type: 'live',
    description: 'Sub-second chunk durations for extreme low-latency scenarios',
    features: ['chunked transfer', 'ato=7', 'ultra-low-latency', '0.5s chunks'],
    testPurpose: ['extreme latency testing', 'sub-second latency validation'],
  },
];

/**
 * Time Shift Buffer & Availability Window Test Streams
 */
export const bufferAndWindowStreams: DASHTestStream[] = [
  {
    name: 'Custom Buffer Depth (500s DVR)',
    url: 'https://livesim.dashif.org/livesim2/mup_300/tsbd_500/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Stream with 500s timeShiftBufferDepth and 300s minimumUpdatePeriod',
    features: ['timeShiftBufferDepth=500s', 'minimumUpdatePeriod=300s', 'DVR window'],
    testPurpose: [
      'time shift buffer validation',
      'availability window validation',
      'DVR functionality',
      'buffer depth checks',
    ],
  },
  {
    name: 'Delayed Start (30min offset)',
    url: 'https://livesim.dashif.org/livesim2/start_1800/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Stream with 30-minute offset on availabilityStartTime',
    features: ['delayed start', 'availabilityStartTime offset', '30min delay'],
    testPurpose: ['presentation delay validation', 'start time validation'],
  },
  {
    name: 'Startover Interval (20s window)',
    url: 'https://livesim.dashif.org/livesim2/timeoffset_-20/timeoffset_20/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Startover interval from now-20s to now+20s',
    features: ['startover', 'time offset', 'backward playback'],
    testPurpose: ['backward playback capability', 'time offset handling'],
  },
];

/**
 * Multi-Period Test Streams
 */
export const multiPeriodStreams: DASHTestStream[] = [
  {
    name: 'Frequent Period Changes (20 periods/hour)',
    url: 'https://livesim.dashif.org/livesim2/periods_20/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'New period every 3 minutes (20 periods per hour)',
    features: ['multi-period', 'frequent transitions', '3min intervals'],
    testPurpose: [
      'period transition validation',
      'gap detection',
      'overlap detection',
      'transition handling',
    ],
  },
  {
    name: 'High-Frequency Periods with Continuity (60/hour)',
    url: 'https://livesim.dashif.org/livesim2/periods_60/continuous_1/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Period every minute with period-continuity signaling',
    features: ['multi-period', 'continuity signaling', '1min intervals', 'seamless transitions'],
    testPurpose: [
      'multi-period transition validation',
      'seamless period handoff',
      'continuity validation',
      'high-frequency transitions',
    ],
  },
  {
    name: 'Early Terminated Periods',
    url: 'https://livesim.dashif.org/livesim2/periods_60/etp_30/etpDuration_10/testpic_2s/Manifest.mpd',
    type: 'live',
    description: '30 early-terminated periods per hour with 10-second duration',
    features: ['multi-period', 'early termination', 'abrupt closures'],
    testPurpose: ['abrupt period closure handling', 'early termination validation'],
  },
];

/**
 * MPD Patching Test Streams
 */
export const mpdPatchingStreams: DASHTestStream[] = [
  {
    name: 'MPD Patch with Timeline',
    url: 'https://livesim2.dashif.org/livesim2/patch_60/segtimeline_1/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Stream with HTTP PATCH support for efficient manifest updates',
    features: ['MPD patching', 'SegmentTimeline', 'HTTP PATCH'],
    testPurpose: ['MPD update validation', 'patch mechanism testing'],
  },
];

/**
 * Advanced Feature Test Streams
 */
export const advancedStreams: DASHTestStream[] = [
  {
    name: 'Mixed Duration (6s audio, 2s video)',
    url: 'https://livesim.dashif.org/livesim2/testpic_2s/Manifest.mpd',
    type: 'live',
    description: 'Different segment durations for audio and video',
    features: ['mixed durations', 'audio/video sync'],
    testPurpose: ['segment duration validation', 'A/V synchronization'],
  },
  {
    name: 'With Thumbnails',
    url: 'https://livesim.dashif.org/livesim2/testpic_2s/Manifest_thumbs.mpd',
    type: 'live',
    description: 'Stream with separate AdaptationSet for thumbnails',
    features: ['thumbnails', 'scrub-bar previews', 'multiple adaptation sets'],
    testPurpose: ['thumbnail validation', 'multiple adaptation set handling'],
  },
  {
    name: 'With Subtitles (EBU-TT-D)',
    url: 'https://livesim.dashif.org/livesim2/testpic_2s/Manifest_stpp.mpd',
    type: 'live',
    description: 'Stream with EBU-TT-D live captions',
    features: ['subtitles', 'EBU-TT-D', 'live captions'],
    testPurpose: ['subtitle validation', 'caption synchronization'],
  },
];

/**
 * All Test Streams Combined
 */
export const allTestStreams: DASHTestStream[] = [
  ...basicLiveStreams,
  ...lowLatencyStreams,
  ...bufferAndWindowStreams,
  ...multiPeriodStreams,
  ...mpdPatchingStreams,
  ...advancedStreams,
];

/**
 * Get streams by test purpose
 */
export function getStreamsByPurpose(purpose: string): DASHTestStream[] {
  return allTestStreams.filter((stream) =>
    stream.testPurpose.some((p) => p.toLowerCase().includes(purpose.toLowerCase()))
  );
}

/**
 * Get streams by feature
 */
export function getStreamsByFeature(feature: string): DASHTestStream[] {
  return allTestStreams.filter((stream) =>
    stream.features.some((f) => f.toLowerCase().includes(feature.toLowerCase()))
  );
}

/**
 * Recommended test configuration for each feature category
 */
export const recommendedTestConfigs = {
  latencyTesting: {
    streams: lowLatencyStreams,
    options: {
      monitorInterval: 3000,
      logConsole: true,
    },
  },
  bufferTesting: {
    streams: bufferAndWindowStreams,
    options: {
      monitorInterval: 5000,
      logConsole: true,
    },
  },
  multiPeriodTesting: {
    streams: multiPeriodStreams,
    options: {
      monitorInterval: 2000,
      logConsole: true,
    },
  },
  segmentAvailabilityTesting: {
    streams: basicLiveStreams,
    options: {
      enableSegmentAvailabilityCheck: true,
      segmentCheckSampleSize: 5,
      monitorInterval: 10000,
      logConsole: true,
    },
  },
  comprehensiveTesting: {
    streams: [
      basicLiveStreams[0],
      lowLatencyStreams[0],
      bufferAndWindowStreams[0],
      multiPeriodStreams[1],
    ],
    options: {
      enableSegmentAvailabilityCheck: true,
      segmentCheckSampleSize: 3,
      monitorInterval: 5000,
      staleLimit: 10000,
      errorLimit: 20,
      logConsole: true,
    },
  },
};
