/**
 * Canonical Theme Token Definitions & Mapping Contract
 * Task ID: TMPR-20260910-THEME-004
 * 
 * Defines the single source of truth for design tokens in Táta má právo,
 * establishing a 1:1 bidirectional mapping between legacy ThemeVariable keys
 * (DB persistence schema) and modern semantic design tokens (Tailwind v4 @theme bridge).
 */

export type TokenCategory = 'BRAND' | 'SURFACE' | 'TEXT' | 'BORDER' | 'ACTION' | 'SEMANTIC';

export interface SemanticTokenDefinition {
  /** Semantic token identifier (e.g. 'brand-primary', 'surface-page') */
  token: string;
  /** Logical token category */
  category: TokenCategory;
  /** Legacy key stored in DB (e.g. 'primary', 'background') */
  legacyKey: string;
  /** Runtime semantic CSS custom property name */
  cssVar: string;
  /** Backward-compatible legacy CSS custom property name */
  legacyCssVar: string;
  /** Human-readable label */
  label: string;
  /** Fallback hex value matching Tata Classic SSOT */
  fallbackValue: string;
  /** Description of functional usage */
  description: string;
}

export const SEMANTIC_TOKEN_DEFINITIONS: readonly SemanticTokenDefinition[] = [
  // BRAND
  {
    token: 'brand-primary',
    category: 'BRAND',
    legacyKey: 'primary',
    cssVar: '--color-brand-primary',
    legacyCssVar: '--color-primary',
    label: 'Hlavní barva značky (Brand Primary)',
    fallbackValue: '#1e3a8a',
    description: 'Primární vizuální identita portálu, klíčové akcenty a brandové prvky.',
  },
  {
    token: 'brand-secondary',
    category: 'BRAND',
    legacyKey: 'secondary',
    cssVar: '--color-brand-secondary',
    legacyCssVar: '--color-secondary',
    label: 'Sekundární barva značky (Brand Secondary)',
    fallbackValue: '#0284c7',
    description: 'Doplňková barva pro zvýraznění, infoboxy a jemné vizuální vazby.',
  },

  // SURFACE
  {
    token: 'surface-page',
    category: 'SURFACE',
    legacyKey: 'background',
    cssVar: '--color-surface-page',
    legacyCssVar: '--color-background',
    label: 'Pozadí stránek (Surface Page)',
    fallbackValue: '#f8fafc',
    description: 'Základní plátno a neutrální podklad pro veřejné i klientské pohledy.',
  },
  {
    token: 'surface-card',
    category: 'SURFACE',
    legacyKey: 'surface',
    cssVar: '--color-surface-card',
    legacyCssVar: '--color-surface',
    label: 'Povrch karet & modulů (Surface Card)',
    fallbackValue: '#ffffff',
    description: 'Podklad pro interaktivní karty, modální okna, panely a formuláře.',
  },

  // TEXT
  {
    token: 'text-primary',
    category: 'TEXT',
    legacyKey: 'text',
    cssVar: '--color-text-primary',
    legacyCssVar: '--color-text',
    label: 'Hlavní text těla (Text Primary)',
    fallbackValue: '#1e293b',
    description: 'Primární text pro vysoký kontrast a maximální čitelnost.',
  },
  {
    token: 'text-muted',
    category: 'TEXT',
    legacyKey: 'textMuted',
    cssVar: '--color-text-muted',
    legacyCssVar: '--color-textMuted',
    label: 'Tlumený text (Text Muted)',
    fallbackValue: '#64748b',
    description: 'Sekundární popisky, nápovědy, metadata a časová razítka.',
  },
  {
    token: 'text-heading',
    category: 'TEXT',
    legacyKey: 'heading',
    cssVar: '--color-text-heading',
    legacyCssVar: '--color-heading',
    label: 'Text nadpisů (Text Heading)',
    fallbackValue: '#0f172a',
    description: 'H1 až H4 nadpisy, titulky modulů a klíčové orientační body.',
  },

  // BORDER
  {
    token: 'border-default',
    category: 'BORDER',
    legacyKey: 'border',
    cssVar: '--color-border-default',
    legacyCssVar: '--color-border',
    label: 'Rámečky & oddělovače (Border Default)',
    fallbackValue: '#e2e8f0',
    description: 'Standardní hranice karet, oddělovací linky a ohraničení polí.',
  },

  // ACTION
  {
    token: 'action-primary',
    category: 'ACTION',
    legacyKey: 'button',
    cssVar: '--color-action-primary',
    legacyCssVar: '--color-button',
    label: 'Hlavní akční prvek (Action Primary)',
    fallbackValue: '#1e3a8a',
    description: 'Primární tlačítka formulářů, klíčové CTA a potvrzovací kroky.',
  },
  {
    token: 'action-primary-hover',
    category: 'ACTION',
    legacyKey: 'buttonHover',
    cssVar: '--color-action-primary-hover',
    legacyCssVar: '--color-buttonHover',
    label: 'Akční prvek při najetí (Action Primary Hover)',
    fallbackValue: '#0f172a',
    description: 'Stav najetí kurzoru (hover) a aktivního stisku primárních tlačítek.',
  },
  {
    token: 'action-link',
    category: 'ACTION',
    legacyKey: 'link',
    cssVar: '--color-action-link',
    legacyCssVar: '--color-link',
    label: 'Odkazy a navigace (Action Link)',
    fallbackValue: '#2563eb',
    description: 'Hypertextové odkazy, navigační kotvy a interaktivní textové akce.',
  },

  // SEMANTIC / STATUS
  {
    token: 'status-success',
    category: 'SEMANTIC',
    legacyKey: 'success',
    cssVar: '--color-status-success',
    legacyCssVar: '--color-success',
    label: 'Stav Úspěch (Status Success)',
    fallbackValue: '#16a34a',
    description: 'Potvrzení úspěšné operace, validní stavy a pozitivní indikátory.',
  },
  {
    token: 'status-warning',
    category: 'SEMANTIC',
    legacyKey: 'warning',
    cssVar: '--color-status-warning',
    legacyCssVar: '--color-warning',
    label: 'Stav Varování (Status Warning)',
    fallbackValue: '#d97706',
    description: 'Upozornění vyžadující pozornost uživatele bez blokování toku.',
  },
  {
    token: 'status-danger',
    category: 'SEMANTIC',
    legacyKey: 'error',
    cssVar: '--color-status-danger',
    legacyCssVar: '--color-error',
    label: 'Stav Chyba / Destruktivní akce (Status Danger)',
    fallbackValue: '#dc2626',
    description: 'Kritické chyby, nevalidní vstupy a destruktivní potvrzovací akce.',
  },
] as const;

