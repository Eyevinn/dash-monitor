/**
 * Test enhanced validation logic
 */
const { ErrorMessages, formatDuration, formatBytes, formatBitrate } = require('../dist');

console.log('Running validation tests...\n');

// Test 1: Error messages module is exported
console.log('Test 1: Error messages module is exported');
if (typeof ErrorMessages === 'object') {
  console.log('✓ ErrorMessages is exported');
  console.log('  - Available message templates:', Object.keys(ErrorMessages).length);
} else {
  console.log('❌ ErrorMessages not exported correctly');
  process.exit(1);
}

// Test 2: Error messages produce consistent output
console.log('\nTest 2: Error messages produce consistent output');
const fetchError = ErrorMessages.FETCH_HTTP_ERROR(404, 'Not Found');
if (fetchError === 'HTTP 404: Not Found') {
  console.log('✓ FETCH_HTTP_ERROR produces expected format');
  console.log('  - Message:', fetchError);
} else {
  console.log('❌ Unexpected format:', fetchError);
  process.exit(1);
}

const parseError = ErrorMessages.PARSE_INVALID_XML();
if (parseError.includes('Invalid XML')) {
  console.log('✓ PARSE_INVALID_XML produces expected format');
  console.log('  - Message:', parseError);
} else {
  console.log('❌ Unexpected format:', parseError);
  process.exit(1);
}

// Test 3: Structure error messages
console.log('\nTest 3: Structure error messages');
const structureError = ErrorMessages.STRUCTURE_MISSING_TYPE();
if (structureError.includes('type')) {
  console.log('✓ STRUCTURE_MISSING_TYPE produces expected format');
  console.log('  - Message:', structureError);
} else {
  console.log('❌ Unexpected format:', structureError);
  process.exit(1);
}

// Test 4: Segment error messages with parameters
console.log('\nTest 4: Segment error messages with parameters');
const segmentGap = ErrorMessages.SEGMENT_TIMELINE_GAP(5, 10.0, 10.5, 0.5);
if (segmentGap.includes('segment 5') && segmentGap.includes('10') && segmentGap.includes('10.5')) {
  console.log('✓ SEGMENT_TIMELINE_GAP produces expected format');
  console.log('  - Message:', segmentGap);
} else {
  console.log('❌ Unexpected format:', segmentGap);
  process.exit(1);
}

const segmentMissing = ErrorMessages.SEGMENT_MISSING_DURATION(3);
if (segmentMissing.includes('Segment 3') && segmentMissing.includes('duration')) {
  console.log('✓ SEGMENT_MISSING_DURATION produces expected format');
  console.log('  - Message:', segmentMissing);
} else {
  console.log('❌ Unexpected format:', segmentMissing);
  process.exit(1);
}

// Test 5: Codec/Bitrate error messages
console.log('\nTest 5: Codec/Bitrate error messages');
const codecInvalid = ErrorMessages.CODEC_INVALID('xyz123', 'Unrecognized format');
if (codecInvalid.includes('xyz123') && codecInvalid.includes('Unrecognized')) {
  console.log('✓ CODEC_INVALID produces expected format');
  console.log('  - Message:', codecInvalid);
} else {
  console.log('❌ Unexpected format:', codecInvalid);
  process.exit(1);
}

const bitrateInvalid = ErrorMessages.BITRATE_INVALID(50, 1000, 100000000);
if (bitrateInvalid.includes('50') && bitrateInvalid.includes('1000') && bitrateInvalid.includes('100000000')) {
  console.log('✓ BITRATE_INVALID produces expected format');
  console.log('  - Message:', bitrateInvalid);
} else {
  console.log('❌ Unexpected format:', bitrateInvalid);
  process.exit(1);
}

// Test 6: Publish time error messages
console.log('\nTest 6: Publish time error messages');
const publishTimeError = ErrorMessages.PUBLISH_TIME_BACKWARDS(1000, 900, 100);
if (publishTimeError.includes('backwards') && publishTimeError.includes('100')) {
  console.log('✓ PUBLISH_TIME_BACKWARDS produces expected format');
  console.log('  - Message:', publishTimeError);
} else {
  console.log('❌ Unexpected format:', publishTimeError);
  process.exit(1);
}

// Test 7: Period continuity error messages
console.log('\nTest 7: Period continuity error messages');
const periodError = ErrorMessages.PERIOD_START_BACKWARDS(2, 1, 5.0, 10.0);
if (periodError.includes('Period 2') && periodError.includes('period 1')) {
  console.log('✓ PERIOD_START_BACKWARDS produces expected format');
  console.log('  - Message:', periodError);
} else {
  console.log('❌ Unexpected format:', periodError);
  process.exit(1);
}

