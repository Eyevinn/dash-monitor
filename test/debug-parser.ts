import { parse } from 'mpd-parser';
import fetch from 'node-fetch';

async function debugParser() {
  const url = 'https://livesim.dashif.org/livesi2m/testpic_2s/Manifest.mpd';
  const response = await fetch(url);
  const manifestText = await response.text();

  const parsed = parse(manifestText, { manifestUri: url });

  console.log('=== Parser Output Keys ===');
  console.log(Object.keys(parsed));

  console.log('\n=== Looking for availability/time fields ===');
  Object.keys(parsed).forEach(key => {
    if (key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('availability') ||
        key.toLowerCase().includes('shift') ||
        key.toLowerCase().includes('delay') ||
        key.toLowerCase().includes('publish')) {
      console.log(`${key}:`, parsed[key]);
    }
  });

  console.log('\n=== Full parsed object (first level) ===');
  console.log(JSON.stringify(parsed, null, 2).substring(0, 2000));
}

debugParser().catch(console.error);
