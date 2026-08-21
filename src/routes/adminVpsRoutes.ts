import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { AuditService } from '../services/auditService';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = Router();

// Bezpečné řízení TLS certifikátů: v produkci vyžadujeme platný certifikát (rejectUnauthorized: true),
// ignorování certifikátu je povoleno pouze pokud je výslovně povoleno proměnnou ALLOW_INSECURE_PODMAN_TLS=true
const allowInsecureTls = process.env.ALLOW_INSECURE_PODMAN_TLS === 'true';
const httpsAgent = new https.Agent({ rejectUnauthorized: !allowInsecureTls });
const httpAgent = new http.Agent();

/**
 * Vrátí konfigurovanou URL adresu nebo socket pro Podman / Docker REST API
 */
function getPodmanApiUrl(): string {
  let url = process.env.PODMAN_API_URL || process.env.DOCKER_HOST || 'https://10.211.2.130:9090';
  if (url.startsWith('tcp://')) {
    url = url.replace('tcp://', 'http://');
  }
  return url.replace(/\/+$/, '');
}

/**
 * Sanitizuje identifikátor kontejneru pro zamezení path traversal / injection
 */
function sanitizeContainerId(input: string | null | undefined): string | null {
  if (!input) return null;
  const clean = String(input).trim();
  if (/^[a-zA-Z0-9_.-]{1,128}$/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * Pomocná funkce pro odeslání HTTP/HTTPS požadavku na Podman/Docker REST API
 */
async function callPodmanApi(
  path: string,
  method: string = 'GET',
  body: any = null,
  timeoutMs: number = 7000
): Promise<{ status: number; data: any; raw: string }> {
  const baseUrl = getPodmanApiUrl();
  const token = process.env.PODMAN_API_TOKEN || process.env.DOCKER_API_TOKEN;

  // Podpora Unix domain socket (např. unix:///var/run/docker.sock)
  if (baseUrl.startsWith('unix://')) {
    const socketPath = baseUrl.replace('unix://', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return new Promise((resolve, reject) => {
      const reqOptions: http.RequestOptions = {
        socketPath,
        path: cleanPath,
        method,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Host': 'localhost',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        timeout: timeoutMs,
      };

      const req = http.request(reqOptions, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const raw = buffer.toString('binary');
          let parsed: any = null;
          try {
            parsed = JSON.parse(buffer.toString('utf-8'));
          } catch {
            parsed = buffer.toString('utf-8');
          }
          resolve({
            status: res.statusCode || 500,
            data: parsed,
            raw,
          });
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Časový limit vypršel (${timeoutMs}ms) při volání socketu (${socketPath})`));
      });

      if (body) {
        const payload = typeof body === 'string' ? body : JSON.stringify(body);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Content-Length', Buffer.byteLength(payload));
        req.write(payload);
      }
      req.end();
    });
  }

  const targetUrl = new URL(path.startsWith('/') ? path : `/${path}`, baseUrl);
  const isHttps = targetUrl.protocol === 'https:';
  const transport = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const reqOptions: http.RequestOptions = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: targetUrl.pathname + targetUrl.search,
      method,
      agent: isHttps ? httpsAgent : httpAgent,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      timeout: timeoutMs,
    };

    const req = transport.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const raw = buffer.toString('binary');
        let parsed: any = null;
        try {
          parsed = JSON.parse(buffer.toString('utf-8'));
        } catch {
          parsed = buffer.toString('utf-8');
        }

        resolve({
          status: res.statusCode || 500,
          data: parsed,
          raw,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Časový limit vypršel (${timeoutMs}ms) při volání Podman API (${baseUrl})`));
    });

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }

    req.end();
  });
}

/**
 * Odstraní 8-bytové hlavičky multiplexovaného log streamu Dockeru/Podmanu
 */
function cleanDockerLogsStream(rawBin: string): string {
  if (!rawBin) return '';
  const buf = Buffer.from(rawBin, 'binary');
  // Pokud stream obsahuje Docker log header (bajt 0 je 1 pro stdout nebo 2 pro stderr, bajty 1-3 jsou 0)
  if (buf.length >= 8 && (buf[0] === 1 || buf[0] === 2) && buf[1] === 0 && buf[2] === 0 && buf[3] === 0) {
    let result = '';
    let offset = 0;
    while (offset < buf.length) {
      if (
        offset + 8 <= buf.length &&
        (buf[offset] === 1 || buf[offset] === 2) &&
        buf[offset + 1] === 0 &&
        buf[offset + 2] === 0 &&
        buf[offset + 3] === 0
      ) {
        const frameSize = buf.readUInt32BE(offset + 4);
        const frameEnd = Math.min(offset + 8 + frameSize, buf.length);
        result += buf.toString('utf-8', offset + 8, frameEnd);
        offset = offset + 8 + frameSize;
      } else {
        result += buf.toString('utf-8', offset, offset + 1);
        offset++;
      }
    }
    return result;
  }
  return buf.toString('utf-8');
}

