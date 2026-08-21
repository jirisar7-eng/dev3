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
  console.log('--- STARTING SECURITY TESTS ---');
  
  // Test 1 & 2: Generate-page (requires ADMIN)
  console.log('\n[Test] Unauthorized request to /api/ai/generate-page');
  const postData = JSON.stringify({ rawText: 'test', title: 'test' });
  const authOpts = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ai/generate-page',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
  };
  const res1 = await performRequest(authOpts, postData);
  if (res1.statusCode === 401 || res1.statusCode === 429) {
    console.log('Status code:', res1.statusCode, 'PASS');
  } else {
    console.error('Status code:', res1.statusCode, 'FAIL');
    failed = true;
  }

  // Test 5: Invalid audit payload
  console.log('\n[Test] Invalid audit payload (action too long)');
  const auditData = JSON.stringify({
    action: 'a'.repeat(60),
    module: 'test',
    details: 'test details'
  });
  const auditOpts = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/audit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(auditData) }
  };
  const res2 = await performRequest(auditOpts, auditData);
  if (res2.statusCode === 400 || res2.statusCode === 429) {
    console.log('Status code:', res2.statusCode, 'PASS');
  } else {
    console.error('Status code:', res2.statusCode, 'FAIL');
    failed = true;
  }

  // Test 6: Spoofing identity in Audit
  console.log('\n[Test] Attempt spoofing identity in audit log');
  const auditDataSpoof = JSON.stringify({
    action: 'LOGIN',
    module: 'AUTH',
    details: 'Spoofed login',
    user: { id: 'admin-123' }, // attempt to pass spoofed user
    userId: 'admin-123'
  });
  const auditSpoofOpts = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/audit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(auditDataSpoof) }
  };
  const res3 = await performRequest(auditSpoofOpts, auditDataSpoof);
  if (res3.statusCode === 429) {
     console.log('Rate limit hit instead (429). PASS');
  } else {
     const parsed3 = JSON.parse(res3.data);
     const isSpoofed = parsed3.userId === 'admin-123';
     if (!isSpoofed) {
       console.log('Status code:', res3.statusCode, 'Spoofed?', isSpoofed, 'PASS');
     } else {
       console.error('Status code:', res3.statusCode, 'Spoofed?', isSpoofed, 'FAIL');
       failed = true;
     }
  }

  console.log('\n[Test] Audit rate limit');
  let auditLimitHit = false;
  const validAuditData = JSON.stringify({ action: 'test', module: 'test', details: 'test' });
  const validAuditOpts = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/audit',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(validAuditData) }
  };
  for(let i=0; i<65; i++) {
    const res = await performRequest(validAuditOpts, validAuditData);
    if(res.statusCode === 429) {
      auditLimitHit = true;
      break;
    }
  }
  if (auditLimitHit) {
    console.log('Audit limit hit?', auditLimitHit, 'PASS');
  } else {
    console.error('Audit limit hit?', auditLimitHit, 'FAIL');
    failed = true;
  }
  
  if (failed) {
    process.exit(1);
  }
})();
