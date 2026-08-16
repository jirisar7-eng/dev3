const http = require('http');

const req = http.get('http://localhost:3000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Health:', data));
});
req.on('error', console.error);
