import { apiFetch } from '../utils/apiClient';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Module } from '../types';

interface ModuleContextType {
  modules: Module[];
  isModuleEnabled: (key: string) => boolean;
  getModuleConfig: <T = Record<string, any>>(key: string) => T | null;
  enableModule: (key: string) => Promise<void>;
  disableModule: (key: string) => Promise<void>;
  toggleModule: (key: string, enabled: boolean) => Promise<void>;
  updateModuleConfig: (key: string, configJson: string) => Promise<void>;
  reloadModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);

  const reloadModules = async () => {
    try {
      const res = await apiFetch('/api/modules');
      if (res.ok) {
        const data: Module[] = await res.json();
        setModules(data);
      }
    } catch (e) {
      console.error('Error fetching modules:', e);
    }
  };

  useEffect(() => {
    reloadModules();
  }, []);

  const isModuleEnabled = (key: string): boolean => {
    const mod = modules.find((m) => m.key === key);
    return mod ? mod.enabled : false;
  };

  const getModuleConfig = <T = Record<string, any>>(key: string): T | null => {
    const mod = modules.find((m) => m.key === key);
    if (!mod || !mod.config) return null;
    try {
      return JSON.parse(mod.config) as T;
    } catch {
      return null;
    }
  };

  const enableModule = async (key: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/modules/${key}/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.key === key ? { ...m, enabled: true } : m))
        );
      }
    } catch (e) {
      console.error('Error enabling module:', e);
    }
  };

  const disableModule = async (key: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/modules/${key}/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.key === key ? { ...m, enabled: false } : m))
        );
      }
    } catch (e) {
      console.error('Error disabling module:', e);
    }
  };

  const toggleModule = async (key: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/modules/${key}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.key === key ? { ...m, enabled } : m))
        );
      }
    } catch (e) {
      console.error('Error toggling module:', e);
    }
  };

  const updateModuleConfig = async (key: string, configJson: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch(`/api/modules/${key}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ config: configJson }),
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.key === key ? { ...m, config: configJson } : m))
        );
      }
    } catch (e) {
      console.error('Error updating module config:', e);
    }
  };

  return (
    <ModuleContext.Provider
      value={{
        modules,
        isModuleEnabled,
        getModuleConfig,
        enableModule,
        disableModule,
        toggleModule,
        updateModuleConfig,
        reloadModules,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = () => {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error('useModules must be used within ModuleProvider');
  return ctx;
};
