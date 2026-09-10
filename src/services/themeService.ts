import { prisma, isPrismaAvailable } from '../db/prisma';
import { Theme, ThemeVariable, ThemeSetting, User } from '../types';
import {
  ALLOWED_THEME_VARIABLE_KEYS,
  CreateThemeSchema,
  UpdateThemeVariablesSchema,
  UpdateThemeSingleColorSchema,
} from './themeValidation';

// ---------------------------------------------------------------------------
// Error Hierarchy for Theme Service (Uniform Server-Side Error Model)
// ---------------------------------------------------------------------------
export class ThemeServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'THEME_ERROR'
  ) {
    super(message);
    this.name = 'ThemeServiceError';
  }
}

export class ThemeValidationError extends ThemeServiceError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'THEME_VALIDATION_ERROR');
    this.name = 'ThemeValidationError';
  }
}

export class ThemeNotFoundError extends ThemeServiceError {
  constructor(message: string = 'Téma nebylo nalezeno.') {
    super(message, 404, 'THEME_NOT_FOUND');
    this.name = 'ThemeNotFoundError';
  }
}

export class ThemeConflictError extends ThemeServiceError {
  constructor(message: string = 'Téma s tímto klíčem již existuje.') {
    super(message, 409, 'THEME_CONFLICT');
    this.name = 'ThemeConflictError';
  }
}

export class ThemePersistenceError extends ThemeServiceError {
  constructor(
    message: string = 'Theme persistence unavailable',
    public originalError?: any
  ) {
    super('Theme persistence unavailable', 503, 'THEME_PERSISTENCE_ERROR');
    this.name = 'ThemePersistenceError';
  }
}

export const DEFAULT_THEME_VARIABLES = [
  { key: 'primary', value: '#1e3a8a', label: 'Hlavní barva (Primary)', category: 'color' },
  { key: 'secondary', value: '#0284c7', label: 'Sekundární barva (Secondary)', category: 'color' },
  { key: 'background', value: '#f8fafc', label: 'Pozadí stránek (Background)', category: 'color' },
  { key: 'surface', value: '#ffffff', label: 'Povrch karet & modulů (Surface)', category: 'color' },
  { key: 'text', value: '#1e293b', label: 'Hlavní text (Text)', category: 'color' },
  { key: 'textMuted', value: '#64748b', label: 'Tlumený text (Text Muted)', category: 'color' },
  { key: 'heading', value: '#0f172a', label: 'Text nadpisů (Heading)', category: 'color' },
  { key: 'link', value: '#2563eb', label: 'Odkazy & Akce (Link)', category: 'color' },
  { key: 'border', value: '#e2e8f0', label: 'Rámečky & Oddělovače (Border)', category: 'color' },
  { key: 'button', value: '#1e3a8a', label: 'Hlavní tlačítko (Button)', category: 'color' },
  { key: 'buttonHover', value: '#0f172a', label: 'Tlačítko při najetí (Button Hover)', category: 'color' },
  { key: 'success', value: '#16a34a', label: 'Stav Úspěch (Success)', category: 'color' },
  { key: 'warning', value: '#d97706', label: 'Stav Varování (Warning)', category: 'color' },
  { key: 'error', value: '#dc2626', label: 'Stav Chyba (Error)', category: 'color' },
];

