import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  KeyRound,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Search,
  X,
  Copy,
  Eye,
  EyeOff,
  Server,
  HardDrive,
  Plus,
  Activity,
  Globe,
  Lock,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface MailboxItem {
  username: string;
  name: string;
  active: number | boolean | string;
  quota: number;
  quota_used?: number;
  domain?: string;
  local_part?: string;
  created?: string;
  messages?: number;
}

interface HealthInfo {
  status: 'OK' | 'UNAVAILABLE' | 'UNAUTHORIZED' | 'MISCONFIGURED' | 'TIMEOUT';
  healthy: boolean;
  httpStatus?: number;
  latencyMs?: number;
  publicUrl: string;
  internalUrl?: string;
  dnsHostname?: string;
  resolvedPublicIp?: string;
  internalTargetIp?: string;
  targetPort?: number;
  sniHostname?: string;
  tlsValidation?: boolean;
  targetAddress: string;
  apiKeyConfigured: boolean;
  apiKeyLength: number;
  mailboxesCount?: number;
  message: string;
  errorDetails?: string;
}

export const MailcowManager: React.FC<{ initialName?: string }> = ({ initialName = '' }) => {
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [hasLoadedSuccessfully, setHasLoadedSuccessfully] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Diagnostics / Health check state
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState(initialName);
  const [formLocalPart, setFormLocalPart] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formQuota, setFormQuota] = useState(3072); // 3GB default
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password change modal state
  const [passwordModal, setPasswordModal] = useState<{ email: string; newPass: string; visible: boolean } | null>(null);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // Synchronize initialName
  useEffect(() => {
    if (initialName) {
      setFormName(initialName);
      // Auto suggest local_part from name (e.g. "Pavel Novák" -> "pavel.novak")
      const normalized = initialName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '.')
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '');
      if (normalized) {
        setFormLocalPart(normalized);
      }
    }
  }, [initialName]);

  const generateRandomPassword = (): string => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const nums = '23456789';
    const syms = '!@#$%*_-';
    const allChars = upper + lower + nums + syms;

    const length = 18;
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    const passwordArray = [
      upper[randomValues[0] % upper.length],
      lower[randomValues[1] % lower.length],
      nums[randomValues[2] % nums.length],
      syms[randomValues[3] % syms.length],
    ];

    for (let i = 4; i < length; i++) {
      passwordArray.push(allChars[randomValues[i] % allChars.length]);
    }

    const shuffleValues = new Uint32Array(length);
    window.crypto.getRandomValues(shuffleValues);
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = shuffleValues[i] % (i + 1);
      const temp = passwordArray[i];
      passwordArray[i] = passwordArray[j];
      passwordArray[j] = temp;
    }

    return passwordArray.join('');
  };

  const handleGenerateFormPassword = () => {
    const generated = generateRandomPassword();
    setFormPassword(generated);
    setShowPassword(true);
  };

  const fetchMailboxes = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/mailcow/mailboxes', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errText = await res.text().catch(() => '');
        console.error('[MailcowManager] Neplatná odpověď serveru:', errText);
        setErrorCode('MAILCOW_UNAVAILABLE');
        throw new Error('API endpoint nevrátil JSON data.');
      }

      const data = await res.json();
      if (!res.ok || data.success === false) {
        setErrorCode(data.error || 'MAILCOW_UNAVAILABLE');
        throw new Error(data.message || data.error || `Chyba serveru (${res.status})`);
      }

      // Support { success: true, mailboxes: [...] } as well as raw array [...]
      const mailboxList = Array.isArray(data.mailboxes)
        ? data.mailboxes
        : Array.isArray(data)
        ? data
        : typeof data === 'object' && data !== null
        ? Object.values(data).filter((v: any) => v && typeof v === 'object' && v.username)
        : [];

      setMailboxes(mailboxList);
      setHasLoadedSuccessfully(true);
    } catch (e: any) {
      setError(e.message || 'Chyba připojení k serveru.');
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/mailcow/health', {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.health) {
        setHealthInfo(data.health);
      }
    } catch (e: any) {
      setHealthInfo({
        status: 'UNAVAILABLE',
        healthy: false,
        publicUrl: 'https://mail.tatovacesta.cz',
        targetAddress: 'mail.tatovacesta.cz',
        apiKeyConfigured: false,
        apiKeyLength: 0,
        message: e.message || 'Nepodařilo se odeslat diagnostický požadavek.',
      });
    } finally {
      setHealthLoading(false);
      setShowHealthModal(true);
    }
  };

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLocalPart.trim()) {
      setError('Zadejte prosím název schránky (před @tatovacesta.cz).');
      return;
    }
    if (!formPassword.trim()) {
      setError('Zadejte prosím heslo pro novou schránku.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const email = `${formLocalPart.toLowerCase().trim()}@tatovacesta.cz`;
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/mailcow/mailboxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          local_part: formLocalPart.trim(),
          domain: 'tatovacesta.cz',
          name: formName.trim(),
          password: formPassword,
          quota: formQuota,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || `Chyba serveru (${res.status})`);
      }

      setSuccess(`Schránka ${email} byla úspěšně vytvořena v Mailcow.`);
      setFormLocalPart('');
      setFormName('');
      setFormPassword('');
      fetchMailboxes();
    } catch (e: any) {
      setError(e.message || 'Vytvoření schránky selhalo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm(`Opravdu chcete trvale smazat schránku ${email} v Mailcow? Tato akce je nevratná.`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/mailcow/mailboxes/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || `Chyba při mazání schránky (${res.status})`);
      }

      setSuccess(`Schránka ${email} byla úspěšně smazána.`);
      fetchMailboxes();
    } catch (e: any) {
      setError(e.message || 'Chyba při mazání schránky.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordModal = (email: string) => {
    const initialPass = generateRandomPassword();
    setPasswordModal({ email, newPass: initialPass, visible: true });
  };

  const handleConfirmPasswordChange = async () => {
    if (!passwordModal || !passwordModal.newPass.trim()) return;

    setPasswordChangeLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/mailcow/mailboxes/${encodeURIComponent(passwordModal.email)}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: passwordModal.newPass }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || `Chyba při změně hesla (${res.status})`);
      }

      setSuccess(`Heslo pro ${passwordModal.email} bylo úspěšně změněno.`);
      setPasswordModal(null);
    } catch (e: any) {
      setError(e.message || 'Chyba při změně hesla.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const filteredMailboxes = mailboxes.filter((m) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    const username = (m.username || '').toLowerCase();
    const name = (m.name || '').toLowerCase();
    return username.includes(query) || name.includes(query);
  });

  return (
    <div className="space-y-6" id="mailcow-management-module">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Správa e-mailů (Mailcow)
            </h2>
            <p className="text-xs text-slate-500">
              Oficiální e-mailové schránky organizace pod doménou @tatovacesta.cz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={runHealthCheck}
            disabled={healthLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Spustit diagnostiku spojení s Mailcow serverem"
          >
            <Activity className={`w-3.5 h-3.5 ${healthLoading ? 'animate-pulse text-blue-600' : 'text-slate-500'}`} />
            <span>Diagnostika</span>
          </button>
          <button
            onClick={fetchMailboxes}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Aktualizovat schránky"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Obnovit</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {errorCode === 'MAILCOW_UNAUTHORIZED'
                  ? 'Mailcow API odmítlo požadavek. Zkontrolujte API konfiguraci.'
                  : errorCode === 'MAILCOW_TIMEOUT'
                  ? 'Mailcow API neodpovědělo včas.'
                  : 'Mailcow služba je momentálně nedostupná.'}
              </p>
              <p className="mt-0.5 text-amber-800">{error}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={fetchMailboxes}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  Zkusit znovu
                </button>
                <button
                  onClick={runHealthCheck}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-amber-300 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  Zobrazit diagnostiku
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-amber-500 hover:text-amber-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create New Mailbox Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs" id="mailcow-create-card">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          Vytvořit novou schránku @tatovacesta.cz
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                E-mailová adresa (local part)
              </label>
              <div className="flex items-center">
                <input
                  id="mailcow-localpart-input"
                  type="text"
                  value={formLocalPart}
                  onChange={(e) => setFormLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  placeholder="např. jan.novak"
                  className="w-full px-3 py-2 border border-r-0 border-slate-200 rounded-l-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  required
                />
                <span className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono text-slate-600 select-none">
                  @tatovacesta.cz
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Jméno držitele schránky
              </label>
              <input
                id="mailcow-name-input"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Jan Novák"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Heslo schránky
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    id="mailcow-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Bezpečné heslo"
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateFormPassword}
                  className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                  title="Vygenerovat silné náhodné heslo"
                >
                  Vygenerovat
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kvóta (velikost schránky)
              </label>
              <select
                id="mailcow-quota-select"
                value={formQuota}
                onChange={(e) => setFormQuota(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                <option value={1024}>1 GB (Základní)</option>
                <option value={2048}>2 GB</option>
                <option value={3072}>3 GB (Doporučeno)</option>
                <option value={5120}>5 GB</option>
                <option value={10240}>10 GB (Velká)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              id="mailcow-create-submit-btn"
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:bg-blue-400 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Vytvářím schránku...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vytvořit schránku</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Mailboxes List Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Existující schránky v Mailcow
              {hasLoadedSuccessfully && !error && (
                <span className="ml-2 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {mailboxes.length}
                </span>
              )}
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrovat schránky..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">E-mailová adresa</th>
                <th className="p-3.5">Držitel</th>
                <th className="p-3.5">Využití kapacity</th>
                <th className="p-3.5">Stav</th>
                <th className="p-3.5 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && mailboxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 text-slate-700 font-medium">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Načítám e-mailové schránky z Mailcow…</span>
                    </div>
                  </td>
                </tr>
              ) : error && mailboxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-600">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm">
                        {errorCode === 'MAILCOW_UNAUTHORIZED'
                          ? 'Mailcow API odmítlo požadavek. Zkontrolujte API konfiguraci.'
                          : errorCode === 'MAILCOW_TIMEOUT'
                          ? 'Mailcow API neodpovědělo včas.'
                          : 'Mailcow služba je momentálně nedostupná.'}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {error}
                      </p>
                      <div className="pt-2 flex justify-center gap-2">
                        <button
                          onClick={fetchMailboxes}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          Zkusit znovu načíst
                        </button>
                        <button
                          onClick={runHealthCheck}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          Spustit diagnostiku
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredMailboxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    {searchTerm ? (
                      <p>
                        Nenalezena žádná schránka odpovídající výrazu <strong>"{searchTerm}"</strong>.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700">Nejsou vytvořeny žádné e-mailové schránky.</p>
                        <p className="text-[11px] text-slate-400">
                          Pomocí formuláře výše můžete vytvořit první e-mailovou schránku @tatovacesta.cz.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredMailboxes.map((m) => {
                  const quotaMB = m.quota ? Math.round(m.quota / 1024 / 1024) : 0;
                  const usedMB = m.quota_used ? Math.round(m.quota_used / 1024 / 1024) : 0;
                  const usagePct = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : 0;
                  const isActive = m.active === 1 || m.active === '1' || m.active === true;

                  return (
                    <tr key={m.username} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{m.username}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        {m.name || '–'}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  usagePct > 85 ? 'bg-red-500' : usagePct > 60 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(2, usagePct))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-medium">
                              {usagePct}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {usedMB} MB / {quotaMB > 0 ? `${quotaMB} MB` : 'neomezeno'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> AKTIVNÍ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            NEAKTIVNÍ
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenPasswordModal(m.username)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                          title="Změnit heslo schránky"
                        >
                          Změnit heslo
                        </button>
                        <button
                          onClick={() => handleDelete(m.username)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                          title="Smazat schránku"
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Check Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Diagnostika Mailcow serveru
              </h4>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {healthInfo ? (
              <div className="space-y-3 text-xs">
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    healthInfo.healthy
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {healthInfo.healthy ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold">
                      Stav spojení: {healthInfo.healthy ? 'PŘIPOJENO' : healthInfo.status}
                    </p>
                    <p className="text-[11px] mt-0.5">{healthInfo.message}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">DNS hostname:</span>
                    <span className="font-bold text-slate-800">{healthInfo.dnsHostname || 'mail.tatovacesta.cz'}</span>
                  </div>
                  {healthInfo.resolvedPublicIp && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Resolved public IP:</span>
                      <span className="text-slate-800">{healthInfo.resolvedPublicIp} (veřejné DNS)</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Internal target IP:</span>
                    <span className="font-bold text-blue-700">{healthInfo.internalTargetIp || '172.22.1.14'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target port:</span>
                    <span className="text-slate-800">{healthInfo.targetPort || 443}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TLS SNI / Servername:</span>
                    <span className="font-bold text-slate-800">{healthInfo.sniHostname || 'mail.tatovacesta.cz'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TLS validace:</span>
                    <span className="text-emerald-700 font-bold">ZAPNUTA (strict Let's Encrypt SAN)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">API klíč:</span>
                    <span className={healthInfo.apiKeyConfigured ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                      {healthInfo.apiKeyConfigured ? `Nakonfigurován (${healthInfo.apiKeyLength} znaků)` : 'NENÍ nakonfigurován'}
                    </span>
                  </div>
                  {healthInfo.latencyMs !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Odezva (latence):</span>
                      <span className="text-slate-800">{healthInfo.latencyMs} ms</span>
                    </div>
                  )}
                  {healthInfo.mailboxesCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Načtené schránky:</span>
                      <span className="font-bold text-blue-700">{healthInfo.mailboxesCount}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                <p>Spouštím diagnostiku...</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={runHealthCheck}
                disabled={healthLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
                <span>Testovat znovu</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHealthModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Změna hesla pro schránku
              </h4>
              <button
                onClick={() => setPasswordModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Nastavení nového hesla pro <strong className="text-slate-900 font-mono">{passwordModal.email}</strong>.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">Nové heslo</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={passwordModal.visible ? 'text' : 'password'}
                    value={passwordModal.newPass}
                    onChange={(e) => setPasswordModal({ ...passwordModal, newPass: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordModal({ ...passwordModal, visible: !passwordModal.visible })}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {passwordModal.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModal({ ...passwordModal, newPass: generateRandomPassword(), visible: true })}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shrink-0 cursor-pointer"
                >
                  Vygenerovat
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setPasswordModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleConfirmPasswordChange}
                disabled={passwordChangeLoading || !passwordModal.newPass.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {passwordChangeLoading ? 'Ukládám...' : 'Uložit nové heslo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
