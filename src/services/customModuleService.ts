import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { CustomModule, User } from '../types';

export class CustomModuleService {
  static async getAllCustomModules(onlyActive = false): Promise<CustomModule[]> {
    if (isPrismaAvailable()) {
      try {
        const whereClause = onlyActive ? { isActive: true } : {};
        const modules = await prisma.customModule.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
        });
        return modules;
      } catch (err) {
        console.info('[Fallback] getAllCustomModules error, using dbStore:', err);
      }
    }
    let list = dbStore.customModules;
    if (onlyActive) {
      list = list.filter((m) => m.isActive);
    }
    return list;
  }

  static async getCustomModuleBySlug(slug: string): Promise<CustomModule | null> {
    if (isPrismaAvailable()) {
      try {
        const mod = await prisma.customModule.findUnique({
          where: { slug },
        });
        if (mod) return mod;
      } catch (err) {
        console.info('[Fallback] getCustomModuleBySlug error, using dbStore:', err);
      }
    }
    return dbStore.customModules.find((m) => m.slug === slug && m.isActive) || null;
  }

  static async getCustomModuleById(id: string): Promise<CustomModule | null> {
    if (isPrismaAvailable()) {
      try {
        const mod = await prisma.customModule.findUnique({
          where: { id },
        });
        if (mod) return mod;
      } catch (err) {
        console.info('[Fallback] getCustomModuleById error, using dbStore:', err);
      }
    }
    return dbStore.customModules.find((m) => m.id === id) || null;
  }

  static async createCustomModule(
    data: {
      slug: string;
      title: string;
      category?: string;
      icon?: string;
      showInMenu?: boolean;
      isActive?: boolean;
      contentJson: string;
    },
    user?: User | null
  ): Promise<CustomModule> {
    // Validate JSON string
    try {
      JSON.parse(data.contentJson);
    } catch {
      throw new Error('Neplatný JSON formát v contentJson');
    }

    const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    if (isPrismaAvailable()) {
      try {
        const created = await prisma.customModule.create({
          data: {
            slug: cleanSlug,
            title: data.title,
            category: data.category || 'Krizová pomoc & Komunita',
            icon: data.icon || 'Box',
            showInMenu: data.showInMenu !== undefined ? data.showInMenu : true,
            isActive: data.isActive !== undefined ? data.isActive : true,
            contentJson: data.contentJson,
          },
        });

        dbStore.logAudit('CUSTOM_MODULE_CREATE', 'CUSTOM_MODULES', `Vytvořen nový modul '${created.title}' (${created.slug})`, user);
        return created;
      } catch (err) {
        console.info('[Fallback] createCustomModule error, using dbStore:', err);
      }
    }

    const newModule: CustomModule = {
      id: 'cm-' + Date.now(),
      slug: cleanSlug,
      title: data.title,
      category: data.category || 'Krizová pomoc & Komunita',
      icon: data.icon || 'Box',
      showInMenu: data.showInMenu !== undefined ? data.showInMenu : true,
      isActive: data.isActive !== undefined ? data.isActive : true,
      contentJson: data.contentJson,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.customModules.unshift(newModule);
    dbStore.logAudit('CUSTOM_MODULE_CREATE', 'CUSTOM_MODULES', `Vytvořen nový in-memory modul '${newModule.title}' (${newModule.slug})`, user);
    return newModule;
  }

  static async updateCustomModule(
    id: string,
    data: {
      slug?: string;
      title?: string;
      category?: string;
      icon?: string;
      showInMenu?: boolean;
      isActive?: boolean;
      contentJson?: string;
    },
    user?: User | null
  ): Promise<CustomModule> {
    if (data.contentJson) {
      try {
        JSON.parse(data.contentJson);
      } catch {
        throw new Error('Neplatný JSON formát v contentJson');
      }
    }

    const cleanSlug = data.slug ? data.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : undefined;

    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.customModule.update({
          where: { id },
          data: {
            ...(cleanSlug ? { slug: cleanSlug } : {}),
            ...(data.title ? { title: data.title } : {}),
            ...(data.category !== undefined ? { category: data.category } : {}),
            ...(data.icon !== undefined ? { icon: data.icon } : {}),
            ...(data.showInMenu !== undefined ? { showInMenu: data.showInMenu } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            ...(data.contentJson !== undefined ? { contentJson: data.contentJson } : {}),
          },
        });

        dbStore.logAudit('CUSTOM_MODULE_UPDATE', 'CUSTOM_MODULES', `Aktivován/upraven modul '${updated.title}' (${updated.slug})`, user);
        return updated;
      } catch (err) {
        console.info('[Fallback] updateCustomModule error, using dbStore:', err);
      }
    }

    const idx = dbStore.customModules.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Modul nebyl nalezen');

    const existing = dbStore.customModules[idx];
    const updatedModule: CustomModule = {
      ...existing,
      ...(cleanSlug ? { slug: cleanSlug } : {}),
      ...(data.title ? { title: data.title } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
      ...(data.showInMenu !== undefined ? { showInMenu: data.showInMenu } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.contentJson !== undefined ? { contentJson: data.contentJson } : {}),
      updatedAt: new Date(),
    };

    dbStore.customModules[idx] = updatedModule;
    dbStore.logAudit('CUSTOM_MODULE_UPDATE', 'CUSTOM_MODULES', `Upraven in-memory modul '${updatedModule.title}' (${updatedModule.slug})`, user);
    return updatedModule;
  }

  static async deleteCustomModule(id: string, user?: User | null): Promise<boolean> {
    if (isPrismaAvailable()) {
      try {
        const deleted = await prisma.customModule.delete({
          where: { id },
        });
        dbStore.logAudit('CUSTOM_MODULE_DELETE', 'CUSTOM_MODULES', `Smazán modul '${deleted.title}' (${deleted.slug})`, user);
        return true;
      } catch (err) {
        console.info('[Fallback] deleteCustomModule error, using dbStore:', err);
      }
    }

    const idx = dbStore.customModules.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const removed = dbStore.customModules.splice(idx, 1)[0];
      dbStore.logAudit('CUSTOM_MODULE_DELETE', 'CUSTOM_MODULES', `Smazán in-memory modul '${removed.title}'`, user);
      return true;
    }
    return false;
  }
}