export class ThemeService {
  /**
   * Retrieves all themes with their associated variables.
   * Read-only operation: if database is unavailable, returns safe default fallback
   * without mutating any persistent state.
   */
  static async getThemes(): Promise<Theme[]> {
    if (isPrismaAvailable()) {
      try {
        const themes = await prisma.theme.findMany({
          include: { variables: true },
          orderBy: { createdAt: 'asc' },
        });

        if (themes && themes.length > 0) {
          return themes.map((t: any) => ({
            id: t.id,
            key: t.key,
            name: t.name,
            description: t.description || undefined,
            isDefault: t.isDefault,
            active: t.active,
            context: t.context,
            variables: t.variables.map((v: any) => ({
              id: v.id,
              themeId: v.themeId || t.id,
              key: v.key,
              value: v.value,
              label: v.label,
              category: v.category,
              updatedAt: v.updatedAt.toISOString(),
            })),
            updatedAt: t.updatedAt.toISOString(),
          }));
        }
      } catch (err) {
        console.warn('[ThemeService] Prisma getThemes error, falling back to read-only defaults:', err);
      }
    }

    // Read-only fallback store: never mutates, does not present as persistent state
    const defaultVars: ThemeVariable[] = DEFAULT_THEME_VARIABLES.map((item) => ({
      id: 'var-default-' + item.key,
      themeId: 'thm-default',
      key: item.key,
      value: item.value,
      label: item.label,
      category: item.category,
      updatedAt: new Date(0).toISOString(),
    }));

    return [
      {
        id: 'thm-default',
        key: 'default',
        name: 'Výchozí Světlé Téma',
        description: 'Oficiální barevný profil portálu Táta má právo (read-only záloha)',
        isDefault: true,
        active: true,
        context: 'GLOBAL',
        variables: defaultVars,
        updatedAt: new Date(0).toISOString(),
      },
    ];
  }

  /**
   * Returns active theme for specific context (PUBLIC, PRIVATE, ADMIN, GLOBAL)
   */
  static async getActiveTheme(context: string = 'GLOBAL'): Promise<Theme> {
    const allThemes = await this.getThemes();
    const active = allThemes.find((t) => t.active && (t.context === context || t.context === 'GLOBAL'));
    if (active) return active;
    const defaultTheme = allThemes.find((t) => t.isDefault);
    return defaultTheme || allThemes[0];
  }

  /**
   * Gets CSS variable key-value map e.g. { '--color-primary': '#1e3a8a', ... }
   */
  static async getCssVariablesMap(context: string = 'GLOBAL'): Promise<Record<string, string>> {
    const activeTheme = await this.getActiveTheme(context);
    const map: Record<string, string> = {};
    if (activeTheme && activeTheme.variables) {
      for (const v of activeTheme.variables) {
        map[`--color-${v.key}`] = v.value;
      }
    }
    return map;
  }

  /**
   * Create a new theme.
   * Strict fail-closed: requires PostgreSQL/Prisma persistence.
   * Atomic: executes creation, initial variables, context deactivation (if active)
   * and audit log in a single transaction.
   */
  static async createTheme(
    rawData: {
      key: string;
      name: string;
      description?: string;
      isDefault?: boolean;
      active?: boolean;
      context?: string;
      variables?: Record<string, string>;
    },
    user?: User | null
  ): Promise<Theme> {
    const parseResult = CreateThemeSchema.safeParse(rawData);
    if (!parseResult.success) {
      throw new ThemeValidationError(
        'Validační chyba při vytváření tématu: zkontrolujte povolený formát klíče, názvu a proměnných.',
        parseResult.error.format()
      );
    }

    const data = parseResult.data;
    const targetContext = data.context || 'GLOBAL';

    if (!isPrismaAvailable()) {
      throw new ThemePersistenceError('Theme persistence unavailable: databáze není dostupná.');
    }

    const userEmail = user?.email || 'system@tatovacesta.cz';

    try {
      const fullTheme = await prisma.$transaction(async (tx: any) => {
        // 1. Ověřit unikátnost klíče tématu
        const existing = await tx.theme.findUnique({
          where: { key: data.key },
        });
        if (existing) {
          throw new ThemeConflictError(`Téma s klíčem '${data.key}' již existuje.`);
        }

        // 2. Pokud je téma vytvářeno jako aktivní, atomicky deaktivovat ostatní témata stejného kontextu
        if (data.active) {
          await tx.theme.updateMany({
            where: { context: targetContext },
            data: { active: false },
          });
        }

        // 3. Vytvořit samotné téma (uživatelsky vytvořené téma nemůže být systémové isDefault)
        const created = await tx.theme.create({
          data: {
            key: data.key,
            name: data.name,
            description: data.description || null,
            isDefault: false,
            active: Boolean(data.active),
            context: targetContext,
          },
        });

        // 4. Inicializovat proměnné tématu z výchozí šablony nebo z předaných hodnot
        const varEntries = DEFAULT_THEME_VARIABLES.map((item) => ({
          themeId: created.id,
          key: item.key,
          value: (data.variables && data.variables[item.key]) || item.value,
          label: item.label,
          category: item.category,
        }));

        await tx.themeVariable.createMany({
          data: varEntries,
        });

        // 5. Auditní záznam ve stejné atomické transakci
        await tx.auditLog.create({
          data: {
            userId: user?.id || null,
            userEmail,
            action: 'THEME_CREATE',
            module: 'THEME_MANAGER',
            details: `Vytvořeno nové téma '${data.name}' [${data.key}] pro kontext '${targetContext}' (active: ${Boolean(data.active)}).`,
          },
        });

        return await tx.theme.findUnique({
          where: { id: created.id },
          include: { variables: true },
        });
      });

      return {
        id: fullTheme.id,
        key: fullTheme.key,
        name: fullTheme.name,
        description: fullTheme.description || undefined,
        isDefault: fullTheme.isDefault,
        active: fullTheme.active,
        context: fullTheme.context,
        variables: fullTheme.variables.map((v: any) => ({
          id: v.id,
          themeId: v.themeId || fullTheme.id,
          key: v.key,
          value: v.value,
          label: v.label,
          category: v.category,
          updatedAt: v.updatedAt.toISOString(),
        })),
        updatedAt: fullTheme.updatedAt.toISOString(),
      };
    } catch (err: any) {
      if (err instanceof ThemeServiceError) {
        throw err;
      }
      if (err?.code === 'P2002') {
        throw new ThemeConflictError(`Téma s klíčem '${data.key}' již existuje.`);
      }
      throw new ThemePersistenceError(`Chyba perzistence při vytváření tématu: ${err?.message || err}`, err);
    }
  }

