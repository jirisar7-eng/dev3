import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UserSubmissionsTab } from './UserSubmissionsTab';
import { UserAppearanceTab } from './UserAppearanceTab';
import {
  User as UserIcon,
  Monitor,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Shield,
  Key,
  Copy,
  QrCode,
  Check,
  AlertTriangle,
  Fingerprint,
  Plus,
  Trash2,
  Unlink,
  RefreshCw,
  Bell,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface UserProfileViewProps {
  user: User;
  onProfileUpdated: (updatedUser: User) => void;
}

const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
  const token =
    localStorage.getItem('tatovacesta_auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token');
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const UserProfileView: React.FC<UserProfileViewProps> = ({ user, onProfileUpdated }) => {
  const { loginWithGoogle, loginWithMicrosoft, registerPasskey } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'password' | 'security' | 'passkeys' | 'social' | 'notifications' | 'submissions'>('profile');

  // --- Profile Form State ---
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Password State ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- 2FA State ---
  const [is2faEnabled, setIs2faEnabled] = useState(user.totpEnabled ?? false);
  const [mfaSetupStep, setMfaSetupStep] = useState<number>(0); // 0 = off, 1 = qr code / key, 2 = code verify, 3 = backup codes
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [totpVerifyCode, setTotpVerifyCode] = useState<string>('');
  const [mfaError, setMfaError] = useState<string>('');
  const [mfaSuccess, setMfaSuccess] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // --- Passkeys & Linked Accounts State ---
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Notification Toggles ---
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [caseUpdates, setCaseUpdates] = useState(true);

  useEffect(() => {
    setIs2faEnabled(user.totpEnabled ?? false);
  }, [user.totpEnabled]);

  const fetchPasskeysAndAccounts = async () => {
    try {
      const headers = getAuthHeaders();
      const [pRes, aRes] = await Promise.all([
        apiFetch('/api/auth/passkey/list', { headers }),
        apiFetch('/api/auth/accounts', { headers }),
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
  }, [user.id]);

  // Avatar generation
  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setAvatar(newAvatarUrl);
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, '');
      if (!/^(\+?[0-9]{9,15})$/.test(cleanPhone)) {
        setProfileMsg({ type: 'error', text: 'Zadejte platné telefonní číslo (např. +420777123456).' });
        setSavingProfile(false);
        return;
      }
    }

    try {
      const res = await apiFetch(`/api/user/profile/${user.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: name.trim() || user.name,
          email: email.trim() || user.email,
          phone: phone.trim(),
          avatar,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        onProfileUpdated(result.user || result);
        setProfileMsg({ type: 'success', text: 'Osobní a kontaktní údaje byly úspěšně uloženy.' });
      } else {
        const err = await res.json();
        setProfileMsg({ type: 'error', text: err.error || 'Uložení profilu selhalo.' });
      }
    } catch (e: any) {
      setProfileMsg({ type: 'error', text: e.message || 'Chyba sítě při ukládání profilu.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Password Submit
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
      const res = await apiFetch('/api/user/password', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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

  // Social Linking
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
      const res = await apiFetch(`/api/auth/accounts/${provider}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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

  // Passkey Registration
  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatus(null);
    const passName = newPasskeyName.trim();
    if (!passName) {
      setSecurityStatus({ type: 'error', text: 'Zadejte prosím název pro bezpečnostní klíč.' });
      return;
    }

    setLoadingPasskeys(true);
    try {
      const res = await registerPasskey(passName);
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

  const handleDeletePasskey = async (id: string, passName: string) => {
    if (!window.confirm(`Opravdu chcete odstranit bezpečnostní klíč "${passName}"?`)) {
      return;
    }
    setSecurityStatus(null);
    try {
      const res = await apiFetch(`/api/auth/passkey/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Můj Profil & Správa Účtu
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centrální správa vašeho uživatelského účtu, bezpečnostních klíčů, hesla a autentizačních metod.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            ID uživatele: {user.id}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'profile' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Osobní & Kontaktní údaje
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
            activeTab === 'appearance' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Vzhled</span>
        </button>
  


        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'password' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Změna hesla
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'security' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-400" />
          Dvoufázové ověření (2FA)
        </button>

        <button
          onClick={() => setActiveTab('passkeys')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'passkeys' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-emerald-400" />
          Bezpečnostní klíče (Passkeys)
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'social' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Unlink className="w-4 h-4" />
          Propojené sociální účty
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'notifications' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifikace
        </button>
      </div>

      {/* --- TAB 1: OSOBNÍ ÚDAJE & AVATAR --- */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {profileMsg && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          {/* Avatar & Account Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <img
              src={avatar || user.avatar}
              alt={name}
              className="w-20 h-20 rounded-2xl border-2 border-blue-600 object-cover bg-white shadow-xs shrink-0"
            />
            <div className="space-y-2 text-center sm:text-left flex-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Profilová fotografie / Avatar</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Vygenerujte si nový bezpečný náhodný avatar pro anonymizovanou reprezentaci v komunitních fórech a systému.
              </p>
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                Vygenerovat nový avatar
              </button>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Jméno a příjmení
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mailová adresa (Účet)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Telefonní číslo
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+420 777 123 456"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Systémová role účtu
              </label>
              <input
                type="text"
                value={user.role}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-blue-900 bg-slate-100 cursor-not-allowed uppercase"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Ukládám...' : 'Uložit osobní údaje'}
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 2: ZMĚNA HESLA --- */}
      {activeTab === 'appearance' && (
        <UserAppearanceTab user={user} />
      )}
  

      {activeTab === 'password' && (
        <div className="space-y-6 max-w-lg">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Změna přihlašovacího hesla
            </h3>
            <p className="text-xs text-slate-500">
              Pro maximální bezpečnost doporučujeme používat silné heslo o délce alespoň 8 znaků obsahující kombinaci písmen, čísel a symbolů.
            </p>
          </div>

          {passStatus && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
                passStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {passStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{passStatus.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
              className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
            >
              <Save className="w-4 h-4" />
              {changingPassword ? 'Aktualizuji...' : 'Aktualizovat heslo'}
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 3: DVOUFÁZOVÉ OVĚŘENÍ (2FA / TOTP) --- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <Shield className="w-6 h-6 text-blue-850" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Dvoufázové ověření (2FA / MFA)</h3>
              <p className="text-xs text-slate-500">Zabezpečte svůj účet pomocí jednorázových časových kódů (TOTP).</p>
            </div>
          </div>

          {['SUPER_ADMIN', 'SYSTEM_ADMIN', 'CONTENT_MANAGER', 'LEGAL_EDITOR', 'MODERATOR', 'ADMIN'].includes(user.role) && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <span className="font-bold">Povinné zabezpečení pro vaši roli:</span> Vaše role (<span className="font-mono">{user.role}</span>) vyžaduje aktivní dvoufázové ověření pro přístup ke správě.
              </div>
            </div>
          )}

          {mfaError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
              {mfaError}
            </div>
          )}

          {mfaSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs border border-emerald-200">
              {mfaSuccess}
            </div>
          )}

          {!is2faEnabled && mfaSetupStep === 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                2FA není v současnosti aktivní
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dvoufázové ověření přidává dodatečnou vrstvu zabezpečení k vašemu účtu. Po zadání hesla budete vyzváni k zadání jednorázového 6místného kódu z vaší mobilní aplikace (Google Authenticator, Microsoft Authenticator nebo 1Password).
              </p>
              <button
                type="button"
                disabled={isGenerating}
                onClick={async () => {
                  setMfaError('');
                  setIsGenerating(true);
                  try {
                    const res = await apiFetch('/api/auth/2fa/generate', {
                      method: 'POST',
                      headers: getAuthHeaders(),
                    });
                    if (!res.ok) {
                      const data = await res.json();
                      throw new Error(data.error || 'Nepodařilo se vygenerovat 2FA klíč.');
                    }
                    const data = await res.json();
                    setQrCodeData(data.qrCode);
                    setSecretKey(data.secret);
                    setBackupCodes(data.backupCodes);
                    setMfaSetupStep(1);
                  } catch (err: any) {
                    setMfaError(err.message);
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                className="px-5 py-2.5 bg-blue-900 text-white rounded-xl font-bold text-xs hover:bg-blue-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                {isGenerating ? 'Generuji...' : 'Aktivovat dvoufázové ověření'}
              </button>
            </div>
          )}

          {!is2faEnabled && mfaSetupStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Krok 1: Naskenujte QR kód</h4>
                <p className="text-xs text-slate-500">
                  Otevřete svou autentizační aplikaci v telefonu a naskenujte tento QR kód.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {qrCodeData ? (
                  <img src={qrCodeData} alt="2FA QR Code" className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-36 h-36 bg-slate-200 flex items-center justify-center rounded-xl text-slate-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
                <div className="space-y-3 flex-1 w-full text-left">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500">Tajný klíč (pokud nelze naskenovat):</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 select-all flex-1 break-all">
                        {secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(secretKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Kopírovat klíč"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Název účtu v aplikaci: <strong className="text-slate-700">TataMaPravo:{user.email}</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMfaSetupStep(0)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={() => setMfaSetupStep(2)}
                  className="px-4 py-2 text-xs font-bold bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Pokračovat na ověření
                </button>
              </div>
            </div>
          )}

          {!is2faEnabled && mfaSetupStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Krok 2: Ověřte kód z aplikace</h4>
                <p className="text-xs text-slate-500">
                  Zadejte 6místný kód, který se zobrazuje ve vaší mobilní aplikaci.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">6místný kód z aplikace:</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpVerifyCode}
                  onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\s+/g, ''))}
                  className="w-full sm:w-48 p-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-[0.2em] text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMfaSetupStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Zpět
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMfaError('');
                    try {
                      const res = await apiFetch('/api/auth/2fa/enable', {
                        method: 'POST',
                        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ code: totpVerifyCode }),
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        if (data.error === '2FA nebyla inicializována') {
                          setMfaSetupStep(0);
                          setMfaError('Platnost relace klíče vypršela. Vygenerujte prosím nový QR kód.');
                        } else {
                          throw new Error(data.error || 'Neplatný kód. Zkuste to prosím znovu.');
                        }
                        return;
                      }
                      const data = await res.json();
                      if (data.token) {
                        localStorage.setItem('tatovacesta_auth_token', data.token);
                      }
                      setIs2faEnabled(true);
                      onProfileUpdated({ ...user, totpEnabled: true, totpBackupCodes: backupCodes });
                      setMfaSetupStep(3);
                    } catch (err: any) {
                      setMfaError(err.message);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Ověřit a zapnout 2FA
                </button>
              </div>
            </div>
          )}

          {mfaSetupStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs font-bold">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Dvoufázové ověření bylo úspěšně aktivována!</span>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Záložní kódy pro nouzové obnovení</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pokud ztratíte přístup ke své mobilní aplikaci, můžete k přihlášení použít jeden z těchto záložních kódů. Uschovejte si je na bezpečném místě.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 text-center">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="bg-white py-1.5 px-3 rounded-lg border border-slate-200 font-bold">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMfaSetupStep(0);
                    setMfaSuccess('2FA je aktivní a plně nastavená.');
                  }}
                  className="px-5 py-2 bg-blue-900 text-white rounded-xl font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  Rozumím, mám uloženo
                </button>
              </div>
            </div>
          )}

          {is2faEnabled && mfaSetupStep !== 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-emerald-900 text-xs">Dvoufázové ověření je AKTIVNÍ</span>
                  <span className="text-[11px] text-emerald-700">Váš účet je chráněn jednorázovými časovými kódy.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-slate-700">Vypnout dvoufázové ověření</h4>
                  <p className="text-xs text-slate-500">
                    Vypnutím dvoufázového ověření snížíte úroveň zabezpečení svého účtu.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Opravdu chcete vypnout dvoufázové ověření?')) return;
                    setMfaError('');
                    setMfaSuccess('');
                    try {
                      const res = await apiFetch('/api/auth/2fa/disable', {
                        method: 'POST',
                        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ code: totpVerifyCode }),
                      });
                      if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Nepodařilo se vypnout 2FA.');
                      }
                      setIs2faEnabled(false);
                      onProfileUpdated({ ...user, totpEnabled: false });
                      setMfaSuccess('Dvoufázové ověření bylo vypnuto.');
                    } catch (err: any) {
                      setMfaError(err.message);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Vypnout dvoufázové ověření
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: BEZPEČNOSTNÍ KLÍČE (PASSKEYS) --- */}
      {activeTab === 'passkeys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-600" />
                Správa bezpečnostních klíčů (Passkeys / WebAuthn)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Přihlašujte se bleskově bez hesla pomocí otisku prstu, obličeje (Face ID) nebo bezpečnostního klíče YubiKey.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchPasskeysAndAccounts}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Obnovit seznam klíčů"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {securityStatus && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium ${
                securityStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {securityStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{securityStatus.text}</span>
            </div>
          )}

          {/* Passkeys Table */}
          {passkeys.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Fingerprint className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">Zatím nemáte zaregistrován žádný Passkey klíč.</p>
              <p className="text-[11px] text-slate-400">Přidejte svůj nový klíč pomocí formuláře níže.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Název klíče</th>
                    <th className="py-3 px-4">Typ zařízeni</th>
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
                        {pk.createdAt ? new Date(pk.createdAt).toLocaleDateString('cs-CZ') : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {pk.lastUsedAt ? new Date(pk.lastUsedAt).toLocaleString('cs-CZ') : 'Zatím nepoužito'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeletePasskey(pk.id, pk.name)}
                          className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Odstranit klíč"
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

          {/* Form to add Passkey */}
          <form onSubmit={handleRegisterPasskey} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-slate-900">Registrovat nový bezpečnostní klíč (Passkey)</h4>
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                placeholder="např. Můj Mac TouchID, iPhone, YubiKey"
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              />
              <button
                type="submit"
                disabled={loadingPasskeys}
                className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                {loadingPasskeys ? 'Registrace...' : 'Přidat Passkey'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- TAB 5: PROPOJENÉ SOCIÁLNÍ ÚČTY --- */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Unlink className="w-4 h-4 text-blue-600" />
              Propojení se sociálními identitami (OAuth 2.0)
            </h3>
            <p className="text-xs text-slate-500">
              Propojte svůj profil s Google nebo Microsoft účtem pro jednoduché přihlášení jedním kliknutím.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Google Account */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Google Účet</span>
                  {linkedAccounts.find((a) => a.provider === 'google') ? (
                    <span className="text-[10px] text-emerald-600 font-bold">{linkedAccounts.find((a) => a.provider === 'google')?.email}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Nepropojeno</span>
                  )}
                </div>
              </div>
              {linkedAccounts.find((a) => a.provider === 'google') ? (
                <button
                  type="button"
                  onClick={() => handleUnlinkAccount('google')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  Odpojit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  className="text-xs font-bold text-blue-900 hover:text-blue-800 transition-colors flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border border-slate-300 bg-white shadow-2xs cursor-pointer"
                >
                  Propojit Google
                </button>
              )}
            </div>

            {/* Microsoft Account */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z" />
                  <path fill="#80bb0a" d="M12 0h11v11H12z" />
                  <path fill="#00a1f1" d="M0 12h11v11H0z" />
                  <path fill="#ffb900" d="M12 12h11v11H12z" />
                </svg>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Microsoft Účet</span>
                  {linkedAccounts.find((a) => a.provider === 'microsoft') ? (
                    <span className="text-[10px] text-emerald-600 font-bold">{linkedAccounts.find((a) => a.provider === 'microsoft')?.email}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Nepropojeno</span>
                  )}
                </div>
              </div>
              {linkedAccounts.find((a) => a.provider === 'microsoft') ? (
                <button
                  type="button"
                  onClick={() => handleUnlinkAccount('microsoft')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  Odpojit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLinkMicrosoft}
                  className="text-xs font-bold text-blue-900 hover:text-blue-800 transition-colors flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl border border-slate-300 bg-white shadow-2xs cursor-pointer"
                >
                  Propojit Microsoft
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: NOTIFIKACE & UPOZORNĚNÍ --- */}

      {activeTab === 'submissions' && (
        <UserSubmissionsTab />
      )}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              E-mailové notifikace & Systémová upozornění
            </h3>
            <p className="text-xs text-slate-500">
              Přizpůsobte si, jaké e-mailové zprávy a připomínky chcete dostávat.
            </p>
          </div>

          <div className="space-y-4 max-w-lg">
            <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
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

            <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Připomínky termínů a kalendáře péče</span>
                <span className="text-[11px] text-slate-500">Upozornění na nadcházející jednání OSPOD, soudní stání a předávání dětí.</span>
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
      )}

      {/* Security Info Footnote */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 flex items-start gap-3 mt-8">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          Uživatelské účty a bezpečnostní údaje jsou šifrovány. Portál "Táta má právo" striktně chrání vaše soukromí a vaše kontakty nikdy nepředává třetím osobám.
        </p>
      </div>
    </div>
  );
};
