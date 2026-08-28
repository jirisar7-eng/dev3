const fs = require('fs');
const tabPath = 'src/components/case/OfflineVaultSyncTab.tsx';
let tabCode = fs.readFileSync(tabPath, 'utf8');

const replacement = `
  const renderSyncStatusBadge = (status: SyncStatusType) => {
    switch (status) {
      case 'ONLINE':
        if (sync.queue.length === 0) {
          return (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Synchronizováno
              </span>
              <span className="text-[11px] text-slate-500 pl-2">Všechny změny jsou bezpečně odeslány na server.</span>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Čeká na synchronizaci
              </span>
              <span className="text-[11px] text-slate-500 pl-2">Existují změny uložené pouze lokálně.</span>
            </div>
          );
        }
      case 'OFFLINE':
      case 'ČEKÁ NA PŘIPOJENÍ':
        return (
          <div className="flex flex-col gap-1">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600" />
              Čeká na synchronizaci
            </span>
            <span className="text-[11px] text-slate-500 pl-2">Existují změny uložené pouze lokálně (Jste offline).</span>
          </div>
        );
      case 'SYNCHRONIZUJE':
        return (
          <div className="flex flex-col gap-1">
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              Synchronizace probíhá
            </span>
            <span className="text-[11px] text-slate-500 pl-2">Fronta se právě zpracovává.</span>
          </div>
        );
      case 'KONFLIKT':
        return (
          <div className="flex flex-col gap-1">
            <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-black flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              Konflikt
            </span>
            <span className="text-[11px] text-slate-500 pl-2">Lokální a serverová verze se liší a uživatel musí rozhodnout.</span>
          </div>
        );
      case 'CHYBA':
        return (
          <div className="flex flex-col gap-1">
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-black flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Synchronizace se nezdařila
            </span>
            <span className="text-[11px] text-slate-500 pl-2">Došlo k chybě a systém ji nemohl automaticky vyřešit.</span>
          </div>
        );
      default:
        return null;
    }
  };
`;

tabCode = tabCode.replace(/const renderSyncStatusBadge =.*?default:\s*return null;\s*}\s*};/s, replacement);

fs.writeFileSync(tabPath, tabCode);
console.log('Fixed badges.');
