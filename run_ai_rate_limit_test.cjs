const http = require('http');
const performRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};
(async () => {
  let failed = false;
  console.log('\n[Test] AI rate limit (/api/ai/biff-convert)');
  let hitLimit = false;
  const biffData = JSON.stringify({ rawMessage: '' }); 
  const biffOpts = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai/biff-convert',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(biffData) }
  };
  
  
  console.log('\n[Test] AI payload limit (> 30000 chars)');
  const largePayload = JSON.stringify({ rawMessage: 'a'.repeat(30001) });
  const payloadOpts = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai/biff-convert',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(largePayload) }
  };
  const payloadRes = await performRequest(payloadOpts, largePayload);
  if (payloadRes.statusCode === 413) {
    console.log('AI payload limit hit? true PASS');
  } else {
    console.error('AI payload limit hit? false FAIL', payloadRes.statusCode);
    failed = true;
  }

  for(let i=0; i<20; i++) {
    const res = await performRequest(biffOpts, biffData);
    if(res.statusCode === 429) {
      hitLimit = true;
      break;
    }
  }
  if (hitLimit) {
    console.log('AI limit hit?', hitLimit, 'PASS');
  } else {
    console.error('AI limit hit?', hitLimit, 'FAIL');
    failed = true;
  }

  if (failed) process.exit(1);
})();
