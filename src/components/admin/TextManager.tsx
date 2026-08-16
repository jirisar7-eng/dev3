import React, { useState } from 'react';
import { useText } from '../../context/TextContext';
import { Type, Search, Plus, Save, RefreshCw, Trash2, Power, Globe, Check, AlertCircle } from 'lucide-react';

export const TextManager: React.FC = () => {
  const { texts, updateTextKey, addTextKey, toggleTextActive, deleteTextKey, reloadTexts } = useText();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Edit State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editCzech, setEditCzech] = useState<string>('');
  const [editEnglish, setEditEnglish] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // Add Key State
  const [newKey, setNewKey] = useState('');
  const [newCategory, setNewCategory] = useState('home');
  const [newValueCzech, setNewValueCzech] = useState('');
  const [newValueEnglish, setNewValueEnglish] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories = ['ALL', ...Array.from(new Set(texts.map((t) => t.category)))];

  const filteredTexts = texts.filter((t) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      t.key.toLowerCase().includes(searchLower) ||
      t.valueCzech.toLowerCase().includes(searchLower) ||
      (t.valueEnglish && t.valueEnglish.toLowerCase().includes(searchLower)) ||
      (t.description && t.description.toLowerCase().includes(searchLower));

    const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && t.active !== false) ||
      (statusFilter === 'INACTIVE' && t.active === false);

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleStartEdit = (item: any) => {
    setEditingKey(item.key);
    setEditCzech(item.valueCzech);
    setEditEnglish(item.valueEnglish || '');
    setEditCategory(item.category);
    setEditDescription(item.description || '');
  };

  const handleSaveEdit = async (key: string) => {
    try {
      setErrorMsg(null);
      await updateTextKey(key, {
        valueCzech: editCzech,
        valueEnglish: editEnglish,
        category: editCategory,
        description: editDescription,
      });
      setEditingKey(null);
      setSuccessMsg(`Textový klíč '${key}' byl úspěšně uložen.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Chyba při ukládání textu.');
    }
  };

  const handleToggleActive = async (key: string, currentActive: boolean) => {
    try {
      await toggleTextActive(key, !currentActive);
      setSuccessMsg(`Stav klíče '${key}' změněn.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg('Chyba při změně stavu klíče.');
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm(`Opravdu chcete odstranit textový klíč '${key}'?`)) return;
    try {
      await deleteTextKey(key);
      setSuccessMsg(`Textový klíč '${key}' byl odstraněn.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg('Chyba při mazání textového klíče.');
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValueCzech) return;
    try {
      setErrorMsg(null);
      await addTextKey(newKey, newCategory, newValueCzech, newValueEnglish, newDesc);
      setNewKey('');
      setNewValueCzech('');
      setNewValueEnglish('');
      setNewDesc('');
      setShowAddModal(false);
      setSuccessMsg(`Nový textový klíč '${newKey}' byl vytvořen.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Chyba při vytváření klíče.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Type className="w-6 h-6 text-blue-600" />
            Text Manager (Systémové & UI Texty)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data-driven správa všech systémových klíčů. Žádné natvrdo zadané řetězce v kódové bázi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => reloadTexts()}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 bg-white shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Obnovit z DB
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-950 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Přidat nový klíč
          </button>
        </div>
      </div>

      {/* Toast Messages */}
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat klíč, text nebo popis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Vše ({texts.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Aktivní ({texts.filter((t) => t.active !== false).length})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                statusFilter === 'INACTIVE' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Deaktivované ({texts.filter((t) => t.active === false).length})
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Texts List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5 w-1/4">Klíč (Key) & Popis</th>
              <th className="p-3.5 w-24">Kategorie</th>
              <th className="p-3.5">Hodnota v Češtině</th>
              <th className="p-3.5">English Value</th>
              <th className="p-3.5 w-20 text-center">Stav</th>
              <th className="p-3.5 text-right w-32">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTexts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Žádné textové klíče neodpovídají zadaným kritériím.
                </td>
              </tr>
            ) : (
              filteredTexts.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${item.active === false ? 'bg-slate-50/50 opacity-75' : ''}`}>
                  <td className="p-3.5 font-mono text-blue-900 font-bold">
                    <div className="flex items-center gap-1">
                      <span>{item.key}</span>
                    </div>
                    {item.description && (
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5 font-sans">
                        {item.description}
                      </span>
                    )}
                    {item.updatedAt && (
                      <span className="block text-[9px] text-slate-400 mt-1 font-sans font-normal">
                        Změněno: {new Date(item.updatedAt).toLocaleDateString('cs-CZ')} {new Date(item.updatedAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                        {item.updatedBy ? ` (${item.updatedBy})` : ''}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    {editingKey === item.key ? (
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full p-1 border border-blue-500 rounded text-xs"
                      />
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.category}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    {editingKey === item.key ? (
                      <textarea
                        value={editCzech}
                        onChange={(e) => setEditCzech(e.target.value)}
                        rows={2}
                        className="w-full p-1.5 border border-blue-500 rounded-lg text-xs"
                      />
                    ) : (
                      <span className="text-slate-800 leading-relaxed">{item.valueCzech}</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    {editingKey === item.key ? (
                      <textarea
                        value={editEnglish}
                        onChange={(e) => setEditEnglish(e.target.value)}
                        rows={2}
                        className="w-full p-1.5 border border-blue-500 rounded-lg text-xs"
                      />
                    ) : (
                      <span className="text-slate-600 leading-relaxed text-[11px] italic">
                        {item.valueEnglish || <span className="text-slate-300">— neprovázáno —</span>}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.active !== false ? 'Aktivní' : 'Vypnuto'}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {editingKey === item.key ? (
                        <button
                          onClick={() => handleSaveEdit(item.key)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Uložit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-slate-200"
                          >
                            Upravit
                          </button>
                          <button
                            onClick={() => handleToggleActive(item.key, item.active !== false)}
                            title={item.active !== false ? 'Deaktivovat klíč' : 'Aktivovat klíč'}
                            className={`p-1 rounded-lg hover:bg-slate-100 ${
                              item.active !== false ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.key)}
                            title="Smazat klíč"
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add New Key */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddKey} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Přidat nový databázový textový klíč
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Klíč (Key, např. home.hero.title):</label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="home.hero.title"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategorie:</label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="home / nav / login"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Popis účelu klíče:</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Hlavní nadpis v banneru"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Text v češtině (Czech Value):</label>
                <textarea
                  required
                  value={newValueCzech}
                  onChange={(e) => setNewValueCzech(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Text v angličtině (Optional English Value):
                </label>
                <textarea
                  value={newValueEnglish}
                  onChange={(e) => setNewValueEnglish(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-950 shadow-xs"
              >
                Vytvořit klíč
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
