const fs = require('fs');

const path = 'src/pages/MyCasePage.tsx';
let code = fs.readFileSync(path, 'utf8');

// We will replace the <button onClick={() => setActiveTab('offline-sync')} ...> block 
// with a new dropdown component logic. Since MyCasePage is huge, it's easier to use string replacement carefully.

// Find the block starting with `<button` and ending with `</button>` right before the Tabs Navigation block.
// Wait, the button is located in a div that holds "Osobní spis / <caseNumber>" and other controls.
// Let's find it.
const buttonRegex = /<button\s+onClick=\{\(\) => setActiveTab\('offline-sync'\)\}\s+className=\{`px-3 py-1\.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1\.5 cursor-pointer.*?<\/button>/s;

const newIndicator = `
          {/* Rozbalitelný detail (Dropdown) pro stav synchronizace */}
          <div className="relative group">
            <button
              onClick={() => setActiveTab('offline-sync')}
              className={\`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer \${
                offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : (offlineSync.syncStatus === 'OFFLINE' || offlineSync.queue.length > 0)
                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  : offlineSync.syncStatus === 'SYNCHRONIZUJE'
                  ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  : offlineSync.syncStatus === 'KONFLIKT'
                  ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                  : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
              }\`}
              title="Stav offline synchronizace"
            >
              {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : offlineSync.syncStatus === 'OFFLINE' || offlineSync.syncStatus === 'ČEKÁ NA PŘIPOJENÍ' ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              ) : offlineSync.syncStatus === 'SYNCHRONIZUJE' ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : offlineSync.syncStatus === 'KONFLIKT' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
              ) : offlineSync.queue.length > 0 ? (
                 <Clock className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className="hidden sm:inline">
                {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0 && 'Synchronizováno'}
                {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length > 0 && 'Čeká na synchronizaci'}
                {(offlineSync.syncStatus === 'OFFLINE' || offlineSync.syncStatus === 'ČEKÁ NA PŘIPOJENÍ') && 'Offline'}
                {offlineSync.syncStatus === 'SYNCHRONIZUJE' && 'Synchronizace...'}
                {offlineSync.syncStatus === 'KONFLIKT' && 'Konflikt'}
                {offlineSync.syncStatus === 'CHYBA' && 'Chyba'}
              </span>
              {offlineSync.queue.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white">
                  {offlineSync.queue.length}
                </span>
              )}
            </button>
            
            {/* Popover na hover (Rozbalitelný detail) */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Stav synchronizace
              </h4>
              <div className="space-y-2 text-xs text-slate-600 mb-3">
                <p>
                  <strong>Stav:</strong> {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0 ? 'Všechny změny jsou odeslány na server.' : offlineSync.queue.length > 0 ? 'Existují změny uložené pouze lokálně.' : 'Offline režim.'}
                </p>
                <p>
                  <strong>Čekající změny:</strong> {offlineSync.queue.length}
                </p>
                {offlineSync.lastSyncTime && (
                  <p>
                    <strong>Poslední sync:</strong> {new Date(offlineSync.lastSyncTime).toLocaleTimeString('cs-CZ')}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('offline-sync');
                }}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-colors"
              >
                Otevřít přehled synchronizace
              </button>
            </div>
          </div>
`;

if (buttonRegex.test(code)) {
  code = code.replace(buttonRegex, newIndicator);
  // Need to make sure CheckCircle2 is imported
  if (!code.includes('CheckCircle2')) {
    code = code.replace(/import \{([^}]+)\}\ from 'lucide-react';/, (match, group1) => {
      return `import {${group1}, CheckCircle2, Clock } from 'lucide-react';`;
    });
  }
  fs.writeFileSync(path, code);
  console.log('Fixed MyCasePage sync indicator.');
} else {
  console.log('Could not find the button in MyCasePage.');
}
