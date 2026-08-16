async function test() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarji@seznam.cz', password: 'password' })
  });
  const data = await res.json();
  const token = data.token;
  console.log('Token is:', token ? token.substring(0, 10) + '...' : 'undefined');
  
  const statusRes = await fetch('http://localhost:3000/api/admin/github/status', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status HTTP code:', statusRes.status);
  const statusData = await statusRes.json();
  console.log('Status Response:', statusData);
}

test();
