import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Palette, RotateCcw, CheckCircle2, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export const ThemeManager: React.FC = () => {
  const {
    themes,
    activeTheme,
    updateColor,
    updateThemeVars,
    activateTheme,
    createNewTheme,
    deleteThemeById,
    resetToDefaults,
  } = useTheme();

  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newContext, setNewContext] = useState('GLOBAL');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentEditingTheme =
    themes.find((t) => t.id === selectedThemeId) || activeTheme || themes[0];

  const handleActivate = async (themeId: string) => {
    try {
      setErrorMsg(null);
      await activateTheme(themeId);
      setSuccessMsg('Téma bylo úspěšně aktivováno.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg('Chyba při aktivaci tématu.');
    }
  };

  const handleColorChange = async (key: string, value: string) => {
    if (!currentEditingTheme) return;
    try {
      await updateThemeVars(currentEditingTheme.id, { [key]: value });
    } catch (e) {
      console.error('Error updating color:', e);
    }
  };

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newName) return;
    try {
      setErrorMsg(null);
      await createNewTheme({
        key: newKey,
        name: newName,
        description: newDesc,
        context: newContext,
      });
      setShowNewModal(false);
      setNewKey('');
      setNewName('');
      setNewDesc('');
      setSuccessMsg(`Nové téma '${newName}' bylo vytvořeno.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Chyba při vytváření tématu.');
    }
  };

  const handleDeleteTheme = async (themeId: string, name: string) => {
    if (!window.confirm(`Opravdu chcete smazat téma '${name}'?`)) return;
    try {
      setErrorMsg(null);
      await deleteThemeById(themeId);
      setSuccessMsg(`Téma '${name}' bylo smazáno.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Chyba při mazání tématu.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-6 h-6 text-purple-600" />
            Theme & Color Manager (DB CSS Proměnné)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centrální správa barevných profilů. Aplikuje se dynamicky přes CSS proměnné (:root) pro PUBLIC, PRIVATE i ADMIN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => resetToDefaults()}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Resetovat výchozí barevnou paletu
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-semibold hover:bg-purple-950 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Vytvořit nové téma
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Themes List Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Dostupná Témata V Databázi ({themes.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {themes.map((theme) => {
            const isEditing = currentEditingTheme?.id === theme.id;
            const isActive = theme.active;

            return (
              <div
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isEditing
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs">{theme.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                      {theme.context}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {theme.description || 'Bez popisu'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Aktivní
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(theme.id);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-semibold"
                      >
                        Aktivovat
                      </button>
                    )}
                  </div>

                  {!theme.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTheme(theme.id, theme.name);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Smazat téma"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Variables Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Color Palette Editors */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Úprava barevných proměnných pro '{currentEditingTheme?.name}'
              </h3>
              <p className="text-[11px] text-slate-500">
                Klíč tématu: <code className="font-mono text-purple-700">{currentEditingTheme?.key}</code>
              </p>
            </div>
            <span className="text-xs text-purple-600 font-mono font-normal">--color-[key]</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentEditingTheme?.variables?.map((item) => (
              <div
                key={item.id || item.key}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-800 text-xs block">{item.label}</span>
                  <code className="text-[10px] text-purple-700 font-mono">--color-{item.key}</code>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-600">{item.value}</span>
                  <div
                    className="w-7 h-7 rounded-lg border border-slate-300 shadow-2xs relative overflow-hidden cursor-pointer"
                    style={{ backgroundColor: item.value }}
                  >
                    <input
                      type="color"
                      value={item.value}
                      onChange={(e) => handleColorChange(item.key, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live CSS Variable Preview Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-4 pb-3 border-b border-slate-100">
              Živý náhled barev na UI komponentách
            </h3>

            <div
              className="p-6 rounded-2xl space-y-4 border transition-all"
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                borderColor: 'var(--color-border, #e2e8f0)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base" style={{ color: 'var(--color-heading, #0f172a)' }}>
                  Ukázkový Nadpis Karty
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: 'var(--color-success, #16a34a)' }}
                >
                  Status Aktivní
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text, #1e293b)' }}>
                Tento text využívá barvu těla <code className="font-mono text-purple-600">--color-text</code> a podklad <code className="font-mono text-purple-600">--color-surface</code>.
              </p>

              <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'var(--color-background, #f8fafc)', color: 'var(--color-textMuted, #64748b)' }}>
                Blok s barvou pozadí <code className="font-mono">--color-background</code> a tlumeným textem.
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-button, #1e3a8a)' }}
                >
                  Hlavní Tlačítko
                </button>
                <button
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-secondary, #0284c7)' }}
                >
                  Sekundární
                </button>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs font-semibold underline px-2"
                  style={{ color: 'var(--color-link, #2563eb)' }}
                >
                  Odkaz
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Změny barevných proměnných se okamžitě přenáší do všech komponent systému bez přenačtení kódu.</span>
          </div>
        </div>
      </div>

      {/* Modal Add New Theme */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTheme} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Vytvořit nové barevné téma
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Klíč tématu (Key, např. dark, high_contrast):</label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="dark_mode"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Název tématu:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tmavý Režim"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kontext aplikace:</label>
                <select
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600"
                >
                  <option value="GLOBAL">GLOBAL (Celá aplikace)</option>
                  <option value="PUBLIC">PUBLIC (Veřejná část)</option>
                  <option value="PRIVATE">PRIVATE (Klientská zóna)</option>
                  <option value="ADMIN">ADMIN (Administrace)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Popis:</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Určeno pro noční hodiny"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-semibold hover:bg-purple-950 shadow-xs"
              >
                Vytvořit téma
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
