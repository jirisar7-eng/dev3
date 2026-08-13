import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { TextItem, User } from '../types';

export class TextService {
  static async getAllTexts(): Promise<TextItem[]> {
    if (isPrismaAvailable()) {
      try {
        const texts = await prisma.contentString.findMany({
          orderBy: { key: 'asc' },
        });
        return texts.map((t) => ({
          id: t.id,
          key: t.key,
          category: t.category,
          valueCzech: t.valueCzech,
          valueEnglish: t.valueEnglish || undefined,
          description: t.description || undefined,
          active: t.active ?? true,
          updatedBy: t.updatedBy || undefined,
          updatedAt: t.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getAllTexts error, falling back:', err);
      }
    }
    return dbStore.texts;
  }

  static async getTextMap(locale: 'cs' | 'en' = 'cs'): Promise<Record<string, string>> {
    const texts = await this.getAllTexts();
    const map: Record<string, string> = {};
    for (const item of texts) {
      if (item.active !== false) {
        map[item.key] = (locale === 'en' && item.valueEnglish) ? item.valueEnglish : item.valueCzech;
      }
    }
    return map;
  }

  static async getTextByKey(key: string): Promise<TextItem | null> {
    if (isPrismaAvailable()) {
      try {
        const t = await prisma.contentString.findUnique({ where: { key } });
        if (t) {
          return {
            id: t.id,
            key: t.key,
            category: t.category,
            valueCzech: t.valueCzech,
            valueEnglish: t.valueEnglish || undefined,
            description: t.description || undefined,
            active: t.active ?? true,
            updatedBy: t.updatedBy || undefined,
            updatedAt: t.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('Prisma getTextByKey error, falling back:', err);
      }
    }
    const found = dbStore.texts.find((t) => t.key === key);
    return found || null;
  }

  static async createText(
    key: string,
    category: string,
    valueCzech: string,
    valueEnglish?: string,
    description?: string,
    user?: User | null
  ): Promise<TextItem> {
    const userEmail = user?.email || 'system@tatovacesta.cz';

    if (isPrismaAvailable()) {
      try {
        const existing = await prisma.contentString.findUnique({ where: { key } });
        if (existing) {
          throw new Error(`Textový klíč '${key}' již existuje.`);
        }

        const created = await prisma.contentString.create({
          data: {
            key,
            category: category || (key.split('.')[0] || 'general'),
            valueCzech,
            valueEnglish,
            description,
            active: true,
            updatedBy: userEmail,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail,
            action: 'TEXT_CREATE',
            module: 'TEXT_MANAGER',
            details: `Vytvořen nový textový klíč '${key}' v kategorii '${category}'.`,
          },
        });

        return {
          id: created.id,
          key: created.key,
          category: created.category,
          valueCzech: created.valueCzech,
          valueEnglish: created.valueEnglish || undefined,
          description: created.description || undefined,
          active: created.active ?? true,
          updatedBy: created.updatedBy || userEmail,
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err: any) {
        if (err.message?.includes('již existuje')) throw err;
        console.warn('Prisma createText error, falling back:', err);
      }
    }

    const existing = dbStore.texts.find((t) => t.key === key);
    if (existing) {
      throw new Error(`Textový klíč '${key}' již existuje.`);
    }

    const newItem: TextItem = {
      id: 'txt-' + Date.now(),
      key,
      category: category || (key.split('.')[0] || 'general'),
      valueCzech,
      valueEnglish,
      description,
      active: true,
      updatedBy: userEmail,
      updatedAt: new Date().toISOString(),
    };

    dbStore.texts.push(newItem);
    dbStore.logAudit('TEXT_CREATE', 'TEXT_MANAGER', `Vytvořen nový textový klíč '${key}' v kategorii '${category}'.`, user);
    return newItem;
  }

  static async updateText(
    key: string,
    data: { valueCzech?: string; valueEnglish?: string; category?: string; description?: string; active?: boolean },
    user?: User | null
  ): Promise<TextItem> {
    const userEmail = user?.email || 'system@tatovacesta.cz';

    if (isPrismaAvailable()) {
      try {
        const category = data.category || (key.split('.')[0] || 'general');
        const updated = await prisma.contentString.upsert({
          where: { key },
          update: {
            ...(data.valueCzech !== undefined && { valueCzech: data.valueCzech }),
            ...(data.valueEnglish !== undefined && { valueEnglish: data.valueEnglish }),
            ...(data.category !== undefined && { category: data.category }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.active !== undefined && { active: data.active }),
            updatedBy: userEmail,
          },
          create: {
            key,
            category,
            valueCzech: data.valueCzech || key,
            valueEnglish: data.valueEnglish,
            description: data.description || 'Vlastní uživatelský textový klíč',
            active: data.active !== undefined ? data.active : true,
            updatedBy: userEmail,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail,
            action: 'TEXT_UPDATE',
            module: 'TEXT_MANAGER',
            details: `Aktualizován textový klíč '${key}'.`,
          },
        });

        return {
          id: updated.id,
          key: updated.key,
          category: updated.category,
          valueCzech: updated.valueCzech,
          valueEnglish: updated.valueEnglish || undefined,
          description: updated.description || undefined,
          active: updated.active ?? true,
          updatedBy: updated.updatedBy || userEmail,
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateText error, falling back:', err);
      }
    }

    let item = dbStore.texts.find((t) => t.key === key);
    if (item) {
      if (data.valueCzech !== undefined) item.valueCzech = data.valueCzech;
      if (data.valueEnglish !== undefined) item.valueEnglish = data.valueEnglish;
      if (data.category !== undefined) item.category = data.category;
      if (data.description !== undefined) item.description = data.description;
      if (data.active !== undefined) item.active = data.active;
      item.updatedBy = userEmail;
      item.updatedAt = new Date().toISOString();
    } else {
      item = {
        id: 'txt-' + Date.now(),
        key,
        category: data.category || (key.split('.')[0] || 'general'),
        valueCzech: data.valueCzech || key,
        valueEnglish: data.valueEnglish,
        description: data.description || 'Vlastní uživatelský textový klíč',
        active: data.active !== undefined ? data.active : true,
        updatedBy: userEmail,
        updatedAt: new Date().toISOString(),
      };
      dbStore.texts.push(item);
    }

    dbStore.logAudit('TEXT_UPDATE', 'TEXT_MANAGER', `Aktualizován textový klíč '${key}'.`, user);
    return item;
  }

  static async toggleTextActive(key: string, active: boolean, user?: User | null): Promise<TextItem> {
    const item = await this.updateText(key, { active }, user);
    const action = active ? 'TEXT_ACTIVATE' : 'TEXT_DEACTIVATE';
    const logDetail = active ? `Aktivován textový klíč '${key}'.` : `Deaktivován textový klíč '${key}'.`;

    if (isPrismaAvailable()) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email || 'system@tatovacesta.cz',
            action,
            module: 'TEXT_MANAGER',
            details: logDetail,
          },
        });
      } catch (err) {
        console.warn('AuditLog write error on toggleTextActive:', err);
      }
    } else {
      dbStore.logAudit(action, 'TEXT_MANAGER', logDetail, user);
    }

    return item;
  }

  static async deleteText(key: string, user?: User | null): Promise<boolean> {
    if (isPrismaAvailable()) {
      try {
        await prisma.contentString.delete({ where: { key } });
        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email || 'system@tatovacesta.cz',
            action: 'TEXT_DELETE',
            module: 'TEXT_MANAGER',
            details: `Odstraněn textový klíč '${key}'.`,
          },
        });
        return true;
      } catch (err) {
        console.warn('Prisma deleteText error, falling back:', err);
      }
    }

    const index = dbStore.texts.findIndex((t) => t.key === key);
    if (index !== -1) {
      dbStore.texts.splice(index, 1);
      dbStore.logAudit('TEXT_DELETE', 'TEXT_MANAGER', `Odstraněn textový klíč '${key}'.`, user);
      return true;
    }
    return false;
  }
}
