async function test() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarji@seznam.cz', password: 'password' })
  });
  const data = await res.json();
  const token = data.token;
  
  const usersRes = await fetch('http://localhost:3000/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Users status:', usersRes.status);
  const usersData = await usersRes.json();
  console.log('Users fetched:', Array.isArray(usersData) ? usersData.length : usersData);
}

test();
