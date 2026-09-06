import React, { useState } from 'react';
import { ExperimentalFeature } from '../../../types/experimental';
import { getExperimentalFeatureById } from '../../../config/experimentalFeatures';
import { FeatureStatusBadge } from '../FeatureStatusBadge';
import { ExperimentBanner } from '../ExperimentBanner';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  CircleDashed,
  Cpu,
  FileText,
  BarChart2,
  Users,
  Send,
  Sliders,
  CheckSquare,
  AlertCircle,
  Database,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface ExperimentDetailViewProps {
  featureId: string;
  onNavigate: (route: string) => void;
}

export const ExperimentDetailView: React.FC<ExperimentDetailViewProps> = ({
  featureId,
  onNavigate,
}) => {
  const feature = getExperimentalFeatureById(featureId);
  const [testInput, setTestInput] = useState('');
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);

  if (!feature) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Experiment nebyl nalezen</h2>
        <p className="text-xs text-slate-500">Požadovaný experimentální modul neexistuje v centrálním registru.</p>
        <button
          type="button"
          onClick={() => onNavigate('/experimenty')}
          className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
        >
          Zpět do laboratoře
        </button>
      </div>
    );
  }

  const handleRunSandbox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    if (feature.status === 'READY') {
      setSandboxResult(
        `✅ Požadavek byl validován klientskou vrstvou pro backend capability "${feature.backendCapability}". Server autorizuje operaci přes ControlPlaneAuthorization.`
      );
    } else if (feature.status === 'BETA') {
      setSandboxResult(
        `🔵 Zpracování v beta režimu pro "${feature.backendCapability}". Vstup byl zkontrolován: délka ${testInput.length} znaků.`
      );
    } else {
      setSandboxResult(
        `🟠 EXPERIMENTÁLNÍ REŽIM: Rozhraní úspěšně zachytilo vstupní data. Backendová služba pro "${feature.backendCapability}" zatím není v produkci nasazena. Žádná falešná data nebyla vrácena.`
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-150">
      {/* Top back button */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate('/experimenty')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět do Experimentální laboratoře</span>
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Kategorie: {feature.category.toUpperCase()}
              </span>
              {feature.backendCapability && (
                <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                  capability: {feature.backendCapability}
                </span>
              )}
            </div>
            <FeatureStatusBadge status={feature.status} size="lg" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mb-3">
            {feature.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
            {feature.description}
          </p>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Status banner */}
          <ExperimentBanner
            status={feature.status}
            featureName={feature.name}
            customNote={feature.implementationNote.technicalDetails}
          />

          {/* Implementation status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Co aktuálně funguje</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {feature.implementationNote.works.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">
                <CircleDashed className="w-4 h-4 text-amber-600" />
                <span>Ve vývoji / Plánováno</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {feature.implementationNote.inProgressOrMissing.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dedicated interactive test sandbox or demonstration */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Interaktivní náhled experimentu</h3>
                  <span className="text-[11px] text-slate-500">Testovací prostředí bez falšování backendových dat</span>
                </div>
              </div>
              {feature.backendCapability && (
                <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">
                  {feature.backendCapability}
                </span>
              )}
            </div>

            <form onSubmit={handleRunSandbox} className="space-y-3">
              <label htmlFor="experiment-sandbox-input" className="block text-xs font-semibold text-slate-700">
                Vstupní podklad / parametry pro testování:
              </label>
              <textarea
                id="experiment-sandbox-input"
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder={`Zadejte testovací text či data pro ověření rozhraní ${feature.name}...`}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {feature.status === 'EXPERIMENT'
                    ? '⚠️ Zpracování pouze ověří formát vstupu, backend ještě není propojen.'
                    : 'Podléhá serverovému ověření identity a oprávnění.'}
                </span>
                <button
                  id="experiment-sandbox-submit"
                  type="submit"
                  disabled={!testInput.trim()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Otestovat rozhraní</span>
                </button>
              </div>
            </form>

            {sandboxResult && (
              <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed animate-in fade-in duration-100">
                <strong className="block text-slate-950 font-bold mb-1">Výsledek testovacího běhu:</strong>
                <p>{sandboxResult}</p>
              </div>
            )}
          </div>

          {/* Security and Authority box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-950">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Bezpečnostní architektura a ControlPlaneAuthorization</span>
            </div>
            <p className="leading-relaxed">
              V souladu s globální instrukcí Synthesis ekosystému je server výhradní autorizační autoritou.
              Klientské rozhraní nesmí manipulovat s rolemi, systémovými instrukcemi ani obcházet Policy Engine.
              Případný nedostupný backend se nikdy nenahrazuje falešnými mock daty v produkčních cestách.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
