async function run() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sarji@seznam.cz', password: 'password' })
  });
  const data = await res.json();
  const token = data.token;
  console.log('Login token acquired.');

  console.log('Executing Force Push to align remote repository with our new local auto-healed root commit...');
  const forcePushRes = await fetch('http://localhost:3000/api/admin/github/force-push', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ commitMessage: 'Auto-heal recovery commit (Aligning Remote)' })
  });

  const forcePushData = await forcePushRes.json();
  console.log('Force Push Response:', forcePushData);
}

run();
