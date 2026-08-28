import React, { useState } from 'react';
import { ClientCase } from '../../types';
import { useOfflineSync, SyncStatusType } from '../../hooks/useOfflineSync';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  Layers,
  FileEdit,
  Plus,
  Trash2,
  ArrowRight,
  Database,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

interface OfflineVaultSyncTabProps {
  activeCase: ClientCase;
  syncHook?: ReturnType<typeof useOfflineSync>;
}

export const OfflineVaultSyncTab: React.FC<OfflineVaultSyncTabProps> = ({
  activeCase,
  syncHook: externalSyncHook,
}) => {
  const internalSyncHook = useOfflineSync({ autoSyncOnOnline: true });
  const sync = externalSyncHook || internalSyncHook;

  const [pinInput, setPinInput] = useState('');
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;
    await sync.unlockVault(pinInput);
    setPinInput('');
  };

  // Helper for status badge styling and text
  const renderSyncStatusBadge = (status: SyncStatusType) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            ONLINE
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600" />
            OFFLINE
          </span>
        );
      case 'SYNCHRONIZUJE':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            SYNCHRONIZUJE
          </span>
        );
      case 'ČEKÁ NA PŘIPOJENÍ':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-black flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
            ČEKÁ NA PŘIPOJENÍ
          </span>
        );
      case 'KONFLIKT':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-black flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-600" />
            KONFLIKT
          </span>
        );
      case 'CHYBA':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-black flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            CHYBA
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Sync Status Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                PWA Offline Trezor & Synchronizace
              </h2>
              {renderSyncStatusBadge(sync.syncStatus)}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Šifrovaná fronta SecureDB (AES-256-GCM) • Automatická synchronizace při obnove připojení
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {sync.isLocked ? (
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> SecureDB Zamčen
            </span>
          ) : (
            <button
              onClick={sync.lockVault}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Zamknout trezor
            </button>
          )}

          <button
            onClick={() => sync.triggerSync()}
            disabled={sync.isSyncing || sync.isLocked || !sync.isOnline}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sync.isSyncing ? 'animate-spin' : ''}`} />
            Ručně synchronizovat
          </button>
        </div>
      </div>

      {/* Global Errors or Unlock prompt */}
      {sync.errorMessage && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{sync.errorMessage}</span>
          </div>
        </div>
      )}

      {/* Locked SecureDB Notice & Unlock Form */}
      {sync.isLocked && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-800 text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SecureDB Trezor je zamčen (Fail-Closed)</h3>
              <p className="text-xs text-slate-400">
                Data v offline frontě jsou zašifrována pomocí AES-256-GCM. Pro přístup k frontě a synchronizaci zadejte PIN.
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Zadejte PIN (např. 1234)"
                className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono w-52 focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" /> Odemknout SecureDB
            </button>
          </form>

          {sync.unlockError && (
            <p className="text-xs text-rose-400 font-bold">{sync.unlockError}</p>
          )}
        </div>
      )}

      {/* Queue Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Celkem ve frontě
            </span>
            <span className="text-2xl font-black text-slate-900">{sync.queue.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Čeká na odoslání
            </span>
            <span className="text-2xl font-black text-amber-600">{sync.pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Konflikty k řešení
            </span>
            <span className="text-2xl font-black text-purple-600">{sync.conflictCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
              Neúspěšné (Chyby)
            </span>
            <span className="text-2xl font-black text-rose-600">{sync.failedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Seznam operací v offline frontě SecureDB
            </h3>
            <p className="text-xs text-slate-500">
              Detailní přehled lokálně připravených podání a jejich stavu.
            </p>
          </div>

          {sync.queue.some((i) => i.status === 'COMPLETED') && (
            <button
              onClick={sync.clearCompleted}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Vyčistit dokončené
            </button>
          )}
        </div>

        {sync.queue.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <FileCheck2 className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">Offline fronta je prázdná</p>
            <p className="text-[11px] text-slate-400">
              Všechny změny jsou plně synchronizovány se serverovým spisem.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sync.queue.map((item) => (
              <div
                key={item.operationId}
                className={`p-4 rounded-2xl border transition-all ${
                  item.status === 'CONFLICT'
                    ? 'border-purple-300 bg-purple-50/40'
                    : item.status === 'FAILED'
                    ? 'border-rose-200 bg-rose-50/30'
                    : item.status === 'COMPLETED'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {item.operationId}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          item.action === 'CREATE'
                            ? 'bg-blue-100 text-blue-800'
                            : item.action === 'UPDATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.action}
                      </span>

                      <span className="text-xs font-bold text-slate-900">
                        {item.payload.title || 'Podání bez názvu'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Spis ID: <code className="font-mono">{item.caseId}</code> • Vytvořeno:{' '}
                      {new Date(item.clientTimestamp).toLocaleString('cs-CZ')} • Pokusy:{' '}
                      {item.retryCount}/{item.maxRetries}
                    </p>
                  </div>

                  {/* Status Tag */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'COMPLETED' && (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Synchronizováno
                      </span>
                    )}

                    {item.status === 'PENDING' && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Čeká ve frontě
                      </span>
                    )}

                    {item.status === 'SYNCING' && (
                      <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        Odesílám...
                      </span>
                    )}

                    {item.status === 'FAILED' && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Selhalo
                      </span>
                    )}

                    {item.status === 'CONFLICT' && (
                      <span className="px-2.5 py-1 rounded-xl bg-purple-200 text-purple-900 text-xs font-black flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-purple-700" />
                        KONFLIKT VERZÍ
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Banner if item failed */}
                {item.error && item.status !== 'CONFLICT' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-100/60 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{item.error}</span>
                  </div>
                )}

                {/* Conflict Resolution Box */}
                {item.status === 'CONFLICT' && (
                  <div className="mt-3 p-4 rounded-2xl bg-white border-2 border-purple-400 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        Vznikl rozpor mezi lokální offline verzí a aktualizovaným serverovým spisem.
                        Vyberte, kterou verzi chcete zachovat.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                        <span className="font-bold text-purple-900 block uppercase text-[10px]">
                          Lokální verze (LOCAL)
                        </span>
                        <p className="font-semibold text-slate-800">
                          {item.payload.title || 'Místní úprava'}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Vychází z verze v{item.baseVersion || 1} • Čas:{' '}
                          {new Date(item.clientTimestamp).toLocaleTimeString('cs-CZ')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-700 block uppercase text-[10px]">
                          Serverová verze (SERVER)
                        </span>
                        <p className="font-semibold text-slate-800">
                          {item.conflictDetails?.serverDraft?.title || 'Serverový spis'}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Aktuální verze v{item.conflictDetails?.serverDraft?.version || '?'} • Čas:{' '}
                          {item.conflictDetails?.serverDraft?.updatedAt
                            ? new Date(
                                item.conflictDetails.serverDraft.updatedAt
                              ).toLocaleTimeString('cs-CZ')
                            : 'neznámý'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => sync.resolveConflict(item.operationId, 'LOCAL')}
                        disabled={sync.isSyncing}
                        className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Použít místní verzi (LOCAL)
                      </button>

                      <button
                        onClick={() => sync.resolveConflict(item.operationId, 'SERVER')}
                        disabled={sync.isSyncing}
                        className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5" /> Použít serverovou verzi (SERVER)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      
    </div>
  );
};
