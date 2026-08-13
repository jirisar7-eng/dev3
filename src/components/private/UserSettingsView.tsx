import React, { useState } from 'react';
import { User } from '../../types';
import { Lock, ShieldAlert, KeyRound, CheckCircle2, AlertCircle, Save, Bell } from 'lucide-react';

interface UserSettingsViewProps {
  user: User;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({ user }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [caseUpdates, setCaseUpdates] = useState(true);

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
