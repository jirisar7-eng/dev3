import React, { useEffect } from 'react';
import { Download, Printer, X } from 'lucide-react';

interface AuditPrintViewProps {
  auditData: any;
  onClose: () => void;
}

export const AuditPrintView: React.FC<AuditPrintViewProps> = ({ auditData, onClose }) => {
  useEffect(() => {
    // Add print styles dynamically if needed, or rely on Tailwind print modifiers
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-export-${auditData.spaceId || 'coparent'}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  if (!auditData) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden print:static print:z-auto print:bg-transparent print:overflow-visible">
      {/* Non-printable header controls */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden shadow-md">
        <div className="font-bold">Generovaný Auditní Záznam (Náhled pro tisk)</div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer">
            <Printer className="w-4 h-4" /> Vytisknout / Uložit do PDF
          </button>
          <button onClick={handleDownloadJson} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer">
            <Download className="w-4 h-4" /> Stáhnout JSON
          </button>
          <button onClick={onClose} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer">
            <X className="w-4 h-4" /> Zavřít
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-slate-100 print:bg-white">
        <div className="max-w-4xl mx-auto bg-white p-12 shadow-lg print:shadow-none print:p-0 print:max-w-full">
          <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Oficiální Auditní Záznam</h1>
              <p className="text-slate-500 mt-2">Spolurodičovský Hub (Vygenerováno systémem)</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">Datum exportu:</p>
              <p className="text-sm text-slate-600">{new Date(auditData.generatedAt || Date.now()).toLocaleString('cs-CZ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Informace o případu</h2>
              <p className="text-lg font-bold text-slate-900">{auditData.spaceName || 'Spolurodičovský prostor'}</p>
              <p className="text-sm text-slate-600">ID Prostoru: {auditData.spaceId}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Vygeneroval uživatel</h2>
              <p className="text-lg font-bold text-slate-900">{auditData.requestedBy}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Přehled logů (Komunikace a Události)</h2>
            {(!auditData.logs || auditData.logs.length === 0) ? (
              <p className="text-slate-500 italic">Žádné logy nebyly nalezeny pro tento prostor.</p>
            ) : (
              <div className="space-y-4">
                {auditData.logs.map((log: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start border-l-2 border-slate-300 pl-4 py-1">
                    <div className="min-w-[140px] text-xs font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString('cs-CZ')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {log.action} <span className="text-slate-400 font-normal">({log.userEmail})</span>
                      </p>
                      {log.details && (
                        <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-300 text-center text-xs text-slate-400">
            <p>Tento dokument byl strojově vygenerován a opatřen kryptografickým auditním otiskem (hash: {auditData.auditHash || 'N/A'}).</p>
            <p>Slouží jako podklad pro OSPOD nebo soudní řízení.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
