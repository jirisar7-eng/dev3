import { apiFetch } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { Setting } from '../../types';
import { Settings, Save } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);

  const fetchSettings = () => {
    apiFetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    await apiFetch(`/api/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    fetchSettings();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          Systémové Nastavení (Core Settings)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Globální parametry portálu Táta má právo. Ukládá se do databáze.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-2xl">
        {settings.map((s) => (
          <div key={s.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs gap-4">
            <div>
              <span className="font-mono font-bold text-slate-900 block">{s.key}</span>
              <span className="text-[10px] text-slate-400">Kategorie: {s.category}</span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                type="text"
                defaultValue={s.value}
                onBlur={(e) => handleUpdate(s.key, e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