/**
 * Formátuje pole kontejnerů do tabulkového výstupu ve stylu `docker ps`
 */
function formatContainersAsCliTable(containers: any[]): string {
  if (!Array.isArray(containers) || containers.length === 0) {
    return 'Žádné aktivní kontejnerové procesy nebyly nalezeny.';
  }

  const header = 'CONTAINER ID   IMAGE                          COMMAND                  CREATED         STATUS                  PORTS                   NAMES';
  const rows = containers.map((c) => {
    const rawId = c.Id || c.id || c.ID || '';
    const id = rawId.substring(0, 12).padEnd(14);
    const image = (c.Image || c.image || 'unknown').substring(0, 30).padEnd(31);
    const command = (c.Command || c.command || '').substring(0, 24).padEnd(25);

    let createdStr = '';
    if (typeof c.Created === 'number') {
      createdStr = new Date(c.Created * 1000).toLocaleTimeString('cs-CZ');
    } else if (c.Created) {
      createdStr = String(c.Created).substring(0, 15);
    }
    const created = createdStr.padEnd(16);

    const status = (c.Status || c.status || c.State || c.state || 'Running').substring(0, 22).padEnd(24);

    let portsStr = '';
    if (Array.isArray(c.Ports)) {
      portsStr = c.Ports.map((p: any) =>
        p.PublicPort ? `${p.PublicPort}:${p.PrivatePort || ''}` : p.PrivatePort ? `${p.PrivatePort}` : ''
      )
        .filter(Boolean)
        .join(', ');
    } else if (typeof c.Ports === 'string') {
      portsStr = c.Ports;
    }
    const ports = portsStr.substring(0, 22).padEnd(24);

    let namesStr = '';
    if (Array.isArray(c.Names)) {
      namesStr = c.Names.join(', ');
    } else if (c.Names || c.name) {
      namesStr = String(c.Names || c.name);
    }
    const names = namesStr.replace(/^\//, '');

    return `${id}${image}${command}${created}${status}${ports}${names}`;
  });

  return [header, ...rows].join('\n');
}

/**
 * Načte seznam kontejnerů přes Podman / Docker API
 */
async function fetchContainersList(): Promise<{ success: boolean; containers: any[]; error?: string }> {
  const apiPaths = [
    '/v1.41/containers/json?all=true',
    '/containers/json?all=true',
    '/api/v1/podman/containers',
  ];

  let lastError = 'Podman REST API neodpovídá.';

  for (const path of apiPaths) {
    try {
      const res = await callPodmanApi(path, 'GET', null, 5000);
      if (res.status >= 200 && res.status < 300) {
        let list = res.data;
        if (list && Array.isArray(list.containers)) {
          list = list.containers;
        }
        if (Array.isArray(list)) {
          return { success: true, containers: list };
        }
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  return { success: false, containers: [], error: lastError };
}

// GET /api/admin/vps/status - Načte stav kontejnerů z Podman/Docker REST API
router.get('/status', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const apiUrl = getPodmanApiUrl();
  try {
    const result = await fetchContainersList();
    if (result.success) {
      const cliTable = formatContainersAsCliTable(result.containers);
      return res.json({
        success: true,
        status: cliTable,
        containers: result.containers,
        podmanApiUrl: apiUrl,
      });
    } else {
      return res.json({
        success: false,
        error: `Podman API (${apiUrl}) není dostupné: ${result.error}`,
        status: `[CHYBA PŘIPOJENÍ]\nPodman / Docker REST API na adrese ${apiUrl} není dostupné.\nChyba: ${result.error}\n\nUjistěte se, že je Podman REST socket aktivní a proměnná DOCKER_HOST nebo PODMAN_API_URL ukazuje na správný endpoint.`,
        containers: [],
        podmanApiUrl: apiUrl,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      status: `Chyba při volání Podman API (${apiUrl}): ${error.message}`,
      containers: [],
      podmanApiUrl: apiUrl,
    });
  }
});

// GET /api/admin/vps/logs - Načte logy kontejneru z Podman/Docker REST API
router.get('/logs', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const apiUrl = getPodmanApiUrl();
  const rawTail = parseInt(String(req.query.tail || '150'), 10);
  const tail = Math.min(Math.max(Number.isFinite(rawTail) ? rawTail : 150, 10), 1000);
  const requestedContainer = sanitizeContainerId(req.query.container as string);

  try {
    const listResult = await fetchContainersList();
    if (!listResult.success || !listResult.containers.length) {
      return res.json({
        success: false,
        error: `Podman REST API (${apiUrl}) není dostupné: ${listResult.error || 'Nenalezeny žádné kontejnery'}`,
        logs: `[CHYBA PŘIPOJENÍ K LOGŮM]\nPodman / Docker REST API na adrese ${apiUrl} není dostupné.\nChyba: ${listResult.error || 'Nenalezeny žádné kontejnery'}\n\nZkontrolujte konfiguraci DOCKER_HOST / PODMAN_API_URL v prostředí serveru.`,
        podmanApiUrl: apiUrl,
      });
    }

    const containers = listResult.containers;
    let targetContainer: any = null;

    if (requestedContainer) {
      targetContainer = containers.find((c: any) => {
        const id = c.Id || c.id || c.ID || '';
        const names = Array.isArray(c.Names) ? c.Names.join(' ') : String(c.Names || c.name || '');
        return id.includes(requestedContainer) || names.includes(requestedContainer);
      });
    }

    if (!targetContainer) {
      // Hledáme prioritně kontejner 'app', 'dev3', 'tatovacesta'
      targetContainer = containers.find((c: any) => {
        const names = Array.isArray(c.Names) ? c.Names.join(' ') : String(c.Names || c.name || '');
        return names.includes('app') || names.includes('dev3') || names.includes('tatovacesta');
      }) || containers[0];
    }

    const rawContainerId = targetContainer.Id || targetContainer.id || targetContainer.ID;
    const containerId = sanitizeContainerId(rawContainerId) || 'unknown';
    const containerName = Array.isArray(targetContainer.Names)
      ? targetContainer.Names[0]
      : targetContainer.Names || targetContainer.name || containerId;

    const logPaths = [
      `/v1.41/containers/${encodeURIComponent(containerId)}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=true`,
      `/containers/${encodeURIComponent(containerId)}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=true`,
      `/api/v1/podman/containers/${encodeURIComponent(containerId)}/logs?tail=${tail}`,
    ];

    let rawLogText = '';
    let logFetched = false;

    for (const logPath of logPaths) {
      try {
        const res = await callPodmanApi(logPath, 'GET', null, 7000);
        if (res.status >= 200 && res.status < 300) {
          rawLogText = typeof res.data === 'string' ? res.raw : JSON.stringify(res.data);
          logFetched = true;
          break;
        }
      } catch (e) {
        // Zkusíme další cestu
      }
    }

    if (logFetched) {
      const cleanLogs = cleanDockerLogsStream(rawLogText);
      return res.json({
        success: true,
        logs: cleanLogs || '[Podman API nevrátilo žádné řádky logů]',
        containerId,
        containerName,
        podmanApiUrl: apiUrl,
      });
    } else {
      return res.json({
        success: false,
        error: `Nepodařilo se stáhnout logy pro kontejner ${containerName} z Podman API (${apiUrl}).`,
        logs: `[CHYBA KONTROLE LOGŮ]\nNepodařilo se získat logy pro kontejner "${containerName}" (${containerId}) z API na ${apiUrl}.`,
        podmanApiUrl: apiUrl,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      logs: `Chyba při stahování logů z Podman API: ${error.message}`,
      podmanApiUrl: apiUrl,
    });
  }
});

// POST /api/admin/vps/update - Restartuje/aktualizuje kontejner přes Podman API
router.post('/update', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  const apiUrl = getPodmanApiUrl();
  try {
    const listResult = await fetchContainersList();
    if (!listResult.success || !listResult.containers.length) {
      return res.status(503).json({
        success: false,
        error: `Podman REST API (${apiUrl}) není dostupné pro restart kontejneru: ${listResult.error}`,
      });
    }

    const appContainer = listResult.containers.find((c: any) => {
      const names = Array.isArray(c.Names) ? c.Names.join(' ') : String(c.Names || c.name || '');
      return names.includes('app') || names.includes('dev3') || names.includes('tatovacesta');
    }) || listResult.containers[0];

    const rawContainerId = appContainer.Id || appContainer.id || appContainer.ID;
    const containerId = sanitizeContainerId(rawContainerId);
    if (!containerId) {
      return res.status(400).json({
        success: false,
        error: 'Neplatný identifikátor kontejneru',
      });
    }

    const containerName = Array.isArray(appContainer.Names) ? appContainer.Names[0] : appContainer.name || containerId;

    // Požadavek na restart kontejneru
    try {
      await callPodmanApi(`/v1.41/containers/${encodeURIComponent(containerId)}/restart`, 'POST', null, 10000);
    } catch {
      await callPodmanApi(`/containers/${encodeURIComponent(containerId)}/restart`, 'POST', null, 10000);
    }

    // Zaznamenání do audit logu
    await AuditService.recordLog(
      'VPS_CONTAINER_RESTART',
      'VPS',
      `SuperAdmin restartoval kontejner ${containerName} (${containerId})`,
      (req as any).user,
      req.ip || '127.0.0.1'
    );

    return res.json({
      success: true,
      message: `Příkaz k restartu kontejneru "${containerName}" byl úspěšně odeslán na Podman API (${apiUrl}).`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: `Chyba při komunikaci s Podman API (${apiUrl}): ${error.message}`,
    });
  }
});

export default router;

