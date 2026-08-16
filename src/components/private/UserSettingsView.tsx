import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Lock, ShieldAlert, KeyRound, CheckCircle2, AlertCircle, Save, Bell, Fingerprint, Trash2, Plus, Unlink, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserSettingsViewProps {
  user: User;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({ user }) => {
  const { loginWithGoogle, loginWithMicrosoft, registerPasskey } = useAuth();

  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPasskeysAndAccounts = async () => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [pRes, aRes] = await Promise.all([
        fetch('/api/auth/passkey/list', { headers }),
        fetch('/api/auth/accounts', { headers })
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPasskeys(pData.passkeys || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setLinkedAccounts(aData.accounts || []);
      }
    } catch (err) {
      console.error('Error fetching security info:', err);
    }
  };

  useEffect(() => {
    fetchPasskeysAndAccounts();
  }, []);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [caseUpdates, setCaseUpdates] = useState(true);

  const handleLinkGoogle = async () => {
    setSecurityStatus(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setSecurityStatus({ type: 'success', text: 'Google účet byl úspěšně propojen.' });
        await fetchPasskeysAndAccounts();
      } else {
        setSecurityStatus({ type: 'error', text: res.error || 'Propojení Google účtu selhalo.' });
      }
    } catch (err: any) {
      setSecurityStatus({ type: 'error', text: err.message || 'Chyba při propojování Google účtu.' });
    }
  };

  const handleLinkMicrosoft = async () => {
    setSecurityStatus(null);
    try {
      const res = await loginWithMicrosoft();
      if (res.success) {
        setSecurityStatus({ type: 'success', text: 'Microsoft účet byl úspěšně propojen.' });
        await fetchPasskeysAndAccounts();
      } else {
        setSecurityStatus({ type: 'error', text: res.error || 'Propojení Microsoft účtu selhalo.' });
      }
    } catch (err: any) {
      setSecurityStatus({ type: 'error', text: err.message || 'Chyba při propojování Microsoft účtu.' });
    }
  };

  const handleUnlinkAccount = async (provider: string) => {
    if (!window.confirm(`Opravdu chcete odpojit účet ${provider}? Ztratíte možnost přihlašovat se tímto účtem.`)) {
      return;
    }
    setSecurityStatus(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/auth/accounts/${provider}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setSecurityStatus({ type: 'success', text: `Účet ${provider} byl úspěšně odpojen.` });
        await fetchPasskeysAndAccounts();
      } else {
        const err = await res.json();
        setSecurityStatus({ type: 'error', text: err.error || 'Odpojení účtu selhalo.' });
      }
    } catch (err: any) {
      setSecurityStatus({ type: 'error', text: err.message || 'Chyba při odpojování účtu.' });
    }
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatus(null);
    const name = newPasskeyName.trim();
    if (!name) {
      setSecurityStatus({ type: 'error', text: 'Zadejte prosím název pro bezpečnostní klíč.' });
      return;
    }

    setLoadingPasskeys(true);
    try {
      const res = await registerPasskey(name);
      if (res.success) {
        setSecurityStatus({ type: 'success', text: 'Bezpečnostní klíč (Passkey) byl úspěšně zaregistrován.' });
        setNewPasskeyName('');
        await fetchPasskeysAndAccounts();
      } else {
        setSecurityStatus({ type: 'error', text: res.error || 'Registrace bezpečnostního klíče selhala.' });
      }
    } catch (err: any) {
      setSecurityStatus({ type: 'error', text: err.message || 'Chyba při registraci bezpečnostního klíče.' });
    } finally {
      setLoadingPasskeys(false);
    }
  };

  const handleDeletePasskey = async (id: string, name: string) => {
    if (!window.confirm(`Opravdu chcete odstranit bezpečnostní klíč "${name}"?`)) {
      return;
    }
    setSecurityStatus(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/auth/passkey/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setSecurityStatus({ type: 'success', text: 'Bezpečnostní klíč byl úspěšně odstraněn.' });
        await fetchPasskeysAndAccounts();
      } else {
        const err = await res.json();
        setSecurityStatus({ type: 'error', text: err.error || 'Odstranění klíče selhalo.' });
      }
    } catch (err: any) {
      setSecurityStatus({ type: 'error', text: err.message || 'Chyba při odstraňování klíče.' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus(null);

    if (newPassword !== confirmPassword) {
      setPassStatus({ type: 'error', text: 'Nové heslo a potvrzení hesla se neshodují.' });
      return;
    }

    if (newPassword.length < 6) {
      setPassStatus({ type: 'error', text: 'Nové heslo musí mít alespoň 6 znaků.' });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_${user.id}_${Date.now()}`,
        },
        body: JSON.stringify({
          userId: user.id,
          oldPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPassStatus({ type: 'success', text: 'Heslo bylo úspěšně změněno.' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        setPassStatus({ type: 'error', text: err.error || 'Změna hesla selhala.' });
      }
    } catch (e: any) {
      setPassStatus({ type: 'error', text: e.message || 'Chyba sítě při změně hesla.' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Security & Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Zabezpečení & Změna hesla</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Změna přístupového hesla k uživatelskému účtu a kontrola zabezpečení.
            </p>
          </div>
        </div>

        {passStatus && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-xs font-medium ${
            passStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {passStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{passStatus.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Původní heslo
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Nové heslo
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Minimálně 6 znaků"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              Potvrzení nového hesla
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Opakujte nové heslo"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-4"
          >
            <Save className="w-4 h-4" />
            {changingPassword ? 'Měním heslo...' : 'Aktualizovat heslo'}
          </button>
        </form>
      </div>

      {/* SSO Accounts & Passkeys Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <Fingerprint className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Dvoufázové ověření & Bezpečnostní klíče</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Spravujte své bezpečnostní klíče (Passkeys) pro rychlé přihlášení a propojte své sociální identity.
            </p>
          </div>
        </div>

        {securityStatus && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
            securityStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {securityStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{securityStatus.text}</span>
          </div>
        )}

        {/* OAuth 2.0 Accounts Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Propojené sociální účty</h3>
          <p className="text-xs text-slate-500">
            Propojte svůj profil s Google nebo Microsoft účtem pro bleskové přihlášení jedním kliknutím bez nutnosti zadávat heslo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Google */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Google</span>
                  {linkedAccounts.find(a => a.provider === 'google') ? (
                    <span className="text-[10px] text-emerald-600 font-medium">{linkedAccounts.find(a => a.provider === 'google')?.email}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Nepropojeno</span>
                  )}
                </div>
              </div>
              {linkedAccounts.find(a => a.provider === 'google') ? (
                <button
                  type="button"
                  onClick={() => handleUnlinkAccount('google')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-50"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Odpojit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  className="text-xs font-bold text-blue-900 hover:text-blue-800 transition-colors flex items-center gap-1.5 py-1 px-3 rounded-lg border border-slate-200 bg-white shadow-xs"
                >
                  Propojit
                </button>
              )}
            </div>

            {/* Microsoft */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z" />
                  <path fill="#80bb0a" d="M12 0h11v11H12z" />
                  <path fill="#00a1f1" d="M0 12h11v11H0z" />
                  <path fill="#ffb900" d="M12 12h11v11H12z" />
                </svg>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Microsoft</span>
                  {linkedAccounts.find(a => a.provider === 'microsoft') ? (
                    <span className="text-[10px] text-emerald-600 font-medium">{linkedAccounts.find(a => a.provider === 'microsoft')?.email}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Nepropojeno</span>
                  )}
                </div>
              </div>
              {linkedAccounts.find(a => a.provider === 'microsoft') ? (
                <button
                  type="button"
                  onClick={() => handleUnlinkAccount('microsoft')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-50"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Odpojit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkMicrosoft}
                  className="text-xs font-bold text-blue-900 hover:text-blue-800 transition-colors flex items-center gap-1.5 py-1 px-3 rounded-lg border border-slate-200 bg-white shadow-xs"
                >
                  Propojit
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-6">
          {/* Passkeys List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Moje bezpečnostní klíče (Passkeys)</h3>
              <button
                type="button"
                onClick={fetchPasskeysAndAccounts}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all"
                title="Aktualizovat seznam"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Passkey umožňuje nejbezpečnější možné přihlášení pomocí biometriky (otisk prstu, rozpoznání obličeje) nebo PINu vašeho zařízení bez nutnosti zasílat SMS nebo kód z autentizační aplikace.
            </p>

            {passkeys.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                <Fingerprint className="w-8 h-8 text-slate-300 mx-auto" />
                <span className="text-xs text-slate-400 block font-medium">Zatím nemáte registrovaný žádný bezpečnostní klíč.</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Název klíče</th>
                      <th className="py-3 px-4">Zařízení</th>
                      <th className="py-3 px-4">Vytvořeno</th>
                      <th className="py-3 px-4">Naposledy použito</th>
                      <th className="py-3 px-4 text-right">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {passkeys.map((pk) => (
                      <tr key={pk.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">{pk.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium capitalize">
                          {pk.deviceType === 'single_device' ? 'Pouze toto zařízení' : 'Více zařízení / Cloud sync'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {pk.createdAt ? new Date(pk.createdAt).toLocaleDateString('cs-CZ') : 'Neznámé'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {pk.lastUsedAt ? new Date(pk.lastUsedAt).toLocaleString('cs-CZ') : 'Zatím nepoužito'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePasskey(pk.id, pk.name)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Odebrat klíč"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add New Passkey Form */}
          <form onSubmit={handleRegisterPasskey} className="max-w-lg p-5 rounded-2xl border border-slate-150 bg-slate-50/30 space-y-4">
            <h4 className="text-xs font-bold text-slate-700">Registrovat nový bezpečnostní klíč</h4>
            
            {securityStatus && (
              <div className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
                securityStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {securityStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span className="break-words">{securityStatus.text}</span>
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  required
                  value={newPasskeyName}
                  onChange={(e) => setNewPasskeyName(e.target.value)}
                  placeholder="např. Můj iPhone, Notebook práce"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loadingPasskeys}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                {loadingPasskeys ? 'Registrace...' : 'Přidat klíč'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <Bell className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upozornění & Notifikace</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nastavení zasílání e-mailových upozornění a zpráv z opatrovnického systému.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Systémové notifikace na e-mail</span>
              <span className="text-[11px] text-slate-500">Zasílat informace o důležitých novinkách a změnách v portálu.</span>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Připomínky termínů kalendáře</span>
              <span className="text-[11px] text-slate-500">Upozornění na nadcházející jednání OSPOD a soudní stání.</span>
            </div>
            <input
              type="checkbox"
              checked={caseUpdates}
              onChange={(e) => setCaseUpdates(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Security Info Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-sm font-bold mb-1">Ochrana soukromí v opatrovnických věcech</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Data uložená ve vašem profilu a spisu jsou chráněna serverovou autorizací a nikdy nejsou poskytována třetím stranám. Nezapomínejte se odhlašovat, pokud používáte sdílený počítač.
          </p>
        </div>
      </div>
    </div>
  );
};