/**
 * 1:1 mapping: Legacy DB Key -> Semantic Token
 */
export const LEGACY_KEY_TO_SEMANTIC_TOKEN: Readonly<Record<string, string>> = Object.freeze(
  SEMANTIC_TOKEN_DEFINITIONS.reduce((acc, def) => {
    acc[def.legacyKey] = def.token;
    return acc;
  }, {} as Record<string, string>)
);

/**
 * 1:1 mapping: Semantic Token -> Legacy DB Key
 */
export const SEMANTIC_TOKEN_TO_LEGACY_KEY: Readonly<Record<string, string>> = Object.freeze(
  SEMANTIC_TOKEN_DEFINITIONS.reduce((acc, def) => {
    acc[def.token] = def.legacyKey;
    return acc;
  }, {} as Record<string, string>)
);

/**
 * Resolves a dictionary of variables (either legacy key/value map or array)
 * into a complete set of CSS custom properties containing BOTH legacy and semantic aliases.
 */
export function resolveSemanticCssVars(
  variables: Record<string, string> | Array<{ key: string; value: string }>
): Record<string, string> {
  const cssVars: Record<string, string> = {};

  if (Array.isArray(variables)) {
    for (const item of variables) {
      if (!item || !item.key || !item.value) continue;
      cssVars[`--color-${item.key}`] = item.value;
      const semanticToken = LEGACY_KEY_TO_SEMANTIC_TOKEN[item.key];
      if (semanticToken) {
        cssVars[`--color-${semanticToken}`] = item.value;
      }
    }
  } else if (variables && typeof variables === 'object') {
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value !== 'string') continue;
      cssVars[`--color-${key}`] = value;
      const semanticToken = LEGACY_KEY_TO_SEMANTIC_TOKEN[key];
      if (semanticToken) {
        cssVars[`--color-${semanticToken}`] = value;
      }
    }
  }

  return cssVars;
}
