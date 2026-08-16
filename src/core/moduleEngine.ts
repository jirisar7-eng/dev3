import { ModuleContract, ModulePermissionDef, ModuleRouteDef, User } from '../types';
import { ModuleService } from '../services/moduleService';

export class ModuleEngine {
  private static instance: ModuleEngine;
  private contracts: Map<string, ModuleContract> = new Map();

  private constructor() {}

  public static getInstance(): ModuleEngine {
    if (!ModuleEngine.instance) {
      ModuleEngine.instance = new ModuleEngine();
    }
    return ModuleEngine.instance;
  }

  /**
   * Registers a new module contract in the engine.
   * Core only knows about contracts registered via this interface.
   */
  public registerModuleContract<TConfig = Record<string, any>>(contract: ModuleContract<TConfig>): void {
    if (this.contracts.has(contract.metadata.key)) {
      console.warn(`[ModuleEngine] Modul s klíčem '${contract.metadata.key}' je již zaregistrován. Přepisuji.`);
    }
    this.contracts.set(contract.metadata.key, contract as unknown as ModuleContract);
  }

  /**
   * Retrieves a contract by key.
   */
  public getContract(key: string): ModuleContract | undefined {
    return this.contracts.get(key);
  }

  /**
   * Returns list of all registered contracts.
   */
  public getRegisteredContracts(): ModuleContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Checks whether a module is currently ENABLED in DB.
   */
  public async isEnabled(key: string): Promise<boolean> {
    const mod = await ModuleService.getModuleByKey(key);
    return mod ? mod.enabled : false;
  }

  /**
   * Returns merged configuration for a module (DB config over default config).
   */
  public async getConfig<TConfig = Record<string, any>>(key: string): Promise<TConfig> {
    const contract = this.getContract(key);
    const defaultConfig = (contract?.defaultConfig || {}) as TConfig;

    const dbMod = await ModuleService.getModuleByKey(key);
    if (!dbMod || !dbMod.config) {
      return defaultConfig;
    }

    try {
      const dbConfig = JSON.parse(dbMod.config);
      return { ...defaultConfig, ...dbConfig };
    } catch {
      return defaultConfig;
    }
  }

  /**
   * Executes a protected action on a registered module.
   * Enforces lifecycle (must be ENABLED) and permissions.
   */
  public async executeAction<TResult = any>(
    key: string,
    actionName: string,
    payload: any = {},
    user?: User | null
  ): Promise<{ success: boolean; data?: TResult; error?: string }> {
    const contract = this.getContract(key);
    if (!contract) {
      return { success: false, error: `Modul s klíčem '${key}' není v Module Engine zaregistrován.` };
    }

    const enabled = await this.isEnabled(key);
    if (!enabled) {
      return { success: false, error: `Modul '${contract.metadata.name}' (${key}) je vypnutý (DISABLED). Přístup zamítnut.` };
    }

    // Check if route or permission is specified
    const route = contract.routes?.find((r) => r.handlerName === actionName);
    if (route && route.permissionRequired) {
      if (!user) {
        return { success: false, error: `Akce '${actionName}' vyžaduje přihlášeného uživatele.` };
      }
      // Check admin/super_admin or role permission
      const hasPermission = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      if (!hasPermission) {
        return { success: false, error: `Uživatel nemá oprávnění '${route.permissionRequired}'.` };
      }
    }

    return {
      success: true,
      data: {
        executedAction: actionName,
        moduleKey: key,
        timestamp: new Date().toISOString(),
        payload,
      } as unknown as TResult,
    };
  }
}

export const moduleEngine = ModuleEngine.getInstance();
