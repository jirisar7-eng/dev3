async function run() {
  const fs = require('fs');
  fs.writeFileSync('dummy.txt', 'test');
  
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarji@seznam.cz', password: 'password' })
  });
  const data = await res.json();
  const token = data.token;

  console.log('Executing standard push...');
  const pushRes = await fetch('http://localhost:3000/api/admin/github/push', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ commitMessage: 'chore: dummy test commit' })
  });

  const pushData = await pushRes.json();
  console.log('Standard Push Response:', pushData);
  
  fs.unlinkSync('dummy.txt');
}

run();
