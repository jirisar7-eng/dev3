import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { User, UserPreference } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Monitor, Moon, Sun, Type, Droplet, LayoutGrid, Square, Check } from 'lucide-react';

interface UserAppearanceTabProps {
  user: User;
}

const COLOR_PRESETS = [
  { id: 'default', name: 'Výchozí (Táta má právo)', primary: '#1e3a8a', bg: '#f8fafc' },
  { id: 'blue', name: 'Modrá', primary: '#2563eb', bg: '#eff6ff' },
  { id: 'green', name: 'Zelená', primary: '#16a34a', bg: '#f0fdf4' },
  { id: 'purple', name: 'Fialová', primary: '#9333ea', bg: '#faf5ff' },
  { id: 'neutral', name: 'Neutrální', primary: '#475569', bg: '#f8fafc' },
  { id: 'high-contrast', name: 'Vysoký kontrast', primary: '#000000', bg: '#ffffff' },
];

const FONTS = [
  { id: 'default', name: 'Systémové výchozí', style: 'font-sans' },
  { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', style: 'font-sans' },
  { id: 'Playfair Display', name: 'Playfair Display', style: 'font-serif' },
];

export const UserAppearanceTab: React.FC<UserAppearanceTabProps> = ({ user }) => {
    const [preferences, setPreferences] = useState<Partial<UserPreference>>({
    themeMode: 'system',
    colorPreset: 'default',
    fontFamily: 'default',
    fontSize: 100,
    density: 'standard',
    borderRadius: 'standard',
    highContrast: false,
    ...user.preferences,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch('/api/users/me/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        setMessage('Nastavení vzhledu bylo uloženo.');
        
        // Refresh preferences globally if needed
        window.dispatchEvent(new CustomEvent('user-preferences-updated', { detail: preferences }));
      } else {
        const data = await res.json();
        setMessage(data.error || 'Chyba při ukládání.');
      }
    } catch (e: any) {
      setMessage(e.message || 'Chyba při komunikaci.');
    } finally {
      setLoading(false);
    }
  };

  const updatePref = (key: keyof UserPreference, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-blue-600" />
          Osobní vzhled portálu
        </h3>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Režim */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Barevný režim</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Světlý', icon: Sun },
                { id: 'dark', label: 'Tmavý', icon: Moon },
                { id: 'system', label: 'Systémový', icon: Monitor },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => updatePref('themeMode', mode.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    preferences.themeMode === mode.id
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-slate-200 hover:border-blue-300 text-slate-600'
                  }`}
                >
                  <mode.icon className="w-6 h-6 mb-2" />
                  <span className="font-semibold text-sm">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Preset */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Barevné téma</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => updatePref('colorPreset', preset.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    preferences.colorPreset === preset.id
                      ? 'border-blue-600 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full mb-2 shadow-sm border border-slate-200" style={{ backgroundColor: preset.primary }} />
                  <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Písmo</label>
              <div className="space-y-2">
                {FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => updatePref('fontFamily', font.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      preferences.fontFamily === font.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-sm ${font.style}`}>{font.name}</span>
                    {preferences.fontFamily === font.id && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Velikost textu</label>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-sm font-medium text-slate-500">A-</span>
                <input
                  type="range"
                  min="90"
                  max="130"
                  step="10"
                  value={preferences.fontSize}
                  onChange={(e) => updatePref('fontSize', parseInt(e.target.value))}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-lg font-medium text-slate-800">A+</span>
              </div>
              <div className="text-center mt-2 text-sm font-semibold text-blue-700">
                {preferences.fontSize} %
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Uložit nastavení'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Live Preview */}
      <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm" style={{ 
        fontFamily: preferences.fontFamily !== 'default' ? preferences.fontFamily : 'inherit',
        fontSize: `${preferences.fontSize}%`
      }}>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Živý náhled</h4>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Příliš žluťoučký kůň úpěl ďábelské ódy</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Toto je ukázkový text pro ověření české diakritiky a zvoleného vzhledu. 
            Všechny znaky (á, č, ď, é, ě, í, ň, ó, ř, š, ť, ú, ů, ý, ž) by měly být vykresleny plynule ve stejném písmu.
          </p>
          <button 
            className="px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm"
            style={{ 
              backgroundColor: COLOR_PRESETS.find(p => p.id === preferences.colorPreset)?.primary || '#1e3a8a' 
            }}
          >
            Ukázkové tlačítko
          </button>
        </div>
      </div>
    </div>
  );
};
