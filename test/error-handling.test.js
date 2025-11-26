/**
 * Test error handling for XML_PARSE_ERROR
 */
const { DASHMonitor, MPDLoader, MPDParseError, MPDFetchError } = require('../dist');

console.log('Running error handling tests...\n');

// Test 1: MPDLoader with invalid XML
console.log('Test 1: MPDLoader with invalid XML');
try {
  const loader = new MPDLoader();
  loader.parse('<invalid>not a valid MPD</invalid>', 'http://example.com/test.mpd');
  console.log('❌ Should have thrown MPDParseError');
  process.exit(1);
} catch (error) {
  if (error instanceof MPDParseError) {
    console.log('✓ Correctly threw MPDParseError:', error.message);
  } else {
    console.log('❌ Wrong error type:', error.constructor.name);
    process.exit(1);
  }
}

// Test 2: MPDLoader with non-XML content
console.log('\nTest 2: MPDLoader with non-XML content');
try {
  const loader = new MPDLoader();
  loader.parse('This is not XML at all', 'http://example.com/test.mpd');
  console.log('❌ Should have thrown MPDParseError');
  process.exit(1);
} catch (error) {
  if (error instanceof MPDParseError) {
    console.log('✓ Correctly threw MPDParseError:', error.message);
  } else {
    console.log('❌ Wrong error type:', error.constructor.name);
    process.exit(1);
  }
}

// Test 3: Verify error classes are exported
console.log('\nTest 3: Verify error classes are exported');
if (typeof MPDParseError === 'function' && typeof MPDFetchError === 'function') {
  console.log('✓ Error classes are properly exported');
} else {
  console.log('❌ Error classes not exported correctly');
  process.exit(1);
}

// Test 4: Verify error inheritance
console.log('\nTest 4: Verify error inheritance');
const parseError = new MPDParseError('Test parse error');
const fetchError = new MPDFetchError('Test fetch error', 404);
if (parseError instanceof Error && fetchError instanceof Error) {
  console.log('✓ Error classes inherit from Error');
  console.log('  - MPDParseError name:', parseError.name);
  console.log('  - MPDFetchError name:', fetchError.name);
  console.log('  - MPDFetchError statusCode:', fetchError.statusCode);
} else {
  console.log('❌ Error classes do not inherit from Error');
  process.exit(1);
}

// Test 5: Check isValidXML static method
console.log('\nTest 5: Check isValidXML static method');
const validXml1 = '<?xml version="1.0"?><MPD></MPD>';
const validXml2 = '<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"></MPD>';
const invalidXml1 = 'not xml';
const invalidXml2 = '<html>not MPD</html>';

if (MPDLoader.isValidXML(validXml1) &&
    MPDLoader.isValidXML(validXml2) &&
    !MPDLoader.isValidXML(invalidXml1) &&
    !MPDLoader.isValidXML(invalidXml2)) {
  console.log('✓ isValidXML works correctly');
} else {
  console.log('❌ isValidXML validation failed');
  console.log('  validXml1:', MPDLoader.isValidXML(validXml1));
  console.log('  validXml2:', MPDLoader.isValidXML(validXml2));
  console.log('  invalidXml1:', MPDLoader.isValidXML(invalidXml1));
  console.log('  invalidXml2:', MPDLoader.isValidXML(invalidXml2));
  process.exit(1);
}

console.log('\n✅ All error handling tests passed!');
