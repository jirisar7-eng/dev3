export interface MailcowConfig {
  baseUrl: string;
  apiUrl: string;
  apiKey: string;
}

export interface MailcowMailbox {
  username: string;
  name: string;
  active: number | boolean | string;
  quota: number;
  quota_used?: number;
  domain?: string;
  local_part?: string;
  created?: string;
  modified?: string;
  messages?: number;
}

export const translateMailcowError = (msg: string | string[]): string => {
  if (!msg) return 'Neznámá chyba Mailcow API.';
  const raw = Array.isArray(msg) ? msg.join(', ') : String(msg);
  const lowercaseMsg = raw.toLowerCase();

  if (lowercaseMsg.includes('password_complexity') || lowercaseMsg.includes('complexity') || lowercaseMsg.includes('password_too_short')) {
    return 'Heslo nesplňuje požadavky na složitost (musí obsahovat velká i malá písmena, čísla a speciální znaky, např. !@#$%^&*).';
  }
  if (lowercaseMsg.includes('invalid_quota') || lowercaseMsg.includes('quota')) {
    return 'Zadaná neplatná velikost schránky.';
  }
  if (lowercaseMsg.includes('mailbox_exists') || lowercaseMsg.includes('exists') || lowercaseMsg.includes('already exists')) {
    return 'Tato e-mailová schránka v Mailcow již existuje.';
  }
  if (lowercaseMsg.includes('authentication failed') || lowercaseMsg.includes('unauthorized') || lowercaseMsg.includes('invalid api-key')) {
    return 'Mailcow API odmítlo autorizaci (neplatný nebo odmítnutý API klíč).';
  }
  if (lowercaseMsg.includes('domain_not_found') || lowercaseMsg.includes('domain does not exist')) {
    return 'Doména tatovacesta.cz není v Mailcow nakonfigurována nebo aktivována.';
  }
  if (lowercaseMsg.includes('mailbox_added') || lowercaseMsg.includes('success')) {
    return 'Operace proběhla úspěšně.';
  }
  return raw;
};

export const getMailcowConfig = (): MailcowConfig => {
  const rawUrl = process.env.MAILCOW_URL || process.env.MAILCOW_API_URL || 'https://mail.tatovacesta.cz';
  const cleanUrl = rawUrl.trim().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  const apiUrl = `${cleanUrl}/api/v1`;
  const apiKey = (process.env.MAILCOW_API_KEY || '').trim();

  return {
    baseUrl: cleanUrl,
    apiUrl,
    apiKey,
  };
};

export const isMailcowConfigured = (): boolean => {
  const { apiKey } = getMailcowConfig();
  return Boolean(apiKey && apiKey.length > 0);
};

export const safeLogMailcow = (endpoint: string, status?: number | string, extra?: string) => {
  const { baseUrl, apiKey } = getMailcowConfig();
  console.log(`[MAILCOW] URL: ${baseUrl} | Endpoint: ${endpoint} | API Key configured: ${Boolean(apiKey)} (length: ${apiKey ? apiKey.length : 0}) | Status: ${status ?? 'N/A'}${extra ? ` | Info: ${extra}` : ''}`);
};

/**
 * Fetch all mailboxes from Mailcow API
 */
export const getMailcowMailboxes = async (): Promise<MailcowMailbox[]> => {
  const { apiUrl, apiKey, baseUrl } = getMailcowConfig();

  if (!apiKey) {
    safeLogMailcow('/api/v1/get/mailbox/all', 'CONFIG_MISSING', 'MAILCOW_API_KEY is not defined in environment');
    throw new Error('Mailcow API není nakonfigurováno (chybí MAILCOW_API_KEY v .env).');
  }

  let response: Response;
  const targetEndpoint = `${apiUrl}/get/mailbox/all`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    response = await fetch(targetEndpoint, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (netErr: any) {
    safeLogMailcow('/api/v1/get/mailbox/all', 'NET_ERROR', netErr.message);
    if (netErr.name === 'AbortError') {
      throw new Error('Mailcow API neodpovědělo včas (časový limit vypršel).');
    }
    throw new Error(`Nepodařilo se připojit k Mailcow serveru (${netErr.message || 'Chyba sítě / DNS'}).`);
  }

  safeLogMailcow('/api/v1/get/mailbox/all', response.status);

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci (neplatný nebo chybějící API klíč).');
  }

  if (response.status === 404) {
    throw new Error(`Mailcow API endpoint nebyl nalezen na ${baseUrl}. Zkontrolujte konfiguraci MAILCOW_URL.`);
  }

  if (response.status >= 500) {
    throw new Error(`Mailcow server vrátil interní chybu (${response.status}). Zkontrolujte stav Mailcow kontejnerů.`);
  }

  if (!response.ok) {
    throw new Error(`Mailcow API vrátilo HTTP ${response.status}: ${response.statusText}`);
  }

  let rawData: any;
  try {
    rawData = await response.json();
  } catch (parseErr: any) {
    const rawText = await response.text().catch(() => '');
    safeLogMailcow('/api/v1/get/mailbox/all', response.status, `JSON parse error: ${parseErr.message}, body preview: ${rawText.slice(0, 100)}`);
    throw new Error('Mailcow API vrátilo neplatný formát dat (očekáván JSON).');
  }

  // Handle single error object from Mailcow like {"type":"error","msg":"..."}
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    if (rawData.type === 'error' || rawData.type === 'danger') {
      throw new Error(translateMailcowError(rawData.msg));
    }
    // If it's a map/dictionary of mailboxes keyed by email: { "user@tatovacesta.cz": { ... } }
    const values = Object.values(rawData);
    if (values.length > 0 && typeof values[0] === 'object' && (values[0] as any)?.username) {
      return values as MailcowMailbox[];
    }
  }

  if (Array.isArray(rawData)) {
    // Check if it's an array of messages or an array of mailboxes
    if (rawData.length > 0 && rawData[0]?.type === 'danger') {
      throw new Error(translateMailcowError(rawData[0].msg));
    }
    return rawData as MailcowMailbox[];
  }

  return [];
};