  /**
   * Set theme active for its context atomically.
   * Deactivates all other themes in the same context, activates target theme,
   * and records audit log in a single rollback-safe Prisma transaction.
   */
  static async activateTheme(idOrKey: string, user?: User | null): Promise<Theme> {
    if (!idOrKey || typeof idOrKey !== 'string') {
      throw new ThemeValidationError('Identifikátor nebo klíč tématu je povinný.');
    }

    if (!isPrismaAvailable()) {
      throw new ThemePersistenceError('Theme persistence unavailable: databáze není dostupná.');
    }

    const userEmail = user?.email || 'system@tatovacesta.cz';

    try {
      const updatedTheme = await prisma.$transaction(async (tx: any) => {
        // 1. Vyhledat cílové téma
        const theme = await tx.theme.findFirst({
          where: { OR: [{ id: idOrKey }, { key: idOrKey }] },
          include: { variables: true },
        });

        if (!theme) {
          throw new ThemeNotFoundError(`Téma '${idOrKey}' nebylo nalezeno.`);
        }

        // 2. Atomicky deaktivovat ostatní témata stejného kontextu
        await tx.theme.updateMany({
          where: {
            context: theme.context,
            id: { not: theme.id },
          },
          data: { active: false },
        });

        // 3. Aktivovat cílové téma
        const activated = await tx.theme.update({
          where: { id: theme.id },
          data: { active: true },
          include: { variables: true },
        });

        // 4. Uložit auditní záznam ve stejné transakci
        await tx.auditLog.create({
          data: {
            userId: user?.id || null,
            userEmail,
            action: 'THEME_ACTIVATE',
            module: 'THEME_MANAGER',
            details: `Aktivováno téma '${activated.name}' [${activated.key}] pro kontext '${activated.context}'.`,
          },
        });

        return activated;
      });

      return {
        id: updatedTheme.id,
        key: updatedTheme.key,
        name: updatedTheme.name,
        description: updatedTheme.description || undefined,
        isDefault: updatedTheme.isDefault,
        active: updatedTheme.active,
        context: updatedTheme.context,
        variables: updatedTheme.variables.map((v: any) => ({
          id: v.id,
          themeId: v.themeId || updatedTheme.id,
          key: v.key,
          value: v.value,
          label: v.label,
          category: v.category,
          updatedAt: v.updatedAt.toISOString(),
        })),
        updatedAt: updatedTheme.updatedAt.toISOString(),
      };
    } catch (err: any) {
      if (err instanceof ThemeServiceError) {
        throw err;
      }
      throw new ThemePersistenceError(`Chyba perzistence při aktivaci tématu: ${err?.message || err}`, err);
    }
  }

