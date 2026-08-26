import React from 'react';
import { Building2, Shield, Users, FileCheck, MessageSquare, Clock, AlertCircle } from 'lucide-react';

export const TeamCenterSlot: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Architektonický slot — Připravováno
            </span>
            <span className="text-xs text-slate-400 font-mono">PHASE 04+ BACKLOG</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-400" />
            🏛️ Team Center: Týmová koordinace & Opatrovnický hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Vyhrazený centrální prostor pro koordinaci dobrovolníků, právních editorů, moderátorů a krizových poradců.
            Tento modul je navržen v informační architektuře Phase 03A jako připravený rozšiřitelný slot.
          </p>
        </div>
      </div>

      {/* Info Notice about Strict RBAC & No Fake Data */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Bezpečnostní a architektonická integrita (P0):</p>
          <p className="leading-relaxed text-amber-800">
            V souladu s pravidly projektu nejsou v této fázi vytvářeny žádné fiktivní uživatelské role ani falešné zápisy do databáze.
            Jakmile budou dokončena backendová API a schvalovací workflow, bude tento slot napojen na skutečná oprávnění a moduly.
          </p>
        </div>
      </div>

      {/* Planned Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              1. Koordinace dobrovolníků a poradců
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Přidělování dotazů z poradny ověřeným dobrovolníkům (<code className="text-slate-800 font-mono">VOLUNTEER</code>) a odborným konzultantům.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Plánováno pro Fázi 4</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">IN PLANNING</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              2. Schvalovací fronty a verifikace
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Centralizovaný přehled čekajících recenzí, ověřování odborníků a kontrola kvality podání od <code className="text-slate-800 font-mono">MODERATOR</code> a <code className="text-slate-800 font-mono">LEGAL_EDITOR</code>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Plánováno pro Fázi 4</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">IN PLANNING</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              3. Týmová komunikace a interní poznámky
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zabezpečená výměna interních poznámek k opatrovnickým případům bez úniku osobních údajů třetím stranám.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Plánováno pro Fázi 4</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">IN PLANNING</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1.5">
              4. Auditovatelný dispatching
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Plný auditní záznam o tom, kdo případ převzal, jaké kroky byly doporučeny a jak byl případ uzavřen.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Plánováno pro Fázi 4</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">IN PLANNING</span>
          </div>
        </div>
      </div>
    </div>
  );
};