/**
 * Create a new mailbox in Mailcow
 */
export const createMailcowMailbox = async (
  email: string,
  name: string,
  password: string,
  quota: number = 3072
): Promise<any> => {
  const { apiUrl, apiKey } = getMailcowConfig();

  if (!apiKey) {
    throw new Error('Mailcow API není nakonfigurováno (chybí MAILCOW_API_KEY v .env).');
  }

  const [local_part, domain] = email.split('@');
  if (!local_part || !domain) {
    throw new Error('Neplatný formát e-mailu. Zadejte jméno před zavináčem.');
  }

  const formattedLocalPart = local_part.toLowerCase().trim();
  const formattedDomain = domain.toLowerCase().trim();
  const formattedQuota = parseInt(String(quota), 10) || 3072;

  safeLogMailcow('/api/v1/add/mailbox', 'REQUEST', `Creating mailbox ${formattedLocalPart}@${formattedDomain}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/add/mailbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        local_part: formattedLocalPart,
        domain: formattedDomain,
        password,
        name: name.trim(),
        active: 1,
        quota: formattedQuota,
      }),
    });
  } catch (netErr: any) {
    safeLogMailcow('/api/v1/add/mailbox', 'NET_ERROR', netErr.message);
    throw new Error(`Chyba spojení s Mailcow při vytváření schránky (${netErr.message}).`);
  }

  safeLogMailcow('/api/v1/add/mailbox', response.status);

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci (neplatný API klíč).');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data && (data.type === 'danger' || data.type === 'error')) {
      throw new Error(translateMailcowError(data.msg));
    }
    throw new Error(`Chyba při vytváření schránky v Mailcow: ${response.statusText}`);
  }

  if (Array.isArray(data) && data[0]?.type === 'danger') {
    throw new Error(translateMailcowError(data[0].msg));
  }

  return data;
};

/**
 * Delete a mailbox in Mailcow
 */
export const deleteMailcowMailbox = async (email: string): Promise<any> => {
  const { apiUrl, apiKey } = getMailcowConfig();

  if (!apiKey) {
    throw new Error('Mailcow API není nakonfigurováno (chybí MAILCOW_API_KEY v .env).');
  }

  const cleanEmail = email.trim().toLowerCase();
  safeLogMailcow('/api/v1/delete/mailbox', 'REQUEST', `Deleting mailbox ${cleanEmail}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/delete/mailbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ items: [cleanEmail] }),
    });
  } catch (netErr: any) {
    safeLogMailcow('/api/v1/delete/mailbox', 'NET_ERROR', netErr.message);
    throw new Error(`Chyba spojení s Mailcow při mazání schránky (${netErr.message}).`);
  }

  safeLogMailcow('/api/v1/delete/mailbox', response.status);

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci (neplatný API klíč).');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data && (data.type === 'danger' || data.type === 'error')) {
      throw new Error(translateMailcowError(data.msg));
    }
    throw new Error(`Chyba při mazání schránky v Mailcow: ${response.statusText}`);
  }

  if (Array.isArray(data) && data[0]?.type === 'danger') {
    throw new Error(translateMailcowError(data[0].msg));
  }

  return data;
};

/**
 * Update mailbox password in Mailcow
 */
export const updateMailcowPassword = async (email: string, password: string): Promise<any> => {
  const { apiUrl, apiKey } = getMailcowConfig();

  if (!apiKey) {
    throw new Error('Mailcow API není nakonfigurováno (chybí MAILCOW_API_KEY v .env).');
  }

  const cleanEmail = email.trim().toLowerCase();
  safeLogMailcow('/api/v1/edit/mailbox', 'REQUEST', `Updating password for ${cleanEmail}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/edit/mailbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ items: [cleanEmail], attr: { password } }),
    });
  } catch (netErr: any) {
    safeLogMailcow('/api/v1/edit/mailbox', 'NET_ERROR', netErr.message);
    throw new Error(`Chyba spojení s Mailcow při změně hesla (${netErr.message}).`);
  }

  safeLogMailcow('/api/v1/edit/mailbox', response.status);

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci (neplatný API klíč).');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data && (data.type === 'danger' || data.type === 'error')) {
      throw new Error(translateMailcowError(data.msg));
    }
    throw new Error(`Chyba při změně hesla v Mailcow: ${response.statusText}`);
  }

  if (Array.isArray(data) && data[0]?.type === 'danger') {
    throw new Error(translateMailcowError(data[0].msg));
  }

  return data;
};
