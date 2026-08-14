import React, { useState } from 'react';
import { ClientCase } from '../../types';
import {
  ShieldCheck,
  Lock,
  Download,
  Server,
  HardDrive,
  Database,
  FileCheck,
  KeyRound,
  FileCode,
} from 'lucide-react';

interface CaseSecurityTabProps {
  activeCase: ClientCase;
}

export const CaseSecurityTab: React.FC<CaseSecurityTabProps> = ({ activeCase }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = () => {
    setIsExporting(true);
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(activeCase, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `Muj_Pripad_${activeCase.caseNumber || 'spis'}_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(`Chyba exportu: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Zabezpečení spisu, Šifrování & Export dat
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Architektura ochrany osobních údajů, auditní záznamy, antivirová kontrola ClamAV a kompletní export.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          disabled={isExporting}
          className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exportuji...' : 'Kompletní export spisu (JSON)'}
        </button>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Izolace dat na úrovni uživatele (RBAC)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Každý spis je striktně svázán s identitou přihlášeného otce (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">ownerId</code>). Veškeré serverové endpointy autorizují přístup a zabraňují neoprávněnému čtení.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Antivirová ochrana ClamAV</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Každý nahrávaný dokument (PDF, DOCX, TXT) prochází před uložením do trezoru antivirovým scanem přes démon ClamAV s ověřením digitálního otisku (SHA-256).
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Objektové úložiště MinIO / S3</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Přílohy a důkazy jsou ukládány v zabezpečeném bucketu s řízeným přístupem přes podepsané odkazy s časově omezenou platností.
          </p>
        </div>
      </div>

      {/* Case Metadata & Audit summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCode className="w-5 h-5 text-blue-600" />
          Technické systémové parametry spisu
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">ID případu (UUID)</span>
            <span className="text-slate-800 font-bold break-all">{activeCase.id}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Vlastník spisu</span>
            <span className="text-slate-800 font-bold break-all">{activeCase.ownerId}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Vytvořeno</span>
            <span className="text-slate-800 font-bold">{new Date(activeCase.createdAt).toLocaleString('cs-CZ')}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold">Poslední aktualizace</span>
            <span className="text-slate-800 font-bold">{new Date(activeCase.updatedAt).toLocaleString('cs-CZ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
