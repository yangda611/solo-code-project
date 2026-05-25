const http = require('http');

const postData = JSON.stringify({
  samples: Array.from({ length: 10000 }, () => Math.random() * 0.5),
  sampleRate: 44100
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/audio/spectrogram',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing Spectrogram API...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log(`Success! Spectrogram frames: ${result.spectrogram?.length || 0}`);
      if (result.spectrogram?.length > 0) {
        console.log(`First frame bins: ${result.spectrogram[0].length}`);
        console.log(`Test PASSED ✓`);
      } else {
        console.log(`Empty result, but no error`);
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Raw response:', data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(postData);
req.end();
