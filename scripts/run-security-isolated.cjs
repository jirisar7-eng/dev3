const { spawn, spawnSync } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const HOST = '127.0.0.1';
const PORT = 3000;
const APP_NAME = 'isolated-security-test';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isPortFree() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: HOST, port: PORT });

    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', (error) => {
      resolve(error.code === 'ECONNREFUSED');
    });

    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function readHealth() {
  return new Promise((resolve, reject) => {
    const request = http.get({
      hostname: HOST,
      port: PORT,
      path: '/api/health',
      timeout: 1000,
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        body,
      }));
    });

    request.on('timeout', () => request.destroy(new Error('Health timeout')));
    request.on('error', reject);
  });
}

async function waitForHealth(server, getLog) {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Server skončil předčasně.\n${getLog()}`);
    }

    let response;
    try {
      response = await readHealth();
    } catch {
      await sleep(500);
      continue;
    }

    if (response.statusCode !== 200) {
      throw new Error(`Neočekávaný health HTTP status: ${response.statusCode}`);
    }

    const health = JSON.parse(response.body);
    if (health.app !== APP_NAME) {
      throw new Error(`Na portu 3000 běží jiná aplikace: ${health.app}`);
    }
    if (health.database?.status !== 'disconnected') {
      throw new Error('Izolovaný test nesmí být připojen k databázi.');
    }

    console.log('✅ Izolovaný backend je připravený bez databáze.');
    return;
  }

  throw new Error(`Server se nespustil včas.\n${getLog()}`);
}

let server;
let serverLog = '';

function appendLog(chunk) {
  serverLog = `${serverLog}${chunk}`.slice(-20000);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;

  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    sleep(3000),
  ]);

  if (server.exitCode === null) server.kill('SIGKILL');
}

async function main() {
  if (!(await isPortFree())) {
    throw new Error('BLOCKED: port 3000 již používá jiný proces.');
  }

  const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs');
  server = spawn(process.execPath, [tsxCli, 'server.ts'], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH || '',
      NODE_ENV: 'production',
      DATABASE_FALLBACK_ENABLED: 'true',
      JWT_SECRET: 'test-only-not-a-production-secret',
      APP_NAME,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', appendLog);
  server.stderr.on('data', appendLog);

  await waitForHealth(server, () => serverLog);

  const result = spawnSync(process.execPath, ['run_security_tests.cjs'], {
    cwd: process.cwd(),
    env: {
      PATH: process.env.PATH || '',
      NODE_ENV: 'test',
    },
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

main()
  .catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(stopServer);
