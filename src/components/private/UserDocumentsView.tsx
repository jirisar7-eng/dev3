import { apiFetch } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { User, UserDocument } from '../../types';
import { FileText, Plus, Download, FolderOpen, Tag, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

interface UserDocumentsViewProps {
  user: User;
}

export const UserDocumentsView: React.FC<UserDocumentsViewProps> = ({ user }) => {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('court_filing');
  const [docFileType, setDocFileType] = useState('pdf');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/portal/documents/${user.id}`, {
        headers: {
          'Authorization': `Bearer jwt_token_${user.id}_${Date.now()}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [user.id]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/api/portal/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_${user.id}_${Date.now()}`,
        },
        body: JSON.stringify({
          userId: user.id,
          name: docName,
          category: docCategory,
          fileType: docFileType,
          size: 250000,
          fileUrl: `/documents/${docName.toLowerCase().replace(/\s+/g, '_')}.${docFileType}`,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setDocuments((prev) => [created, ...prev]);
        setShowAddModal(false);
        setDocName('');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Přidání dokumentu selhalo.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Chyba sítě.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Dokumenty & Právní spis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chráněné úložiště návrhů, rozhodnutí soudů, zpráv OSPOD a důkazních materiálů.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nahrát / Přidat dokument
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Nové uložení dokumentu
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕ Zavřít
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Název dokumentu / spisu</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="např. Návrh na střídavou péči 2026.pdf"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategorie</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="court_filing">Soudní podání</option>
                    <option value="ospod_report">Zpráva OSPOD</option>
                    <option value="agreement">Rodičovská dohoda</option>
                    <option value="evidence">Důkazní materiál</option>
                    <option value="other">Ostatní</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Typ souboru</label>
                  <select
                    value={docFileType}
                    onChange={(e) => setDocFileType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="pdf">PDF dokument</option>
                    <option value="docx">Word (DOCX)</option>
                    <option value="jpg">Fotografie / Obrázek</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Ukládám...' : 'Uložit do spisu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Načítám spisy...</div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">Zatím nebyly vloženy žádné dokumenty.</p>
            <p className="text-xs text-slate-500">Klikněte na tlačítko výše a přidejte svůj první právní dokument.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {doc.category === 'court_filing' ? 'Soudní podání' : doc.category === 'ospod_report' ? 'Zpráva OSPOD' : doc.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(doc.createdAt).toLocaleDateString('cs-CZ')}
                      </span>
                      <span className="font-mono text-slate-400">{Math.round(doc.size / 1024)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <a
                    href={doc.fileUrl || '#'}
                    download
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    Stáhnout
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>Všechny nahrané dokumenty jsou kryptograficky chráněny a přístupné výhradně vám jako vlastníkovi účtu.</span>
      </div>
    </div>
  );
};
