/**
 * Canonical Theme Profile: Táta Classic
 * Task ID: TMPR-20260910-THEME-004
 * 
 * Versioned single source of truth for the classical theme baseline.
 * Represents the 100% equivalent visual palette of Táta má právo before Phase 3.
 */

export interface CanonicalThemeVariable {
  key: string;
  value: string;
  label: string;
  category: string;
}

export interface CanonicalThemeProfile {
  key: string;
  name: string;
  description: string;
  version: number;
  context: 'GLOBAL' | 'PUBLIC' | 'PRIVATE' | 'ADMIN';
  isDefault: boolean;
  variables: readonly CanonicalThemeVariable[];
}

export const TATA_CLASSIC_PROFILE: CanonicalThemeProfile = {
  key: 'tata-classic',
  name: 'Táta má právo — Classic',
  description: 'Kanonický referenční profil vzhledu portálu Táta má právo (SSOT baseline).',
  version: 1,
  context: 'GLOBAL',
  isDefault: true,
  variables: [
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
  ],
} as const;

/**
 * Returns a key-value record of canonical variable keys and their default HEX values.
 */
export function getTataClassicVariablesMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of TATA_CLASSIC_PROFILE.variables) {
    map[v.key] = v.value;
  }
  return map;
}
