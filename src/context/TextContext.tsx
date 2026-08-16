import React, { createContext, useContext, useState, useEffect } from 'react';
import { TextItem } from '../types';

interface TextContextType {
  texts: TextItem[];
  textMap: Record<string, string>;
  locale: 'cs' | 'en';
  setLocale: (lang: 'cs' | 'en') => void;
  t: (key: string, fallback?: string) => string;
  updateTextKey: (key: string, data: { valueCzech?: string; valueEnglish?: string; category?: string; description?: string }) => Promise<void>;
  addTextKey: (key: string, category: string, valueCzech: string, valueEnglish?: string, description?: string) => Promise<void>;
  toggleTextActive: (key: string, active: boolean) => Promise<void>;
  deleteTextKey: (key: string) => Promise<void>;
  reloadTexts: () => Promise<void>;
}

const TextContext = createContext<TextContextType | undefined>(undefined);

export const TextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<'cs' | 'en'>('cs');
  const [textMap, setTextMap] = useState<Record<string, string>>({});
  const [texts, setTexts] = useState<TextItem[]>([]);

  const reloadTexts = async () => {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const data: TextItem[] = await res.json();
        setTexts(data);
        const map: Record<string, string> = {};
        for (const item of data) {
          if (item.active !== false) {
            map[item.key] = locale === 'en' && item.valueEnglish ? item.valueEnglish : item.valueCzech;
          }
        }
        setTextMap(map);
      }
    } catch (e) {
      console.error('Error fetching content strings:', e);
    }
  };

  useEffect(() => {
    reloadTexts();
  }, [locale]);

  const t = (key: string, fallback?: string): string => {
    if (textMap[key] !== undefined && textMap[key] !== '') {
      return textMap[key];
    }
    return fallback || key;
  };

  const updateTextKey = async (key: string, data: { valueCzech?: string; valueEnglish?: string; category?: string; description?: string }) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/content/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await reloadTexts();
      }
    } catch (e) {
      console.error('Error updating text key:', e);
    }
  };

  const addTextKey = async (key: string, category: string, valueCzech: string, valueEnglish?: string, description?: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ key, category, valueCzech, valueEnglish, description }),
      });
      if (res.ok) {
        await reloadTexts();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Chyba při vytváření textového klíče');
      }
    } catch (e) {
      console.error('Error adding text key:', e);
      throw e;
    }
  };

  const toggleTextActive = async (key: string, active: boolean) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/content/${encodeURIComponent(key)}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        await reloadTexts();
      }
    } catch (e) {
      console.error('Error toggling text key:', e);
    }
  };

  const deleteTextKey = async (key: string) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/content/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await reloadTexts();
      }
    } catch (e) {
      console.error('Error deleting text key:', e);
    }
  };

  return (
    <TextContext.Provider
      value={{
        texts,
        textMap,
        locale,
        setLocale,
        t,
        updateTextKey,
        addTextKey,
        toggleTextActive,
        deleteTextKey,
        reloadTexts,
      }}
    >
      {children}
    </TextContext.Provider>
  );
};

export const useText = () => {
  const ctx = useContext(TextContext);
  if (!ctx) throw new Error('useText must be used within TextProvider');
  return ctx;
};
