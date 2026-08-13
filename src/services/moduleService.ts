import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { Module, User } from '../types';

export class ModuleService {
  static async getAllModules(): Promise<Module[]> {
    if (isPrismaAvailable()) {
      try {
        const modules = await prisma.module.findMany({
          orderBy: { key: 'asc' },
        });
        return modules.map((m: any) => {
          let parsedConfig = {};
          try {
            parsedConfig = JSON.parse(m.config || '{}');
          } catch {
            parsedConfig = {};
          }
          return {
            id: m.id,
            key: m.key,
            name: m.name,
            version: m.version,
            enabled: m.enabled,
            public: m.public ?? true,
            config: m.config,
            configuration: parsedConfig,
            description: m.description || undefined,
            icon: m.icon || 'Package',
            createdAt: m.createdAt ? m.createdAt.toISOString() : undefined,
            updatedAt: m.updatedAt.toISOString(),
          };
        });
      } catch (err) {
        console.info('[Fallback] getAllModules error, using dbStore:', err);
      }
    }
    return dbStore.modules;
  }

  static async getModuleByKey(key: string): Promise<Module | null> {
    if (isPrismaAvailable()) {
      try {
        const m = await prisma.module.findUnique({ where: { key } });
        if (m) {
          let parsedConfig = {};
          try {
            parsedConfig = JSON.parse(m.config || '{}');
          } catch {
            parsedConfig = {};
          }
          return {
            id: m.id,
            key: m.key,
            name: m.name,
            version: m.version,
            enabled: m.enabled,
            public: m.public ?? true,
            config: m.config,
            configuration: parsedConfig,
            description: m.description || undefined,
            icon: m.icon || 'Package',
            createdAt: m.createdAt ? m.createdAt.toISOString() : undefined,
            updatedAt: m.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.info('[Fallback] getModuleByKey error, using dbStore:', err);
      }
    }
    return dbStore.modules.find((m) => m.key === key) || null;
  }

  static async enableModule(key: string, user?: User | null): Promise<Module> {
    return this.toggleModule(key, true, user);
  }

  static async disableModule(key: string, user?: User | null): Promise<Module> {
    return this.toggleModule(key, false, user);
  }

  static async toggleModule(key: string, enabled: boolean, user?: User | null): Promise<Module> {
    if (isPrismaAvailable()) {
      try {
        const mod = await prisma.module.update({
          where: { key },
          data: { enabled },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: enabled ? 'MODULE_ENABLE' : 'MODULE_DISABLE',
            module: 'MODULE_MANAGER',
            details: `Modul '${mod.name}' (${key}) byl ${enabled ? 'aktivován' : 'deaktivován'}.`,
          },
        });

        let parsedConfig = {};
        try {
          parsedConfig = JSON.parse(mod.config || '{}');
        } catch {
          parsedConfig = {};
        }

        return {
          id: mod.id,
          key: mod.key,
          name: mod.name,
          version: mod.version,
          enabled: mod.enabled,
          public: mod.public ?? true,
          config: mod.config,
          configuration: parsedConfig,
          description: mod.description || undefined,
          icon: mod.icon || 'Package',
          createdAt: mod.createdAt ? mod.createdAt.toISOString() : undefined,
          updatedAt: mod.updatedAt.toISOString(),
        };
      } catch (err) {
        console.info('[Fallback] toggleModule error, using dbStore:', err);
      }
    }

    const mod = dbStore.modules.find((m) => m.key === key);
    if (!mod) throw new Error(`Modul '${key}' nenalezen.`);

    mod.enabled = enabled;
    mod.updatedAt = new Date().toISOString();

    dbStore.logAudit(
      enabled ? 'MODULE_ENABLE' : 'MODULE_DISABLE',
      'MODULE_MANAGER',
      `Modul '${mod.name}' (${key}) byl ${enabled ? 'aktivován' : 'deaktivován'}.`,
      user
    );

    return mod;
  }

  static async updateModuleConfig(key: string, configJson: string, user?: User | null): Promise<Module> {
    try {
      JSON.parse(configJson);
    } catch {
      throw new Error('Konfigurace modulu musí být platný řetězec JSON.');
    }

    if (isPrismaAvailable()) {
      try {
        const mod = await prisma.module.update({
          where: { key },
          data: { config: configJson },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'MODULE_CONFIG_UPDATE',
            module: 'MODULE_MANAGER',
            details: `Aktualizována konfigurace modulu '${mod.name}'.`,
          },
        });

        let parsedConfig = {};
        try {
          parsedConfig = JSON.parse(mod.config || '{}');
        } catch {
          parsedConfig = {};
        }

        return {
          id: mod.id,
          key: mod.key,
          name: mod.name,
          version: mod.version,
          enabled: mod.enabled,
          public: mod.public ?? true,
          config: mod.config,
          configuration: parsedConfig,
          description: mod.description || undefined,
          icon: mod.icon || 'Package',
          createdAt: mod.createdAt ? mod.createdAt.toISOString() : undefined,
          updatedAt: mod.updatedAt.toISOString(),
        };
      } catch (err) {
        console.info('[Fallback] updateModuleConfig error, using dbStore:', err);
      }
    }

    const mod = dbStore.modules.find((m) => m.key === key);
    if (!mod) throw new Error(`Modul '${key}' nenalezen.`);

    mod.config = configJson;
    mod.updatedAt = new Date().toISOString();

    dbStore.logAudit('MODULE_CONFIG_UPDATE', 'MODULE_MANAGER', `Aktualizována konfigurace modulu '${mod.name}'.`, user);
    return mod;
  }
}
