export const getMailcowConfig = () => {
  const apiUrl = process.env.MAILCOW_API_URL || 'https://mail.tatovacesta.cz/api/v1';
  const apiKey = process.env.MAILCOW_API_KEY;
  if (!apiKey) {
    throw new Error('Chybí konfigurace MAILCOW_API_KEY.');
  }
  return { apiUrl, apiKey };
};

export const getMailcowMailboxes = async () => {
  const { apiUrl, apiKey } = getMailcowConfig();
  const response = await fetch(`${apiUrl}/get/mailbox/all`, {
    headers: { 'X-API-Key': apiKey }
  });
  if (!response.ok) throw new Error('Chyba při načítání schránek.');
  return await response.json();
};

export const createMailcowMailbox = async (email: string, name: string, password: string, quota: number = 3072) => {
  const { apiUrl, apiKey } = getMailcowConfig();
  const [local_part, domain] = email.split('@');
  if (!local_part || !domain) {
    throw new Error('Neplatný formát e-mailu pro Mailcow.');
  }

  const response = await fetch(`${apiUrl}/add/mailbox`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      local_part,
      domain,
      password,
      name,
      active: 1,
      quota,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mailcow API Error:', errorText);
    throw new Error(`Chyba při vytváření schránky v Mailcow: ${response.statusText}`);
  }

  return await response.json();
};

export const deleteMailcowMailbox = async (email: string) => {
  const { apiUrl, apiKey } = getMailcowConfig();
  const response = await fetch(`${apiUrl}/delete/mailbox`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ items: [email] }),
  });
  if (!response.ok) throw new Error('Chyba při mazání schránky.');
  return await response.json();
};

export const updateMailcowPassword = async (email: string, password: string) => {
  const { apiUrl, apiKey } = getMailcowConfig();
  const response = await fetch(`${apiUrl}/edit/mailbox`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ items: [email], attr: { password } }),
  });
  if (!response.ok) throw new Error('Chyba při změně hesla.');
  return await response.json();
};
