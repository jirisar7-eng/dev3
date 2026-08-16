import type { PrismaClient as PrismaClientType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import net from 'net';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let PrismaClientClass: any = null;
try {
  const pkg = require('@prisma/client');
  PrismaClientClass = pkg.PrismaClient;
} catch (err: any) {
  console.warn('[Database] Initial load of @prisma/client failed or client not generated yet:', err?.message || err);
}

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'P1001' || reason?.message?.includes("Can't reach database server")) {
    console.warn('Databáze je nedostupná (preview režim).');
    return;
  }
});

let clientInstance: PrismaClientType | null = null;
let isPrismaDisabled = false;

export function isFallbackAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATABASE_FALLBACK_ENABLED === 'true';
  }
  return process.env.DATABASE_FALLBACK_ENABLED !== 'false';
}

export function markPrismaUnavailable(reason?: any) {
  const errorMsg = reason?.message || String(reason || 'connection failed');
  if (!isFallbackAllowed()) {
    console.error(`[Database Error] PostgreSQL connection error: ${errorMsg}. Fallback is DISABLED in production.`);
    throw new Error(`[Database Error] PostgreSQL DB connection failed: ${errorMsg}`);
  }

  if (!isPrismaDisabled) {
    console.info(`[Database] Prisma/PostgreSQL DB unavailable (${errorMsg}). Falling back to local in-memory dbStore.`);
    isPrismaDisabled = true;
  }
  clientInstance = null;
}

export async function checkDatabaseReachable(): Promise<boolean> {
  if (isPrismaDisabled) return false;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    markPrismaUnavailable('DATABASE_URL environment variable is not defined');
    return false;
  }

  try {
    let host = 'localhost';
    let port = 5432;

    const matches = dbUrl.match(/@([^:/]+)(?::(\d+))?/);
    if (matches) {
      if (matches[1]) host = matches[1];
      if (matches[2]) port = parseInt(matches[2], 10);
    } else {
      try {
        const parsed = new URL(dbUrl);
        if (parsed.hostname) host = parsed.hostname;
        if (parsed.port) port = parseInt(parsed.port, 10);
      } catch {
        // ignore
      }
    }

    const isReachable = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1200);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });

    if (!isReachable) {
      markPrismaUnavailable(`Databázový server na ${host}:${port} není dostupný`);
    }

    return isReachable;
  } catch (err) {
    markPrismaUnavailable(err);
    return false;
  }
}

export async function waitForDatabase(maxRetries = 5): Promise<boolean> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    console.log(`[Database] Pokus o připojení k PostgreSQL (${i + 1}/${maxRetries})...`);
    const reachable = await checkDatabaseReachable();
    if (reachable) {
      console.log('[Database] PostgreSQL je dostupná.');
      isPrismaDisabled = false; // Reset if it was previously marked as unavailable
      return true;
    }
    console.warn(`[Database] Připojení selhalo. Další pokus za ${delay / 1000}s.`);
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
  }
  console.error('[Database] Maximální počet pokusů o připojení vyčerpán.');
  return false;
}

export function getPrismaClient(): PrismaClientType | null {
  if (isPrismaDisabled) {
    if (!isFallbackAllowed()) {
      return null; // Let the caller handle it, or we could throw here
    }
    return null;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    markPrismaUnavailable('DATABASE_URL environment variable is not defined');
    return null;
  }

  if (!clientInstance) {
    try {
      if (!PrismaClientClass) {
        try {
          const pkg = require('@prisma/client');
          PrismaClientClass = pkg.PrismaClient;
        } catch (loadErr) {
          markPrismaUnavailable(loadErr);
          return null;
        }
      }
      const pool = new pg.Pool({ 
        connectionString: dbUrl, 
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 20
      });
      const adapter = new PrismaPg(pool);
      clientInstance = new PrismaClientClass({ adapter });
    } catch (error) {
      markPrismaUnavailable(error);
      return null;
    }
  }

  return clientInstance;
}

export function isPrismaAvailable(): boolean {
  if (isPrismaDisabled) return false;
  if (!process.env.DATABASE_URL) return false;
  try {
    return getPrismaClient() !== null;
  } catch {
    return false;
  }
}

const dummyModel = new Proxy({}, {
  get(_target, prop: string) {
    return function () {
      if (prop === 'findMany') return Promise.resolve([]);
      if (prop === 'count') return Promise.resolve(0);
      if (prop === 'findUnique' || prop === 'findFirst') return Promise.resolve({ id: 'dummy-1234-uuid', name: 'Mock Data' });
      if (prop === 'upsert' || prop === 'create' || prop === 'update' || prop === 'delete') return Promise.resolve({ id: 'dummy-1234-uuid', name: 'Mock Data' });
      return Promise.resolve(null);
    };
  },
});

export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      if (isFallbackAllowed()) {
        return dummyModel;
      }
      throw new Error('Databáze je momentálně nedostupná.');
    }

    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return function (...args: any[]) {
        try {
          const res = val.apply(client, args);
          if (res && typeof res.catch === 'function') {
            return res.catch((err: any) => {
              markPrismaUnavailable(err);
              if (isFallbackAllowed()) {
                console.warn(`[Prisma Proxy] Dotaz na ${prop as string} selhal, vracím dummy.`);
                return dummyModel[prop] ? dummyModel[prop](...args) : null;
              }
              throw err;
            });
          }
          return res;
        } catch (err) {
          markPrismaUnavailable(err);
          if (isFallbackAllowed()) {
             return dummyModel[prop] ? dummyModel[prop](...args) : null;
          }
          throw err;
        }
      };
    }

    if (val && typeof val === 'object' && val !== null) {
      return new Proxy(val, {
        get(modelTarget, modelProp) {
          const modelVal = modelTarget[modelProp];
          if (typeof modelVal === 'function') {
            return function (...args: any[]) {
              try {
                const res = modelVal.apply(modelTarget, args);
                if (res && typeof res.catch === 'function') {
                  return res.catch((err: any) => {
                    markPrismaUnavailable(err);
                    if (isFallbackAllowed()) {
                      console.warn(`[Prisma Proxy] Model query selhal, vracím dummy.`);
                      return (dummyModel as any)[modelProp] ? (dummyModel as any)[modelProp](...args) : null;
                    }
                    throw err;
                  });
                }
                return res;
              } catch (err) {
                markPrismaUnavailable(err);
                if (isFallbackAllowed()) {
                   return (dummyModel as any)[modelProp] ? (dummyModel as any)[modelProp](...args) : null;
                }
                throw err;
              }
            };
          }
          return modelVal;
        },
      });
    }

    return val;
  },
});