  /**
   * Update theme variables for specified theme.
   * Strict fail-closed: requires PostgreSQL/Prisma persistence.
   * Atomic: executes updates/creates and audit log in a single transaction.
   */
  static async updateThemeVariables(
    idOrKey: string,
    rawVariablesMap: Record<string, string>,
    user?: User | null
  ): Promise<Theme> {
    if (!idOrKey || typeof idOrKey !== 'string') {
      throw new ThemeValidationError('Identifikátor nebo klíč tématu je povinný.');
    }

    const parseResult = UpdateThemeVariablesSchema.safeParse(rawVariablesMap);
    if (!parseResult.success) {
      throw new ThemeValidationError(
        'Validační chyba proměnných tématu: zkontrolujte povolené klíče a formát HEX barev.',
        parseResult.error.format()
      );
    }

    const variablesMap = parseResult.data;

    if (!isPrismaAvailable()) {
      throw new ThemePersistenceError('Theme persistence unavailable: databáze není dostupná.');
    }

    const userEmail = user?.email || 'system@tatovacesta.cz';

    try {
      const updatedTheme = await prisma.$transaction(async (tx: any) => {
        const theme = await tx.theme.findFirst({
          where: { OR: [{ id: idOrKey }, { key: idOrKey }] },
          include: { variables: true },
        });

        if (!theme) {
          throw new ThemeNotFoundError(`Téma '${idOrKey}' nebylo nalezeno.`);
        }

        for (const [varKey, val] of Object.entries(variablesMap)) {
          const existingVar = theme.variables.find((v: any) => v.key === varKey);
          if (existingVar) {
            await tx.themeVariable.update({
              where: { id: existingVar.id },
              data: { value: val },
            });
          } else {
            const template = DEFAULT_THEME_VARIABLES.find((t) => t.key === varKey);
            await tx.themeVariable.create({
              data: {
                themeId: theme.id,
                key: varKey,
                value: val,
                label: template?.label || `Barva ${varKey}`,
                category: template?.category || 'color',
              },
            });
          }
        }

        // Audit log ve stejné transakci
        await tx.auditLog.create({
          data: {
            userId: user?.id || null,
            userEmail,
            action: 'THEME_VARIABLES_UPDATE',
            module: 'THEME_MANAGER',
            details: `Aktualizovány barevné proměnné pro téma '${theme.name}' [${theme.key}].`,
          },
        });

        return await tx.theme.findUnique({
          where: { id: theme.id },
          include: { variables: true },
        });
      });

      return {
        id: updatedTheme.id,
        key: updatedTheme.key,
        name: updatedTheme.name,
        description: updatedTheme.description || undefined,
        isDefault: updatedTheme.isDefault,
        active: updatedTheme.active,
        context: updatedTheme.context,
        variables: updatedTheme.variables.map((v: any) => ({
          id: v.id,
          themeId: v.themeId || updatedTheme.id,
          key: v.key,
          value: v.value,
          label: v.label,
          category: v.category,
          updatedAt: v.updatedAt.toISOString(),
        })),
        updatedAt: updatedTheme.updatedAt.toISOString(),
      };
    } catch (err: any) {
      if (err instanceof ThemeServiceError) {
        throw err;
      }
      throw new ThemePersistenceError(`Chyba perzistence při aktualizaci proměnných tématu: ${err?.message || err}`, err);
    }
  }

