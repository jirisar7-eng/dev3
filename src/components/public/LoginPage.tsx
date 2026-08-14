import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useText } from '../../context/TextContext';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, verifyMfa } = useAuth();
  const { t } = useText();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // MFA verification states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg(t('auth.login.error.emailRequired', 'Zadejte e-mailovou adresu.'));
      return;
    }
    if (!password) {
      setErrorMsg(t('auth.login.error.passwordRequired', 'Zadejte heslo.'));
      return;
    }

    setLoading(true);
    try {
      const res = await login(cleanEmail, password);
      if (res.mfaRequired && res.userId) {
        setMfaRequired(true);
        setMfaUserId(res.userId);
        return;
      }
      if (res.success && res.user) {
        if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
          onNavigate('/administrace');
        } else {
          onNavigate('/portal');
        }
      } else {
        setErrorMsg(res.error || t('auth.login.error.invalidCredentials', 'Neplatný e-mail nebo heslo.'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || t('auth.login.error.server', 'Chyba při přihlašování. Zkuste to prosím znovu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = mfaCode.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setErrorMsg('Zadejte prosím 6místný ověřovací kód.');
      return;
    }

    setMfaLoading(true);
    try {
      const res = await verifyMfa(mfaUserId, cleanCode);
      if (res.success && res.user) {
        if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
          onNavigate('/administrace');
        } else {
          onNavigate('/portal');
        }
      } else {
        setErrorMsg(res.error || 'Neplatný ověřovací kód.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Chyba při ověřování. Zkuste to prosím znovu.');
    } finally {
      setMfaLoading(false);
    }
  };

  if (mfaRequired) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-background,#f8fafc)]">
        <div className="max-w-md w-full space-y-8 bg-[var(--color-surface,#ffffff)] p-8 sm:p-10 rounded-3xl border border-[var(--color-border,#e2e8f0)] shadow-xl">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md font-extrabold text-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight">
              Dvoufázové ověření (2FA)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Tento účet je chráněn dvoufázovým ověřením. Pro dokončení přihlášení zadejte kód ze své autentizační aplikace nebo nouzový záložní kód.
            </p>
          </div>

          {/* Error Notification */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                6místný kód nebo záložní kód:
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={12}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456 / ABCDEFGH"
                className="w-full py-3 px-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-base font-mono tracking-[0.1em] text-center outline-hidden transition-all bg-slate-50/50 focus:bg-white uppercase placeholder:normal-case placeholder:tracking-normal"
              />
            </div>

            <button
              type="submit"
              disabled={mfaLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {mfaLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ověřit a přihlásit se</span>
                </>
              )}
            </button>
          </form>

          {/* Back to password link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setMfaRequired(false);
                setMfaCode('');
                setErrorMsg(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer"
            >
              ← Zpět na zadání hesla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-background,#f8fafc)]">
      <div className="max-w-md w-full space-y-8 bg-[var(--color-surface,#ffffff)] p-8 sm:p-10 rounded-3xl border border-[var(--color-border,#e2e8f0)] shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md font-extrabold text-2xl">
            T
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight">
            {t('auth.login.title', 'Přihlášení do systému')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('auth.login.subtitle', 'Zadejte své přihlašovací údaje pro přístup do portálu.')}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.login.emailLabel', 'E-mailová adresa')}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="např. admin@tatovacesta.cz"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm outline-hidden transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('auth.login.passwordLabel', 'Heslo')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm outline-hidden transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[var(--color-primary,#1e3a8a)] text-white font-bold text-sm hover:bg-blue-900 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{t('auth.login.submitButton', 'Přihlásit se')}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer & Registration Link */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs space-y-3">
          <p className="text-slate-600">
            {t('auth.login.noAccount', 'Nemáte ještě účet?')}
            <button
              onClick={() => onNavigate('/registrace')}
              className="ml-1 text-[var(--color-primary,#1e3a8a)] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>{t('auth.login.registerLink', 'Zaregistrujte se')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Bezpečné ověření skrze Prisma/PostgreSQL DB</span>
            </div>
            <p>Přihlášení vytváří bezpečný JWT token s kontrolou rolí (RBAC) na straně serveru.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
