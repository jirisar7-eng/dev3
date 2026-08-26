import { apiFetch } from '../utils/apiClient';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Theme, ThemeSetting, ThemeVariable } from '../types';

interface ThemeContextType {
  branding: any;
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
  const [branding, setBranding] = useState<any>(null);


  const { currentUser } = useAuth();
  
  
  const fetchBranding = async () => {
    try {
      const res = await apiFetch('/api/public/branding');
      if (res.ok) {
        const data = await res.json();
        setBranding(data);
      }
    } catch (e) {
      console.warn('Failed to fetch branding', e);
    }
  };

  const applyPreferences = (prefs: any) => {
    const root = document.documentElement;
    // Theme mode
    if (prefs.themeMode === 'dark' || (prefs.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Color Presets
    if (prefs.colorPreset) {
       root.setAttribute('data-color-preset', prefs.colorPreset);
       if (prefs.colorPreset === 'blue') {
          root.style.setProperty('--color-primary', '#2563eb');
          root.style.setProperty('--color-background', '#eff6ff');
       } else if (prefs.colorPreset === 'green') {
          root.style.setProperty('--color-primary', '#16a34a');
          root.style.setProperty('--color-background', '#f0fdf4');
       } else if (prefs.colorPreset === 'purple') {
          root.style.setProperty('--color-primary', '#9333ea');
          root.style.setProperty('--color-background', '#faf5ff');
       } else if (prefs.colorPreset === 'neutral') {
          root.style.setProperty('--color-primary', '#475569');
          root.style.setProperty('--color-background', '#f8fafc');
       } else if (prefs.colorPreset === 'high-contrast') {
          root.style.setProperty('--color-primary', '#000000');
          root.style.setProperty('--color-background', '#ffffff');
          root.classList.add('high-contrast');
       } else {
          // default, let it use global vars
          root.removeAttribute('data-color-preset');
          root.classList.remove('high-contrast');
       }
    }
    
    // Typography
    if (prefs.fontFamily && prefs.fontFamily !== 'default') {
      root.style.setProperty('font-family', prefs.fontFamily);
    } else {
      root.style.removeProperty('font-family');
    }
    
    // Font Size
    if (prefs.fontSize) {
      root.style.setProperty('font-size', `${prefs.fontSize}%`);
    } else {
      root.style.removeProperty('font-size');
    }
    
    // Density (e.g. padding adjustments) - can use custom vars
    if (prefs.density) {
      root.setAttribute('data-density', prefs.density);
    } else {
      root.removeAttribute('data-density');
    }
    
    // Border Radius
    if (prefs.borderRadius) {
      root.setAttribute('data-radius', prefs.borderRadius);
    } else {
      root.removeAttribute('data-radius');
    }
  };

  useEffect(() => {
    if (currentUser?.preferences) {
      applyPreferences(currentUser.preferences);
    } else {
      // Clear preferences if logged out
      const root = document.documentElement;
      root.classList.remove('dark', 'high-contrast');
      root.removeAttribute('data-color-preset');
      root.style.removeProperty('font-family');
      root.style.removeProperty('font-size');
      root.removeAttribute('data-density');
      root.removeAttribute('data-radius');
      // Re-apply global theme
      if (activeTheme?.variables) {
         applyCssVariables(activeTheme.variables);
      }
    }
  }, [currentUser?.preferences, activeTheme]);

  useEffect(() => {
    const handlePrefChange = (e: any) => {
      applyPreferences(e.detail);
    };
    window.addEventListener('user-preferences-updated', handlePrefChange);
    return () => window.removeEventListener('user-preferences-updated', handlePrefChange);
  }, []);

  const applyCssVariables = (vars: ThemeVariable[] | ThemeSetting[]) => {
    const root = document.documentElement;
    vars.forEach((v) => {
      
      // Only apply if user has not overridden color (handled in applyPreferences)
      if (!currentUser?.preferences || currentUser.preferences.colorPreset === 'default') {
        root.style.setProperty(`--color-${v.key}`, v.value);
      }
    
    });
  };

  const reloadThemes = async () => {
    try {
      const res = await apiFetch('/api/themes');
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
    fetchBranding();
  }, []);

  const updateColor = async (key: string, value: string) => {
    if (!activeTheme) return;
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/themes/${activeTheme.id}/variables`, {
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
      const res = await apiFetch(`/api/themes/${themeId}/variables`, {
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
      const res = await apiFetch(`/api/themes/${themeIdOrKey}/activate`, {
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
      const res = await apiFetch('/api/themes', {
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
      const res = await apiFetch(`/api/themes/${themeId}`, {
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
        branding,
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
