import React, { useState } from 'react';
import { ClientCase, CaseEvidence, CaseDocument } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';
import {
  Search,
  Plus,
  Trash2,
  FileText,
  Mail,
  Image,
  Film,
  Mic,
  MessageSquare,
  ShieldCheck,
  Tag,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

interface CaseEvidenceTabProps {
  activeCase: ClientCase;
  onAddEvidence: (data: Partial<CaseEvidence>) => Promise<void>;
  onDeleteEvidence: (evidenceId: string) => Promise<void>;
}

export const CaseEvidenceTab: React.FC<CaseEvidenceTabProps> = ({
  activeCase,
  onAddEvidence,
  onDeleteEvidence,
}) => {
  const evidenceList = activeCase.evidence || [];
  const documents = activeCase.documents || [];

  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<string>('DOCUMENT');
  const [documentId, setDocumentId] = useState<string>('');
  const [relevance, setRelevance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().slice(0, 10));
    setType('DOCUMENT');
    setDocumentId('');
    setRelevance('');
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddEvidence({
        title,
        description,
        date: new Date(date).toISOString(),
        type: type as any,
        documentId: documentId || undefined,
        relevance,
      });
      resetForm();
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEvidenceIcon = (eviType: string) => {
    switch (eviType) {
      case 'EMAIL':
        return <Mail className="w-5 h-5 text-blue-600" />;
      case 'SMS_CHAT':
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
      case 'PHOTO':
        return <Image className="w-5 h-5 text-indigo-600" />;
      case 'AUDIO':
        return <Mic className="w-5 h-5 text-amber-600" />;
      case 'VIDEO':
        return <Film className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-purple-600" />;
    }
  };

  const getEvidenceTypeLabel = (eviType: string) => {
    switch (eviType) {
      case 'EMAIL':
        return '📧 E-mailová komunikace';
      case 'SMS_CHAT':
        return '💬 SMS / WhatsApp konverzace';
      case 'PHOTO':
        return '📷 Fotodokumentace';
      case 'AUDIO':
        return '🎙️ Zvukový záznam';
      case 'VIDEO':
        return '🎥 Videozáznam';
      default:
        return '📄 Listinný důkaz / Zpráva';
    }
  };

  const filteredEvidence = evidenceList.filter((ev) => {
    if (filterType !== 'ALL' && ev.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q) ||
        ev.relevance?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            Katalog důkazních materiálů
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Strukturovaná evidence listinných důkazů, e-mailů, platebních dokladů a fotodokumentace se zdůvodněním procesní relevance pro soud.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Zařadit nový důkaz
          </button>
        )}
      </div>

      {/* Add Evidence Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Zařadit nový důkaz do spisu
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Označení / Název důkazu *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="např. Výpis plateb za kroužky Jakuba 2025/2026, E-mail s nabídkou dohody o prázdninách"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Typ důkazního materiálu
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              >
                <option value="DOCUMENT">📄 Listinný důkaz (posudek, výpis, smlouva)</option>
                <option value="EMAIL">📧 E-mailová korespondence</option>
                <option value="SMS_CHAT">💬 SMS / WhatsApp komunikace</option>
                <option value="PHOTO">📷 Fotodokumentace (pokoj, aktivity, zázemí)</option>
                <option value="AUDIO">🎙️ Zvukový záznam</option>
                <option value="VIDEO">🎥 Videozáznam</option>
                <option value="OTHER">📌 Jiný důkaz</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum vzniku / pořízení důkazu
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Propojit s nahraným dokumentem (volitelné)
              </label>
              <select
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              >
                <option value="">-- Nepropojovat s konkrétním souborem --</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <MarkdownEditor
                label="Procesní relevance (Co tímto důkazem prokazujeme soudu / OSPOD) *"
                required
                value={relevance}
                onChange={setRelevance}
                rows={3}
                placeholder="např. Prokazuje aktivní zapojení otce do výchovy, úhradu kroužků a vstřícný postoj k dohodě v souladu se zájmem nezletilého..."
              />
            </div>

            <div className="sm:col-span-2">
              <MarkdownEditor
                label="Popis a kontext důkazu"
                value={description}
                onChange={setDescription}
                rows={3}
                placeholder="Doplňující podrobnosti, okolnosti získání důkazu..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Ukládám...' : 'Zařadit do katalogu důkazů'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat v důkazech a procesní relevanci..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Všechny důkazy' },
            { key: 'DOCUMENT', label: '📄 Listiny' },
            { key: 'EMAIL', label: '📧 E-maily' },
            { key: 'PHOTO', label: '📷 Foto' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === f.key
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence List */}
      {filteredEvidence.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Search className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Žádné zařazené důkazy</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Zařaďte důležité materiály a popište jejich relevanci pro obhajobu práv dítěte a otce.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
          >
            Zařadit první důkaz
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvidence.map((evi) => (
            <div
              key={evi.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  {getEvidenceIcon(evi.type)}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{evi.title}</h3>
                    <span className="text-xs font-bold text-blue-800 px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded-full">
                      {getEvidenceTypeLabel(evi.type)}
                    </span>
                    {evi.date && (
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(evi.date).toLocaleDateString('cs-CZ')}
                      </span>
                    )}
                  </div>

                  {evi.relevance && (
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                      <strong className="block font-bold mb-0.5 flex items-center gap-1 text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Procesní relevance pro soud / OSPOD:
                      </strong>
                      <p className="leading-relaxed">{evi.relevance}</p>
                    </div>
                  )}

                  {evi.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{evi.description}</p>
                  )}

                  {evi.document && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Připojený dokument: {evi.document.name}</span>
                      <a
                        href={evi.document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Otevřít <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                <button
                  onClick={() => {
                    if (confirm(`Opravdu chcete vyřadit důkaz "${evi.title}"?`)) onDeleteEvidence(evi.id);
                  }}
                  className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Vyřadit důkaz"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
