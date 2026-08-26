import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  X,
  Server,
  Info,
  Sparkles,
} from 'lucide-react';

interface GitFileChange {
  status: string;
  statusDescription: string;
  file: string;
  isSecretRisk: boolean;
}

interface GitStatusResponse {
  repository: string;
  branch: string;
  hasToken: boolean;
  clean: boolean;
  fileCount: number;
  files: GitFileChange[];
  secretRiskDetected: boolean;
  forbiddenFiles: string[];
  currentBranch: string;
  lastCommit?: string;
}

export const GitHubPublisher: React.FC = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<GitStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showForceModal, setShowForceModal] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [forcePushing, setForcePushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const handleSuggestPushName = async () => {
    setIsGeneratingTitle(true);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch('/api/admin/git/suggest-push-name', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestedName) {
          setCommitMessage(data.suggestedName);
        }
      }
    } catch (err) {
      console.error('Chyba při generování AI názvu pushe:', err);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch('/api/admin/github/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        setErrorMsg('403 Forbidden: Přístup vyžaduje roli SUPER_ADMIN a oprávnění system.github.publish.');
        setStatus(null);
        return;
      }

      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        setErrorMsg('Backend API není v tomto prostředí dostupné. GitHub PUSH lze provést pouze z prostředí, kde je dostupný serverový backend.');
        setStatus(null);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Selhalo načítání stavu Git repozitáře.');
      }

      const data: GitStatusResponse = await res.json();
      
      if ((data as any).status === 'GITHUB_TOKEN_MISSING' || data.hasToken === false) {
        setErrorMsg('Na serveru není nakonfigurován GITHUB_TOKEN. Funkce publikování není dostupná.');
        setStatus(null);
        return;
      }

      setStatus(data);

      if (!data.clean && data.files && data.files.length > 0) {
        handleSuggestPushName();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Chyba při komunikaci se serverem.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    const isDevOrPreview = (import.meta as any).env?.DEV || 
      window.location.hostname.includes('localhost') || 
      window.location.hostname.includes('run.app') || 
      window.location.hostname.includes('aistudio');

    if (currentUser?.role === 'SUPER_ADMIN' || isDevOrPreview) {
      fetchStatus();
    }
  }, [currentUser]);

  const handleOpenConfirm = () => {
    setErrorMsg(null);
    setPushResult(null);

    setShowConfirmModal(true);
  };

  const handleExecutePush = async () => {
    setShowConfirmModal(false);
    setPushing(true);
    setErrorMsg(null);
    setPushResult(null);

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch('/api/admin/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          commitMessage: commitMessage.trim(),
        }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        throw new Error('Backend API není v tomto prostředí dostupné. GitHub PUSH lze provést pouze z prostředí, kde je dostupný serverový backend.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Publikování na GitHub selhalo.');
      }

      setPushResult({
        success: true,
        message: data.message || 'Projekt byl úspěšně publikován na GitHub.',
        timestamp: data.timestamp,
      });

      setCommitMessage('');
      fetchStatus();
    } catch (err: any) {
      setPushResult({
        success: false,
        message: err.message || 'Neočekávaná chyba při publikování.',
      });
    } finally {
      setPushing(false);
    }
  };

  const handleOpenForceConfirm = () => {
    setErrorMsg(null);
    setPushResult(null);

    setShowForceModal(true);
  };

  const handleExecuteForcePush = async () => {
    setShowForceModal(false);
    setForcePushing(true);
    setErrorMsg(null);
    setPushResult(null);

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await apiFetch('/api/admin/github/force-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          commitMessage: commitMessage.trim() || 'FORCE PUSH OVERWRITE',
        }),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        throw new Error('Backend API není v tomto prostředí dostupné. GitHub PUSH lze provést pouze z prostředí, kde je dostupný serverový backend.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'FORCE PUSH na GitHub selhal.');
      }

      setPushResult({
        success: true,
        message: data.message || 'FORCE PUSH na GitHub byl úspěšně proveden.',
        timestamp: data.timestamp,
      });

      setCommitMessage('');
      fetchStatus();
    } catch (err: any) {
      setPushResult({
        success: false,
        message: err.message || 'Neočekávaná chyba při spouštění FORCE PUSH.',
      });
    } finally {
      setForcePushing(false);
    }
  };

  // RBAC Permission Guard
  const isDevOrPreview = (import.meta as any).env?.DEV || 
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('run.app') || 
    window.location.hostname.includes('aistudio');

  const hasAccess = isDevOrPreview || currentUser?.role === 'SUPER_ADMIN';

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold uppercase">
          403 Access Restricted
        </div>
        <h3 className="text-xl font-black text-slate-900">GitHub Publisher — Přístup odepřen</h3>
        <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
          Nástroj pro přímé publikování zdrojového kódu na GitHub je zpřístupněn <strong>výhradně pro účet s rolí SUPER_ADMIN</strong> (oprávnění <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">system.github.publish</code>). Běžný uživatel ani standardní administrátor nemá přístup k tomuto modulu.
        </p>
        <div className="pt-2 text-xs text-slate-400 font-medium">
          Vaše aktuální role: <span className="font-bold text-slate-800 uppercase">{currentUser?.role || 'NEPŘIHLÁŠEN'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5" />
              SYSTEM PUBLISHER
            </span>
            <span className="text-xs text-slate-400 font-mono">system.github.publish</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            GitHub Publisher
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bezpečné nasazení a verzování projektu přímo do oficiálního repozitáře na GitHubu.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loadingStatus}
          className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loadingStatus ? 'animate-spin' : ''}`} />
          <span>{loadingStatus ? 'Kontroluji...' : 'Zkontrolovat změny'}</span>
        </button>
      </div>

      {/* Target Config Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            GitHub Repozitář
          </span>
          <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <span>{status?.repository || 'jirisar7-eng/dev3'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Cílová Větev (Branch)
          </span>
          <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
            <GitCommit className="w-4 h-4 text-emerald-600" />
            <span>{status?.branch || 'main'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Autentizace (Server-Side)
          </span>
          <div className="flex items-center gap-2 font-bold text-xs">
            {status?.hasToken ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>GITHUB_TOKEN aktivní</span>
              </span>
            ) : (
              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>GITHUB_TOKEN chybí</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security Policies Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 block">Bezpečnostní záruky GitHub Publisher:</span>
          <p>
            • GitHub token je uložen výhradně v serverové proměnné <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">GITHUB_TOKEN</code> a nikdy se neposílá do prohlížeče, neukládá do databáze ani nezapisuje do AuditLogu.
          </p>
          <p>
            • Automatická ochrana secrets: Soubory <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">.env</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">node_modules</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">dist</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">secrets</code> a klíče jsou před PUSH přísně kontrolovány. Pokud by hrozil únik, PUSH bude okamžitě zastaven.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-bold">{errorMsg}</div>
        </div>
      )}

      {pushResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
            pushResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {pushResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <span className="font-extrabold block text-sm">{pushResult.success ? 'Úspěšný PUSH' : 'Chyba při PUSH'}</span>
            <p>{pushResult.message}</p>
            {pushResult.timestamp && (
              <p className="text-[10px] text-slate-500">Čas publikování: {new Date(pushResult.timestamp).toLocaleString('cs-CZ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Changes View & Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-900" />
              <span>Detekované Změny v Projektu</span>
            </h3>
            <p className="text-xs text-slate-500">
              Přehled změněných, přidaných nebo smazaných souborů od posledního commitu.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
              status?.clean
                ? 'bg-slate-100 text-slate-600'
                : status?.secretRiskDetected
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {status?.clean ? 'Pracovní strom čistý' : `${status?.fileCount || 0} změněných souborů`}
          </span>
        </div>

        {/* Files List */}
        {loadingStatus ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900" />
            <p>Provádím <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">git status</code> na serveru...</p>
          </div>
        ) : status && status.files.length > 0 ? (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-200/80 text-xs">
              {status.files.map((file, idx) => (
                <div key={idx} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 font-mono text-[11px] truncate">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] shrink-0 ${
                        file.status.includes('M')
                          ? 'bg-blue-100 text-blue-800'
                          : file.status.includes('A') || file.status.includes('??')
                          ? 'bg-emerald-100 text-emerald-800'
                          : file.status.includes('D')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {file.status}
                    </span>
                    <span className="text-slate-800 font-semibold truncate">{file.file}</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-sans shrink-0">{file.statusDescription}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-700">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-emerald-800 text-sm">Všechny změny jsou úspěšně synchronizovány s GitHubem.</p>
            <p className="text-emerald-600 text-[11px] mt-1">
              Pracovní strom je čistý. Pro provedení nového push proveďte další změny v kódu.
            </p>
          </div>
        )}

        {/* Commit Message & Action */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Zpráva k commitu (Commit Message) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSuggestPushName}
                disabled={isGeneratingTitle || loadingStatus || !status || status.clean}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className={`w-3.5 h-3.5 text-blue-600 ${isGeneratingTitle ? 'animate-spin' : ''}`} />
                <span>{isGeneratingTitle ? 'AI generuje název...' : 'AI navrhnout název'}</span>
              </button>
            </div>
            <input
              type="text"
              value={isGeneratingTitle ? 'AI generuje název...' : commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              disabled={isGeneratingTitle}
              placeholder={isGeneratingTitle ? 'AI generuje název...' : 'např. feat(admin): přihlašování přes MojeID'}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden font-medium transition-all ${
                isGeneratingTitle
                  ? 'bg-blue-50/60 border-blue-300 text-blue-800 animate-pulse italic'
                  : 'bg-slate-50/50 focus:bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Před spuštěním operace budete požádáni o výslovné potvrzení.</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenForceConfirm}
                disabled={false}
                className="py-3.5 px-5 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-300 font-extrabold text-xs hover:bg-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forcePushing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-800" />
                    <span>FORCE PUSH probíhá...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>⚠️ FORCE PUSH — PŘEPSAT GITHUB</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenConfirm}
                disabled={false}
                className="py-3.5 px-6 rounded-xl bg-blue-900 text-white font-extrabold text-xs hover:bg-blue-800 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pushing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Publikuji na GitHub...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>PUSH NA GITHUB</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL - STANDARD PUSH */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                <GitPullRequest className="w-5 h-5 text-blue-900" />
                <span>Potvrzení publikování na GitHub</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-sm mb-0.5">Opravdu si přejete provést PUSH?</span>
                  <p>
                    Tato akce automaticky provede <code className="bg-amber-100 px-1 py-0.5 rounded">git add .</code>, <code className="bg-amber-100 px-1 py-0.5 rounded">git commit</code> a <code className="bg-amber-100 px-1 py-0.5 rounded">git push</code> do repozitáře.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cílové repozitář:</span>
                  <span className="font-bold text-slate-900">{status?.repository}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cílová větev (Branch):</span>
                  <span className="font-bold text-slate-900">{status?.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Počet změněných souborů:</span>
                  <span className="font-bold text-blue-900">{status?.fileCount}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Commit Message:</span>
                  <span className="font-bold text-slate-900 bg-white p-2 rounded-xl border border-slate-200 block italic">
                    "{commitMessage}"
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Storno
              </button>
              <button
                onClick={handleExecutePush}
                className="py-2.5 px-6 rounded-xl bg-emerald-700 text-white font-extrabold text-xs hover:bg-emerald-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Potvrdit PUSH na GitHub</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL - FORCE PUSH */}
      {showForceModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-300 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-lg">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
                <span>FORCE PUSH — PŘEPSAT GITHUB</span>
              </div>
              <button
                onClick={() => setShowForceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2">
                <span className="font-extrabold text-sm block text-rose-800">
                  «⚠️ FORCE PUSH
                  <br />
                  Aktuální lokální stav přepíše vzdálenou větev main na GitHubu.
                  <br />
                  Historie vzdálené větve může být přepsána.
                  <br />
                  Chcete pokračovat?»
                </span>
                <p className="text-[11px] leading-relaxed text-rose-700">
                  Bude proveden příkaz <code className="bg-rose-100 font-mono px-1.5 py-0.5 rounded font-bold">git push --force origin HEAD:main</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Repozitář:</span>
                  <span className="font-bold text-slate-900">jirisar7-eng/dev3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cílová větev:</span>
                  <span className="font-bold text-slate-900">main</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Oprávnění:</span>
                  <span className="font-bold text-rose-800 font-mono text-[10px]">SUPER_ADMIN + system.github.force_publish</span>
                </div>
                {commitMessage.trim() && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Commit Message:</span>
                    <span className="font-bold text-slate-900 bg-white p-2 rounded-xl border border-slate-200 block italic">
                      "{commitMessage}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowForceModal(false)}
                className="py-2.5 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Storno
              </button>
              <button
                onClick={handleExecuteForcePush}
                className="py-2.5 px-6 rounded-xl bg-rose-700 text-white font-extrabold text-xs hover:bg-rose-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>POTVRDIT FORCE PUSH</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
