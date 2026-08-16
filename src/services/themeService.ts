import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { Theme, ThemeVariable, ThemeSetting, User } from '../types';

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
   */
  static async getThemes(): Promise<Theme[]> {
    if (isPrismaAvailable()) {
      try {
        const themes = await prisma.theme.findMany({
          include: { variables: true },
          orderBy: { createdAt: 'asc' },
        });

        if (themes.length > 0) {
          return themes.map((t) => ({
            id: t.id,
            key: t.key,
            name: t.name,
            description: t.description || undefined,
            isDefault: t.isDefault,
            active: t.active,
            context: t.context,
            variables: t.variables.map((v) => ({
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
        console.warn('Prisma getThemes error, falling back:', err);
      }
    }

    // Fallback store
    if (!dbStore.themes || dbStore.themes.length === 0) {
      const defaultVars: ThemeVariable[] = defaultThemeSettingsToVars('thm-default', dbStore.themes);
      return [
        {
          id: 'thm-default',
          key: 'default',
          name: 'Výchozí Světlé Téma',
          description: 'Oficiální barevný profil portálu Táta má právo',
          isDefault: true,
          active: true,
          context: 'GLOBAL',
          variables: defaultVars,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    const legacyVars: ThemeVariable[] = dbStore.themes.map((t) => ({
      id: t.id,
      key: t.key,
      value: t.value,
      label: t.label,
      category: t.category,
      updatedAt: t.updatedAt,
    }));

    return [
      {
        id: 'thm-default',
        key: 'default',
        name: 'Výchozí Světlé Téma',
        description: 'Oficiální barevný profil portálu',
        isDefault: true,
        active: true,
        context: 'GLOBAL',
        variables: legacyVars,
        updatedAt: new Date().toISOString(),
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
   * Create a new theme
   */
  static async createTheme(
    data: {
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
    const userEmail = user?.email || 'system@tatovacesta.cz';

    if (isPrismaAvailable()) {
      try {
        const created = await prisma.theme.create({
          data: {
            key: data.key,
            name: data.name,
            description: data.description,
            isDefault: Boolean(data.isDefault),
            active: data.active !== undefined ? Boolean(data.active) : false,
            context: data.context || 'GLOBAL',
          },
        });

        // Initialize theme variables from default template or provided map
        const varEntries = DEFAULT_THEME_VARIABLES.map((item) => ({
          themeId: created.id,
          key: item.key,
          value: (data.variables && data.variables[item.key]) || item.value,
          label: item.label,
          category: item.category,
        }));

        await prisma.themeVariable.createMany({
          data: varEntries,
        });

        const fullTheme = await prisma.theme.findUnique({
          where: { id: created.id },
          include: { variables: true },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail,
            action: 'THEME_CREATE',
            module: 'THEME_MANAGER',
            details: `Vytvořeno nové téma '${data.name}' [${data.key}] pro kontext '${data.context || 'GLOBAL'}'.`,
          },
        });

        return {
          id: fullTheme!.id,
          key: fullTheme!.key,
          name: fullTheme!.name,
          description: fullTheme!.description || undefined,
          isDefault: fullTheme!.isDefault,
          active: fullTheme!.active,
          context: fullTheme!.context,
          variables: fullTheme!.variables.map((v) => ({
            id: v.id,
            themeId: v.themeId || fullTheme!.id,
            key: v.key,
            value: v.value,
            label: v.label,
            category: v.category,
            updatedAt: v.updatedAt.toISOString(),
          })),
          updatedAt: fullTheme!.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createTheme error, falling back:', err);
      }
    }

    const newThemeId = 'thm-' + Date.now();
    const newVars: ThemeVariable[] = DEFAULT_THEME_VARIABLES.map((item) => ({
      id: 'var-' + crypto.randomUUID(),
      themeId: newThemeId,
      key: item.key,
      value: (data.variables && data.variables[item.key]) || item.value,
      label: item.label,
      category: item.category,
      updatedAt: new Date().toISOString(),
    }));

    const newTheme: Theme = {
      id: newThemeId,
      key: data.key,
      name: data.name,
      description: data.description,
      isDefault: Boolean(data.isDefault),
      active: Boolean(data.active),
      context: data.context || 'GLOBAL',
      variables: newVars,
      updatedAt: new Date().toISOString(),
    };

    dbStore.logAudit('THEME_CREATE', 'THEME_MANAGER', `Vytvořeno nové téma '${data.name}' [${data.key}].`, user);
    return newTheme;
  }

  /**
   * Set theme active for context
   */
  static async activateTheme(idOrKey: string, user?: User | null): Promise<Theme> {
    const userEmail = user?.email || 'system@tatovacesta.cz';

    if (isPrismaAvailable()) {
      try {
        const theme = await prisma.theme.findFirst({
          where: { OR: [{ id: idOrKey }, { key: idOrKey }] },
        });

        if (theme) {
          // Deactivate other themes in same context
          await prisma.theme.updateMany({
            where: { context: theme.context },
            data: { active: false },
          });

          // Activate target theme
          const updated = await prisma.theme.update({
            where: { id: theme.id },
            data: { active: true },
            include: { variables: true },
          });

          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail,
              action: 'THEME_ACTIVATE',
              module: 'THEME_MANAGER',
              details: `Aktivováno téma '${updated.name}' [${updated.key}] pro kontext '${updated.context}'.`,
            },
          });

          return {
            id: updated.id,
            key: updated.key,
            name: updated.name,
            description: updated.description || undefined,
            isDefault: updated.isDefault,
            active: updated.active,
            context: updated.context,
            variables: updated.variables.map((v) => ({
              id: v.id,
              themeId: v.themeId || updated.id,
              key: v.key,
              value: v.value,
              label: v.label,
              category: v.category,
              updatedAt: v.updatedAt.toISOString(),
            })),
            updatedAt: updated.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('Prisma activateTheme error, falling back:', err);
      }
    }

    dbStore.logAudit('THEME_ACTIVATE', 'THEME_MANAGER', `Aktivováno téma '${idOrKey}'.`, user);
    const themes = await this.getThemes();
    return themes[0];
  }

  /**
   * Update theme variables for specified theme
   */
  static async updateThemeVariables(
    idOrKey: string,
    variablesMap: Record<string, string>,
    user?: User | null
  ): Promise<Theme> {
    const userEmail = user?.email || 'system@tatovacesta.cz';

    if (isPrismaAvailable()) {
      try {
        const theme = await prisma.theme.findFirst({
          where: { OR: [{ id: idOrKey }, { key: idOrKey }] },
          include: { variables: true },
        });

        if (theme) {
          for (const [varKey, val] of Object.entries(variablesMap)) {
            const existingVar = theme.variables.find((v) => v.key === varKey);
            if (existingVar) {
              await prisma.themeVariable.update({
                where: { id: existingVar.id },
                data: { value: val },
              });
            } else {
              const template = DEFAULT_THEME_VARIABLES.find((t) => t.key === varKey);
              await prisma.themeVariable.create({
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

          const updatedTheme = await prisma.theme.findUnique({
            where: { id: theme.id },
            include: { variables: true },
          });

          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail,
              action: 'THEME_VARIABLES_UPDATE',
              module: 'THEME_MANAGER',
              details: `Aktualizovány barevné proměnné pro téma '${theme.name}' [${theme.key}].`,
            },
          });

          return {
            id: updatedTheme!.id,
            key: updatedTheme!.key,
            name: updatedTheme!.name,
            description: updatedTheme!.description || undefined,
            isDefault: updatedTheme!.isDefault,
            active: updatedTheme!.active,
            context: updatedTheme!.context,
            variables: updatedTheme!.variables.map((v) => ({
              id: v.id,
              themeId: v.themeId || updatedTheme!.id,
              key: v.key,
              value: v.value,
              label: v.label,
              category: v.category,
              updatedAt: v.updatedAt.toISOString(),
            })),
            updatedAt: updatedTheme!.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('Prisma updateThemeVariables error, falling back:', err);
      }
    }

    // Update in memory dbStore
    for (const [vKey, val] of Object.entries(variablesMap)) {
      const item = dbStore.themes.find((t) => t.key === vKey);
      if (item) {
        item.value = val;
        item.updatedAt = new Date().toISOString();
      }
    }

    dbStore.logAudit('THEME_VARIABLES_UPDATE', 'THEME_MANAGER', `Aktualizovány barevné proměnné.`, user);
    const themes = await this.getThemes();
    return themes[0];
  }

  /**
   * Delete custom theme (cannot delete default)
   */
  static async deleteTheme(idOrKey: string, user?: User | null): Promise<boolean> {
    const userEmail = user?.email || 'system@tatovacesta.cz';

    if (isPrismaAvailable()) {
      try {
        const theme = await prisma.theme.findFirst({
          where: { OR: [{ id: idOrKey }, { key: idOrKey }] },
        });

        if (theme) {
          if (theme.isDefault) {
            throw new Error('Nelze odstranit výchozí téma systému.');
          }

          await prisma.theme.delete({ where: { id: theme.id } });

          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail,
              action: 'THEME_DELETE',
              module: 'THEME_MANAGER',
              details: `Odstraněno téma '${theme.name}' [${theme.key}].`,
            },
          });
          return true;
        }
      } catch (err: any) {
        if (err.message?.includes('výchozí')) throw err;
        console.warn('Prisma deleteTheme error, falling back:', err);
      }
    }

    dbStore.logAudit('THEME_DELETE', 'THEME_MANAGER', `Odstraněno téma '${idOrKey}'.`, user);
    return true;
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
    return dbStore.themes;
  }

  static async updateThemeColor(key: string, value: string, user?: User | null): Promise<ThemeSetting> {
    const activeTheme = await this.getActiveTheme('GLOBAL');
    await this.updateThemeVariables(activeTheme.id, { [key]: value }, user);
    const updated = await this.getAllThemeSettings();
    const item = updated.find((u) => u.key === key);
    return item || {
      id: 'thm-' + key,
      key,
      value,
      label: key,
      category: 'color',
      updatedAt: new Date().toISOString(),
    };
  }

  static async updateAllThemes(settings: Record<string, string>, user?: User | null): Promise<ThemeSetting[]> {
    const activeTheme = await this.getActiveTheme('GLOBAL');
    await this.updateThemeVariables(activeTheme.id, settings, user);
    return this.getAllThemeSettings();
  }
}

function defaultThemeSettingsToVars(themeId: string, settings: ThemeSetting[]): ThemeVariable[] {
  return settings.map((s) => ({
    id: s.id,
    themeId,
    key: s.key,
    value: s.value,
    label: s.label,
    category: s.category,
    updatedAt: s.updatedAt,
  }));
}