  /**
   * Delete custom theme (cannot delete default theme).
   * Strict fail-closed: requires PostgreSQL/Prisma persistence.
   * Atomic: executes deletion and audit log in a single transaction.
   */
  static async deleteTheme(idOrKey: string, user?: User | null): Promise<boolean> {
    if (!idOrKey || typeof idOrKey !== 'string') {
      throw new ThemeValidationError('Identifikátor nebo klíč tématu je povinný.');
    }

    if (!isPrismaAvailable()) {
      throw new ThemePersistenceError('Theme persistence unavailable: databáze není dostupná.');
    }

    const userEmail = user?.email || 'system@tatovacesta.cz';

    try {
      await prisma.$transaction(async (tx: any) => {
        const theme = await tx.theme.findFirst({
          where: { OR: [{ id: idOrKey }, { key: idOrKey }] },
        });

        if (!theme) {
          throw new ThemeNotFoundError(`Téma '${idOrKey}' nebylo nalezeno.`);
        }

        if (theme.isDefault) {
          throw new ThemeValidationError('Nelze odstranit výchozí téma systému.');
        }

        await tx.theme.delete({ where: { id: theme.id } });

        await tx.auditLog.create({
          data: {
            userId: user?.id || null,
            userEmail,
            action: 'THEME_DELETE',
            module: 'THEME_MANAGER',
            details: `Odstraněno téma '${theme.name}' [${theme.key}].`,
          },
        });
      });

      return true;
    } catch (err: any) {
      if (err instanceof ThemeServiceError) {
        throw err;
      }
      throw new ThemePersistenceError(`Chyba perzistence při odstraňování tématu: ${err?.message || err}`, err);
    }
  }

  // --- Legacy helpers for backward compatibility ---

  static async getAllThemeSettings(): Promise<ThemeSetting[]> {
    const activeTheme = await this.getActiveTheme('GLOBAL');
    if (activeTheme && activeTheme.variables && activeTheme.variables.length > 0) {
      return activeTheme.variables.map((v) => ({
        id: v.id,
        key: v.key,
        value: v.value,
        label: v.label,
        category: v.category,
        updatedAt: v.updatedAt || new Date().toISOString(),
      }));
    }
    return DEFAULT_THEME_VARIABLES.map((item) => ({
      id: 'thm-' + item.key,
      key: item.key,
      value: item.value,
      label: item.label,
      category: item.category,
      updatedAt: new Date(0).toISOString(),
    }));
  }

  static async updateThemeColor(key: string, value: string, user?: User | null): Promise<ThemeSetting> {
    const parseResult = UpdateThemeSingleColorSchema.safeParse({ key, value });
    if (!parseResult.success) {
      throw new ThemeValidationError(
        `Neplatný klíč nebo hodnota barvy tématu: ${parseResult.error.issues.map((e) => e.message).join(', ')}`,
        parseResult.error.format()
      );
    }

    const activeTheme = await this.getActiveTheme('GLOBAL');
    if (!activeTheme || !activeTheme.id) {
      throw new ThemeNotFoundError('Aktivní téma nebylo nalezeno.');
    }

    await this.updateThemeVariables(activeTheme.id, { [key]: value }, user);
    const updated = await this.getAllThemeSettings();
    const item = updated.find((u) => u.key === key);
    if (!item) {
      throw new ThemeNotFoundError(`Proměnná '${key}' nebyla nalezena.`);
    }
    return item;
  }

  static async updateAllThemes(settings: Record<string, string>, user?: User | null): Promise<ThemeSetting[]> {
    const parseResult = UpdateThemeVariablesSchema.safeParse(settings);
    if (!parseResult.success) {
      throw new ThemeValidationError(
        `Neplatné proměnné tématu: ${parseResult.error.issues.map((e) => e.message).join(', ')}`,
        parseResult.error.format()
      );
    }

    const activeTheme = await this.getActiveTheme('GLOBAL');
    if (!activeTheme || !activeTheme.id) {
      throw new ThemeNotFoundError('Aktivní téma nebylo nalezeno.');
    }
    await this.updateThemeVariables(activeTheme.id, settings, user);
    return this.getAllThemeSettings();
  }
}
