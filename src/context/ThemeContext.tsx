import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemeSetting, ThemeVariable } from '../types';

interface ThemeContextType {
  themes: Theme[];
  activeTheme: Theme | null;
  themeSettings: ThemeSetting[];
  updateColor: (key: string, value: string) => Promise<void>;
  updateThemeVars: (themeId: string, variables: Record<string, string>) => Promise<void>;
  activateTheme: (themeIdOrKey: string) => Promise<void>;
  createNewTheme: (data: { key: string; name: string; description?: string; context?: string; variables?: Record<string, string> }) => Promise<void>;
  deleteThemeById: (themeId: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reloadThemes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveThemeState] = useState<Theme | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSetting[]>([]);

  const applyCssVariables = (vars: ThemeVariable[] | ThemeSetting[]) => {
    const root = document.documentElement;
    vars.forEach((v) => {
      root.style.setProperty(`--color-${v.key}`, v.value);
    });
  };

  const reloadThemes = async () => {
    try {
      const res = await fetch('/api/themes');
      if (res.ok) {
        const data: Theme[] = await res.json();
        setThemes(data);

        // Find active theme or default
        const active = data.find((t) => t.active) || data.find((t) => t.isDefault) || data[0];
        if (active) {
          setActiveThemeState(active);
          if (active.variables) {
            applyCssVariables(active.variables);
            setThemeSettings(
              active.variables.map((v) => ({
                id: v.id,
                key: v.key,
                value: v.value,
                label: v.label,
                category: v.category,
                updatedAt: v.updatedAt || new Date().toISOString(),
              }))
            );
          }
        }
      }
    } catch (e) {
      console.error('Error fetching themes:', e);
    }
  };

  useEffect(() => {
    reloadThemes();
  }, []);

  const updateColor = async (key: string, value: string) => {
    if (!activeTheme) return;
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/themes/${activeTheme.id}/variables`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        document.documentElement.style.setProperty(`--color-${key}`, value);
        await reloadThemes();
      }
    } catch (e) {
      console.error('Error updating theme color:', e);
    }
  };

  const updateThemeVars = async (themeId: string, variables: Record<string, string>) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/themes/${themeId}/variables`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(variables),
      });
      if (res.ok) {
        await reloadThemes();
      }
    } catch (e) {
      console.error('Error updating theme variables:', e);
    }
  };

  const activateTheme = async (themeIdOrKey: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/themes/${themeIdOrKey}/activate`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await reloadThemes();
      }
    } catch (e) {
      console.error('Error activating theme:', e);
    }
  };

  const createNewTheme = async (data: { key: string; name: string; description?: string; context?: string; variables?: Record<string, string> }) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await reloadThemes();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Chyba při vytváření tématu');
      }
    } catch (e) {
      console.error('Error creating theme:', e);
      throw e;
    }
  };

  const deleteThemeById = async (themeId: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/themes/${themeId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await reloadThemes();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Chyba při mazání tématu');
      }
    } catch (e) {
      console.error('Error deleting theme:', e);
      throw e;
    }
  };

  const resetToDefaults = async () => {
    const defaultColors: Record<string, string> = {
      primary: '#1e3a8a',
      secondary: '#0284c7',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textMuted: '#64748b',
      heading: '#0f172a',
      link: '#2563eb',
      border: '#e2e8f0',
      button: '#1e3a8a',
      buttonHover: '#0f172a',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
    };

    if (activeTheme) {
      await updateThemeVars(activeTheme.id, defaultColors);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themes,
        activeTheme,
        themeSettings,
        updateColor,
        updateThemeVars,
        activateTheme,
        createNewTheme,
        deleteThemeById,
        resetToDefaults,
        reloadThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
