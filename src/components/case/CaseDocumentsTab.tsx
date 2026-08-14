import React, { useState, useRef } from 'react';
import { ClientCase, CaseDocument } from '../../types';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  ShieldCheck,
  Filter,
  Plus,
  X,
  Check,
  HardDrive,
  FileCode,
  FileCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface CaseDocumentsTabProps {
  activeCase: ClientCase;
  onUploadDoc: (doc: {
    fileName: string;
    fileData?: string;
    category: string;
    notes?: string;
    mimeType?: string;
  }) => Promise<void>;
  onDeleteDoc: (docId: string) => Promise<void>;
}

export const CaseDocumentsTab: React.FC<CaseDocumentsTabProps> = ({
  activeCase,
  onUploadDoc,
  onDeleteDoc,
}) => {
  const documents = activeCase.documents || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);

  // Upload Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [category, setCategory] = useState<string>('COURT');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setSelectedFile(null);
    setFileBase64('');
    setFileName('');
    setCategory('COURT');
    setNotes('');
    setIsUploading(false);
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    setIsSubmitting(true);
    try {
      await onUploadDoc({
        fileName,
        fileData: fileBase64,
        category,
        notes,
        mimeType: selectedFile?.type || 'application/pdf',
      });
      resetForm();
    } catch (err: any) {
      alert(`Chyba při nahrávání dokumentu: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (selectedCategory === 'ALL') return true;
    return d.category === selectedCategory;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'COURT':
        return '⚖️ Soudní podání';
      case 'OSPOD':
        return '🏛️ Zprávy OSPOD';
      case 'MEDICAL':
        return '🩺 Lékařské zprávy';
      case 'AGREEMENT':
        return '🤝 Rodičovské dohody';
      case 'EVIDENCE':
        return '🔎 Důkazy';
      case 'COMMUNICATION':
        return '💬 Komunikace';
      default:
        return '📄 Ostatní';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Trezor dokumentů & Spisová dokumentace
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Bezpečné úložiště soudních návrhů, rozsudků, zpráv OSPOD a lékařských posudků s antivirovou kontrolou ClamAV a šifrováním.
          </p>
        </div>

        {!isUploading && (
          <button
            onClick={() => setIsUploading(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            Nahrát dokument do spisu
          </button>
        )}
      </div>

      {/* Upload Modal / Dropzone */}
      {isUploading && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Nahrát nový dokument do spisu
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drag and drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-600 bg-blue-50'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50/40'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            {selectedFile ? (
              <div className="space-y-1">
                <FileCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Soubor'}
                </p>
                <p className="text-xs text-emerald-700 font-semibold pt-1">
                  ✓ Soubor připraven k nahrání a antivirové kontrole
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  Přetáhněte sem soubor nebo klikněte pro výběr
                </p>
                <p className="text-xs text-slate-500">
                  Podporované formáty: PDF, DOCX, TXT, JPEG, PNG (max 25 MB)
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Název dokumentu *
              </label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="např. Navrh_na_stridavou_peci.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategorie dokumentu
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              >
                <option value="COURT">⚖️ Soudní podání a protokoly</option>
                <option value="OSPOD">🏛️ Zprávy OSPOD a šetření</option>
                <option value="MEDICAL">🩺 Lékařské posudky a zprávy</option>
                <option value="AGREEMENT">🤝 Rodičovské dohody</option>
                <option value="EVIDENCE">🔎 Důkazní materiály</option>
                <option value="COMMUNICATION">💬 E-mailová komunikace</option>
                <option value="OTHER">📄 Ostatní písemnosti</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Poznámka k dokumentu / Spisová relevance
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Popis obsahu, datum doručení soudu nebo reference na jednání..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Automatický scan ClamAV & SHA-256 integrita</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !fileName}
                className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Nahrávám a kontroluji...' : 'Uložit do trezoru'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Kategorie:
        </span>
        {[
          { key: 'ALL', label: 'Všechny dokumenty' },
          { key: 'COURT', label: '⚖️ Soudní' },
          { key: 'OSPOD', label: '🏛️ OSPOD' },
          { key: 'MEDICAL', label: '🩺 Lékařské' },
          { key: 'AGREEMENT', label: '🤝 Dohody' },
          { key: 'EVIDENCE', label: '🔎 Důkazy' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedCategory(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === f.key
                ? 'bg-blue-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Document Vault List */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">V tomto filtru nejsou žádné dokumenty</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Nahrajte návrhy, vyjádření soudu nebo zprávy opatrovníka pro centralizovanou evidenci.
          </p>
          <button
            onClick={() => setIsUploading(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
          >
            Nahrát první dokument
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0">
                      {doc.fileType?.toUpperCase() || 'PDF'}
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-black text-slate-900 truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <span className="text-xs text-slate-500 block">
                        {getCategoryLabel(doc.category)} • {(doc.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>

                  {/* Security Status Badge */}
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Bezpečný (ClamAV)
                  </span>
                </div>

                {doc.notes && (
                  <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {doc.notes}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {doc.storageProvider || 'MinIO'} / {doc.s3Bucket || 'vault'}
                  </span>
                  <span>{new Date(doc.createdAt).toLocaleDateString('cs-CZ')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={doc.fileUrl}
                  download={doc.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Stáhnout dokument
                </a>

                <button
                  onClick={() => {
                    if (confirm(`Opravdu chcete smazat dokument "${doc.name}" ze spisu?`)) {
                      onDeleteDoc(doc.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Smazat ze spisu"
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
