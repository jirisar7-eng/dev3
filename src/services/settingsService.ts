import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { Setting, User } from '../types';

export class SettingsService {
  static async getSettings(): Promise<Setting[]> {
    if (isPrismaAvailable()) {
      try {
        const settings = await prisma.systemSetting.findMany({
          orderBy: { key: 'asc' },
        });
        return settings.map((s) => ({
          id: s.id,
          key: s.key,
          value: s.value,
          category: s.category,
          updatedAt: s.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getSettings error, falling back:', err);
      }
    }
    return dbStore.settings;
  }

  static async updateSetting(key: string, value: string, user?: User | null): Promise<Setting> {
    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, category: 'system' },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'SETTING_UPDATE',
            module: 'SETTINGS',
            details: `Aktualizováno systémové nastavení '${key}' na '${value}'.`,
          },
        });

        return {
          id: updated.id,
          key: updated.key,
          value: updated.value,
          category: updated.category,
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateSetting error, falling back:', err);
      }
    }

    let setting = dbStore.settings.find((s) => s.key === key);
    if (!setting) {
      setting = {
        id: 'set-' + Date.now(),
        key,
        value,
        category: 'system',
        updatedAt: new Date().toISOString(),
      };
      dbStore.settings.push(setting);
    } else {
      setting.value = value;
      setting.updatedAt = new Date().toISOString();
    }

    dbStore.logAudit('SETTING_UPDATE', 'SETTINGS', `Aktualizováno systémové nastavení '${key}' na '${value}'.`, user);
    return setting;
  }
}
