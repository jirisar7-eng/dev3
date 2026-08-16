const fetch = require('node-fetch');

async function test() {
  console.log('Logging in...');
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarji@seznam.cz', password: 'password' })
  });
  
  if (!res.ok) {
    console.error('Login failed', res.status);
    return;
  }
  
  const data = await res.json();
  const token = data.token;
  console.log('Login OK, checking github status...');
  
  const statusRes = await fetch('http://localhost:3000/api/admin/github/status', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const statusData = await statusRes.json();
  console.log('Status Response:', statusData);
}

test();
