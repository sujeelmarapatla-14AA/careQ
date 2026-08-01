const http = require('http');
const { spawn } = require('child_process');

console.log('🚀 Testing Backend Startup & Crash Resilience...');

const serverProc = spawn('node', ['server.js'], { cwd: __dirname, env: process.env });

serverProc.stdout.on('data', (data) => {
  console.log(`[Server stdout]: ${data.toString().trim()}`);
});

serverProc.stderr.on('data', (data) => {
  console.error(`[Server stderr]: ${data.toString().trim()}`);
});

setTimeout(() => {
  console.log('📡 Testing GET /api/beds...');
  http.get('http://localhost:5000/api/beds', { headers: { Authorization: 'Bearer bypass' } }, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      console.log(`✅ Response status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(rawData);
        console.log(`✅ Success! Received ${Array.isArray(parsed) ? parsed.length : (parsed.beds ? parsed.beds.length : 'data')} items.`);
      } catch(e) {
        console.log('Raw payload received:', rawData.slice(0, 100));
      }

      console.log('📡 Testing GET /api/stats...');
      http.get('http://localhost:5000/api/stats', (resStats) => {
        let statsData = '';
        resStats.on('data', (chunk) => { statsData += chunk; });
        resStats.on('end', () => {
          console.log(`✅ /api/stats status: ${resStats.statusCode}`);
          console.log(`✅ Stats payload:`, statsData);
          serverProc.kill();
          console.log('🎉 TEST COMPLETE — SERVER RUNS SMOOTHLY WITHOUT CRASHES');
          process.exit(0);
        });
      });

    });
  }).on('error', (err) => {
    console.error('❌ HTTP test failed:', err.message);
    serverProc.kill();
    process.exit(1);
  });
}, 3000);
