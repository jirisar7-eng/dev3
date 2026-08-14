import https from 'https';
import http from 'http';
import { URL } from 'url';

export interface MailcowConfig {
  publicUrl: string;
  internalUrl?: string;
  internalIp?: string;
  apiUrl: string;
  apiKey: string;
  effectiveHost: string;
  effectiveTargetIp?: string;
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

export interface MailcowHealthResult {
  status: 'OK' | 'UNAVAILABLE' | 'UNAUTHORIZED' | 'MISCONFIGURED' | 'TIMEOUT';
  healthy: boolean;
  httpStatus?: number;
  latencyMs?: number;
  publicUrl: string;
  internalUrl?: string;
  targetAddress: string;
  apiKeyConfigured: boolean;
  apiKeyLength: number;
  mailboxesCount?: number;
  message: string;
  details?: any;
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
    return 'Mailcow API odmítlo autorizaci (neplatný nebo odmítnutý API klíč). Zkontrolujte konfiguraci MAILCOW_API_KEY.';
  }
  if (lowercaseMsg.includes('domain_not_found') || lowercaseMsg.includes('domain does not exist')) {
    return 'Doména tatovacesta.cz není v Mailcow nakonfigurována nebo aktivována.';
  }
  if (lowercaseMsg.includes('mailbox_added') || lowercaseMsg.includes('success')) {
    return 'Operace proběhla úspěšně.';
  }
  return raw;
};

/**
 * Reads Mailcow configuration from environment variables
 */
export const getMailcowConfig = (): MailcowConfig => {
  const publicUrlRaw = process.env.MAILCOW_PUBLIC_URL || process.env.MAILCOW_URL || 'https://mail.tatovacesta.cz';
  const cleanPublicUrl = publicUrlRaw.trim().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');

  const internalUrlRaw = process.env.MAILCOW_INTERNAL_URL || '';
  const cleanInternalUrl = internalUrlRaw ? internalUrlRaw.trim().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '') : undefined;

  let internalIp = (process.env.MAILCOW_INTERNAL_IP || '').trim() || undefined;

  // If internal URL contains an IP address, extract it
  let effectiveUrl = cleanPublicUrl;
  let effectiveTargetIp = internalIp;

  if (cleanInternalUrl) {
    try {
      const parsedInternal = new URL(cleanInternalUrl);
      // Check if hostname is an IPv4 address (e.g. 172.22.1.14)
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(parsedInternal.hostname)) {
        effectiveTargetIp = parsedInternal.hostname;
        // Keep domain name in effectiveUrl for TLS SNI validation
        effectiveUrl = cleanPublicUrl;
      } else {
        effectiveUrl = cleanInternalUrl;
      }
    } catch {
      effectiveUrl = cleanInternalUrl;
    }
  }

  const apiKey = (process.env.MAILCOW_API_KEY || '').trim();
  const parsedEffective = new URL(effectiveUrl);

  return {
    publicUrl: cleanPublicUrl,
    internalUrl: cleanInternalUrl,
    internalIp,
    apiUrl: `${effectiveUrl}/api/v1`,
    apiKey,
    effectiveHost: parsedEffective.hostname,
    effectiveTargetIp,
  };
};

export const isMailcowConfigured = (): boolean => {
  const { apiKey } = getMailcowConfig();
  return Boolean(apiKey && apiKey.length > 0);
};

export const safeLogMailcow = (
  endpoint: string,
  statusCode?: number | string,
  extra?: { mailboxesCount?: number; errorMsg?: string; durationMs?: number }
) => {
  const config = getMailcowConfig();
  const targetInfo = config.effectiveTargetIp
    ? `Direct IP ${config.effectiveTargetIp} (SNI: ${config.effectiveHost})`
    : config.effectiveHost;

  let logLine = `[Mailcow] Request: ${endpoint} | Target: ${targetInfo} | Status: ${statusCode ?? 'N/A'}`;
  if (extra?.durationMs !== undefined) logLine += ` (${extra.durationMs}ms)`;
  if (extra?.mailboxesCount !== undefined) logLine += ` | Mailboxes loaded: ${extra.mailboxesCount}`;
  if (extra?.errorMsg) logLine += ` | Network error: ${extra.errorMsg}`;

  console.log(logLine);
};

interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string; // e.g. '/api/v1/get/mailbox/all'
  body?: any;
  timeoutMs?: number;
}

interface HttpResponse {
  status: number;
  statusText: string;
  data: any;
  durationMs: number;
}

/**
 * Performs a secure HTTP/HTTPS request to Mailcow API with strict TLS certificate verification,
 * explicit timeout, and support for internal Docker IP routing without certificate mismatch.
 */
export const makeMailcowRequest = async (opts: HttpRequestOptions): Promise<HttpResponse> => {
  const config = getMailcowConfig();
  const startTime = Date.now();

  if (!config.apiKey) {
    safeLogMailcow(opts.endpoint, 'CONFIG_MISSING', { errorMsg: 'MAILCOW_API_KEY is not defined in environment' });
    throw new Error('Mailcow API není nakonfigurováno (chybí MAILCOW_API_KEY v .env).');
  }

  const fullUrlString = `${config.apiUrl.replace(/\/api\/v1$/, '')}${opts.endpoint}`;
  const url = new URL(fullUrlString);
  const isHttps = url.protocol === 'https:';
  const transport = isHttps ? https : http;

  const payload = opts.body ? JSON.stringify(opts.body) : undefined;
  const timeoutMs = opts.timeoutMs || 8000; // 8 seconds default timeout

  return new Promise((resolve, reject) => {
    const reqOptions: https.RequestOptions = {
      method: opts.method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'X-API-Key': config.apiKey,
        'Accept': 'application/json',
        'Host': url.hostname,
        ...(payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : {}),
      },
      timeout: timeoutMs,
    };

    // If direct internal IP is configured (e.g. 172.22.1.14 on docker bridge),
    // map the DNS lookup to the internal IP while preserving standard strict TLS SNI & Cert validation.
    if (config.effectiveTargetIp && isHttps) {
      reqOptions.lookup = (_hostname, _lookupOpts, callback) => {
        callback(null, config.effectiveTargetIp!, 4);
      };
      reqOptions.servername = url.hostname;
    }

    const req = transport.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        const durationMs = Date.now() - startTime;
        let parsedData: any = null;
        try {
          parsedData = rawData ? JSON.parse(rawData) : null;
        } catch {
          parsedData = rawData;
        }

        resolve({
          status: res.statusCode || 500,
          statusText: res.statusMessage || '',
          data: parsedData,
          durationMs,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('TIMEOUT'));
    });

    req.on('error', (err: any) => {
      const durationMs = Date.now() - startTime;
      if (err.message === 'TIMEOUT' || err.code === 'ETIMEDOUT') {
        safeLogMailcow(opts.endpoint, 'TIMEOUT', { errorMsg: `Timeout po ${timeoutMs}ms`, durationMs });
        reject(new Error('Mailcow API neodpovědělo včas (vypršel časový limit spojení).'));
      } else {
        safeLogMailcow(opts.endpoint, 'NET_ERROR', { errorMsg: err.message, durationMs });
        reject(new Error(`Nepodařilo se připojit k Mailcow serveru (${err.message || 'Chyba sítě / DNS'}).`));
      }
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

/**
 * Fetch all mailboxes from Mailcow API
 */
export const getMailcowMailboxes = async (): Promise<MailcowMailbox[]> => {
  const response = await makeMailcowRequest({
    method: 'GET',
    endpoint: '/api/v1/get/mailbox/all',
  });

  if (response.status === 401 || response.status === 403) {
    safeLogMailcow('/api/v1/get/mailbox/all', response.status, { errorMsg: 'Unauthorized' });
    throw new Error('Mailcow API odmítlo autorizaci (neplatný nebo odmítnutý API klíč).');
  }

  if (response.status === 404) {
    safeLogMailcow('/api/v1/get/mailbox/all', response.status, { errorMsg: 'Endpoint not found' });
    throw new Error('Mailcow API endpoint nebyl nalezen. Zkontrolujte nastavení URL.');
  }

  if (response.status >= 500) {
    safeLogMailcow('/api/v1/get/mailbox/all', response.status, { errorMsg: `Server error ${response.status}` });
    throw new Error(`Mailcow server vrátil interní chybu (${response.status}).`);
  }

  const rawData = response.data;

  // Handle single error object from Mailcow like {"type":"error","msg":"..."}
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    if (rawData.type === 'error' || rawData.type === 'danger') {
      safeLogMailcow('/api/v1/get/mailbox/all', response.status, { errorMsg: String(rawData.msg) });
      throw new Error(translateMailcowError(rawData.msg));
    }

    // If it's a map/dictionary of mailboxes keyed by email: { "user@tatovacesta.cz": { ... } }
    const values = Object.values(rawData);
    if (values.length > 0 && typeof values[0] === 'object' && (values[0] as any)?.username) {
      const mailboxes = values as MailcowMailbox[];
      safeLogMailcow('/api/v1/get/mailbox/all', response.status, { mailboxesCount: mailboxes.length, durationMs: response.durationMs });
      return mailboxes;
    }
  }

  if (Array.isArray(rawData)) {
    if (rawData.length > 0 && rawData[0]?.type === 'danger') {
      safeLogMailcow('/api/v1/get/mailbox/all', response.status, { errorMsg: String(rawData[0].msg) });
      throw new Error(translateMailcowError(rawData[0].msg));
    }
    const mailboxes = rawData as MailcowMailbox[];
    safeLogMailcow('/api/v1/get/mailbox/all', response.status, { mailboxesCount: mailboxes.length, durationMs: response.durationMs });
    return mailboxes;
  }

  safeLogMailcow('/api/v1/get/mailbox/all', response.status, { mailboxesCount: 0, durationMs: response.durationMs });
  return [];
};

/**
 * Fetch all configured domains from Mailcow API
 */
export const getMailcowDomains = async (): Promise<any[]> => {
  const response = await makeMailcowRequest({
    method: 'GET',
    endpoint: '/api/v1/get/domain/all',
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci.');
  }

  if (!response.data) return [];
  if (Array.isArray(response.data)) return response.data;
  if (typeof response.data === 'object') return Object.values(response.data);
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
  const [local_part, domain] = email.split('@');
  if (!local_part || !domain) {
    throw new Error('Neplatný formát e-mailu. Zadejte jméno před zavináčem.');
  }

  const formattedLocalPart = local_part.toLowerCase().trim();
  const formattedDomain = domain.toLowerCase().trim();
  const formattedQuota = parseInt(String(quota), 10) || 3072;

  const response = await makeMailcowRequest({
    method: 'POST',
    endpoint: '/api/v1/add/mailbox',
    body: {
      local_part: formattedLocalPart,
      domain: formattedDomain,
      password,
      name: name.trim(),
      active: 1,
      quota: formattedQuota,
    },
  });

  safeLogMailcow('/api/v1/add/mailbox', response.status);

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci (neplatný API klíč).');
  }

  const data = response.data;
  if (response.status >= 400 || (data && (data.type === 'danger' || data.type === 'error'))) {
    throw new Error(translateMailcowError(data?.msg || `Chyba HTTP ${response.status}`));
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
  const cleanEmail = email.trim().toLowerCase();

  const response = await makeMailcowRequest({
    method: 'POST',
    endpoint: '/api/v1/delete/mailbox',
    body: { items: [cleanEmail] },
  });

  safeLogMailcow('/api/v1/delete/mailbox', response.status);

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci (neplatný API klíč).');
  }

  const data = response.data;
  if (response.status >= 400 || (data && (data.type === 'danger' || data.type === 'error'))) {
    throw new Error(translateMailcowError(data?.msg || `Chyba HTTP ${response.status}`));
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
  const cleanEmail = email.trim().toLowerCase();

  const response = await makeMailcowRequest({
    method: 'POST',
    endpoint: '/api/v1/edit/mailbox',
    body: { items: [cleanEmail], attr: { password } },
  });

  safeLogMailcow('/api/v1/edit/mailbox', response.status);

  if (response.status === 401 || response.status === 403) {
    throw new Error('Mailcow API odmítlo autorizaci (neplatný API klíč).');
  }

  const data = response.data;
  if (response.status >= 400 || (data && (data.type === 'danger' || data.type === 'error'))) {
    throw new Error(translateMailcowError(data?.msg || `Chyba HTTP ${response.status}`));
  }

  if (Array.isArray(data) && data[0]?.type === 'danger') {
    throw new Error(translateMailcowError(data[0].msg));
  }

  return data;
};

/**
 * Performs deep health check & diagnostics of Mailcow connectivity
 */
export const checkMailcowHealth = async (): Promise<MailcowHealthResult> => {
  const config = getMailcowConfig();
  const targetAddress = config.effectiveTargetIp
    ? `${config.effectiveHost} -> ${config.effectiveTargetIp}:443`
    : config.effectiveHost;

  if (!config.apiKey) {
    return {
      status: 'MISCONFIGURED',
      healthy: false,
      publicUrl: config.publicUrl,
      internalUrl: config.internalUrl,
      targetAddress,
      apiKeyConfigured: false,
      apiKeyLength: 0,
      message: 'Chybí konfigurace MAILCOW_API_KEY v proměnných prostředí.',
    };
  }

  try {
    const response = await makeMailcowRequest({
      method: 'GET',
      endpoint: '/api/v1/get/mailbox/all',
      timeoutMs: 6000,
    });

    if (response.status === 401 || response.status === 403) {
      return {
        status: 'UNAUTHORIZED',
        healthy: false,
        httpStatus: response.status,
        latencyMs: response.durationMs,
        publicUrl: config.publicUrl,
        internalUrl: config.internalUrl,
        targetAddress,
        apiKeyConfigured: true,
        apiKeyLength: config.apiKey.length,
        message: 'Mailcow API odmítlo autorizaci (neplatný nebo odmítnutý API klíč).',
      };
    }

    if (response.status === 200) {
      let count = 0;
      if (Array.isArray(response.data)) count = response.data.length;
      else if (response.data && typeof response.data === 'object') count = Object.keys(response.data).length;

      return {
        status: 'OK',
        healthy: true,
        httpStatus: 200,
        latencyMs: response.durationMs,
        publicUrl: config.publicUrl,
        internalUrl: config.internalUrl,
        targetAddress,
        apiKeyConfigured: true,
        apiKeyLength: config.apiKey.length,
        mailboxesCount: count,
        message: `Mailcow API je plně dostupné (načteno ${count} schránek za ${response.durationMs}ms).`,
      };
    }

    return {
      status: 'UNAVAILABLE',
      healthy: false,
      httpStatus: response.status,
      latencyMs: response.durationMs,
      publicUrl: config.publicUrl,
      internalUrl: config.internalUrl,
      targetAddress,
      apiKeyConfigured: true,
      apiKeyLength: config.apiKey.length,
      message: `Mailcow API vrátilo HTTP kód ${response.status}.`,
    };
  } catch (err: any) {
    const isTimeout = err.message?.includes('včas') || err.message?.includes('limit');
    return {
      status: isTimeout ? 'TIMEOUT' : 'UNAVAILABLE',
      healthy: false,
      publicUrl: config.publicUrl,
      internalUrl: config.internalUrl,
      targetAddress,
      apiKeyConfigured: true,
      apiKeyLength: config.apiKey.length,
      message: err.message || 'Nepodařilo se navázat spojení s Mailcow serverem.',
    };
  }
};