// Test 8: Stale manifest error messages
console.log('\nTest 8: Stale manifest error messages');
const staleError = ErrorMessages.STALE_NO_UPDATE(15000, 1234567890);
if (staleError.includes('15000') && staleError.includes('1234567890')) {
  console.log('✓ STALE_NO_UPDATE produces expected format');
  console.log('  - Message:', staleError);
} else {
  console.log('❌ Unexpected format:', staleError);
  process.exit(1);
}

// Test 9: Format helper functions
console.log('\nTest 9: Format helper functions');

// Test formatDuration
const duration1 = formatDuration(500);
const duration2 = formatDuration(5000);
const duration3 = formatDuration(90000);
const duration4 = formatDuration(7200000);

if (duration1 === '500ms' && duration2 === '5.0s' && duration3 === '1.5m' && duration4 === '2.0h') {
  console.log('✓ formatDuration works correctly');
  console.log('  - 500ms:', duration1);
  console.log('  - 5000ms:', duration2);
  console.log('  - 90000ms:', duration3);
  console.log('  - 7200000ms:', duration4);
} else {
  console.log('❌ formatDuration produced unexpected results');
  console.log('  Expected: 500ms, 5.0s, 1.5m, 2.0h');
  console.log('  Got:', duration1, duration2, duration3, duration4);
  process.exit(1);
}

// Test formatBytes
const bytes1 = formatBytes(500);
const bytes2 = formatBytes(5000);
const bytes3 = formatBytes(5000000);
const bytes4 = formatBytes(5000000000);

if (bytes1 === '500B' && bytes2 === '4.9KB' && bytes3 === '4.8MB' && bytes4 === '4.7GB') {
  console.log('✓ formatBytes works correctly');
  console.log('  - 500B:', bytes1);
  console.log('  - 5000B:', bytes2);
  console.log('  - 5000000B:', bytes3);
  console.log('  - 5000000000B:', bytes4);
} else {
  console.log('❌ formatBytes produced unexpected results');
  console.log('  Expected: 500B, 4.9KB, 4.8MB, 4.7GB');
  console.log('  Got:', bytes1, bytes2, bytes3, bytes4);
  process.exit(1);
}

// Test formatBitrate
const bitrate1 = formatBitrate(500);
const bitrate2 = formatBitrate(5000);
const bitrate3 = formatBitrate(5000000);

if (bitrate1 === '500bps' && bitrate2 === '5.0Kbps' && bitrate3 === '5.0Mbps') {
  console.log('✓ formatBitrate works correctly');
  console.log('  - 500bps:', bitrate1);
  console.log('  - 5000bps:', bitrate2);
  console.log('  - 5000000bps:', bitrate3);
} else {
  console.log('❌ formatBitrate produced unexpected results');
  console.log('  Expected: 500bps, 5.0Kbps, 5.0Mbps');
  console.log('  Got:', bitrate1, bitrate2, bitrate3);
  process.exit(1);
}

// Test 10: Segment availability error messages
console.log('\nTest 10: Segment availability error messages');
const segmentNotAvailable = ErrorMessages.SEGMENT_NOT_AVAILABLE('http://example.com/seg1.m4s', 404);
if (segmentNotAvailable.includes('example.com') && segmentNotAvailable.includes('404')) {
  console.log('✓ SEGMENT_NOT_AVAILABLE produces expected format');
  console.log('  - Message:', segmentNotAvailable);
} else {
  console.log('❌ Unexpected format:', segmentNotAvailable);
  process.exit(1);
}

const tooManyUnavailable = ErrorMessages.SEGMENT_TOO_MANY_UNAVAILABLE(3, 5, 60.0);
if (tooManyUnavailable.includes('3/5') && tooManyUnavailable.includes('60.0%')) {
  console.log('✓ SEGMENT_TOO_MANY_UNAVAILABLE produces expected format');
  console.log('  - Message:', tooManyUnavailable);
} else {
  console.log('❌ Unexpected format:', tooManyUnavailable);
  process.exit(1);
}

// Test 11: Resolution validation messages
console.log('\nTest 11: Resolution validation messages');
const resolutionInvalid = ErrorMessages.RESOLUTION_INVALID(1920, 1080, 'Test reason');
if (resolutionInvalid.includes('1920x1080') && resolutionInvalid.includes('Test reason')) {
  console.log('✓ RESOLUTION_INVALID produces expected format');
  console.log('  - Message:', resolutionInvalid);
} else {
  console.log('❌ Unexpected format:', resolutionInvalid);
  process.exit(1);
}

console.log('\n✅ All validation tests passed!');
