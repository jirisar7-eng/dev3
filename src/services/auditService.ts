import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { AuditLog, User } from '../types';

export class AuditService {
  static async getLogs(filterModule?: string, filterUser?: string): Promise<AuditLog[]> {
    if (isPrismaAvailable()) {
      try {
        const where: any = {};
        if (filterModule) where.module = { equals: filterModule, mode: 'insensitive' };
        if (filterUser) where.userEmail = { contains: filterUser, mode: 'insensitive' };

        const logs = await prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 200,
        });

        return logs.map((l: any) => ({
          id: l.id,
          userId: l.userId || undefined,
          userEmail: l.userEmail || undefined,
          action: l.action,
          module: l.module,
          details: l.details,
          ipAddress: l.ipAddress || '127.0.0.1',
          createdAt: l.createdAt.toISOString(),
        }));
      } catch (err) {
        console.info('[Fallback] getLogs error, using dbStore:', err);
      }
    }

    let logs = dbStore.auditLogs;
    if (filterModule) {
      logs = logs.filter((l) => l.module.toLowerCase() === filterModule.toLowerCase());
    }
    if (filterUser) {
      logs = logs.filter((l) => l.userEmail?.toLowerCase().includes(filterUser.toLowerCase()));
    }
    return logs;
  }

  static async recordLog(action: string, module: string, details: string, user?: User | null, ipAddress = '127.0.0.1'): Promise<AuditLog> {
    if (isPrismaAvailable()) {
      try {
        const created = await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action,
            module,
            details,
            ipAddress,
          },
        });

        if (!created || !created.createdAt) {
          throw new Error('Database returned empty or invalid created log.');
        }

        return {
          id: created.id,
          userId: created.userId || undefined,
          userEmail: created.userEmail || undefined,
          action: created.action,
          module: created.module,
          details: created.details,
          ipAddress: created.ipAddress || '127.0.0.1',
          createdAt: typeof created.createdAt === 'string' ? new Date(created.createdAt).toISOString() : created.createdAt.toISOString(),
        };
      } catch (err) {
        console.info('[Fallback] recordLog error, using dbStore:', err);
      }
    }

    const log: AuditLog = {
      id: 'aud-' + Date.now(),
      userId: user?.id,
      userEmail: user?.email,
      action,
      module,
      details,
      ipAddress,
      createdAt: new Date().toISOString(),
    };

    dbStore.auditLogs.unshift(log);
    return log;
  }
}
