import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useText } from '../../context/TextContext';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, Shield, CheckCircle2, Fingerprint, Key } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { currentUser, refreshMe, login, verifyMfa, loginWithGoogle, loginWithMicrosoft, loginWithPasskey } = useAuth();
  const { t } = useText();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // MFA verification states
  const [mfaRequired, setMfaRequired] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('mfa') === 'true';
    }
    return false;
  });
  const [mfaToken, setMfaToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | undefined>(undefined);

  // Check URL query parameters for mfa flag
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mfa') === 'true') {
        setMfaRequired(true);
        if (params.get('token')) {
          setMfaToken(params.get('token')!);
        }
      }
    }
  }, []);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') {
        onNavigate('/administrace');
      } else {
        onNavigate('/portal');
      }
    }
  }, [currentUser, onNavigate]);

  // Sync state on tab focus or OAuth message event
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      refreshMe();
    };

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_RESULT' && event.data.success) {
        refreshMe();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshMe]);

  const resetMfaState = () => {
    setMfaRequired(false);
    setMfaToken('');
    setMfaUserId(undefined);
    setMfaCode('');
    setErrorMsg(null);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('mfa') || url.searchParams.has('token')) {
        url.searchParams.delete('mfa');
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  };

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
      if (res.mfaRequired && res.mfaToken) {
        setMfaRequired(true);
        setMfaToken(res.mfaToken);
        if (res.userId) setMfaUserId(res.userId);
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
      const res = await verifyMfa(mfaToken, cleanCode, mfaUserId);
      if (res.success) {
        window.location.href = res.redirectUrl || '/portal';
        return;
      } else {
        setErrorMsg(res.error || 'Neplatný ověřovací kód.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Chyba při ověřování. Zkuste to prosím znovu.');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.mfaRequired && res.mfaToken) {
        setMfaRequired(true);
        setMfaToken(res.mfaToken);
        return;
      }
      if (res.success && res.user) {
        if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
          onNavigate('/administrace');
        } else {
          onNavigate('/portal');
        }
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepodařilo se přihlásit přes Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithMicrosoft();
      if (res.mfaRequired && res.mfaToken) {
        setMfaRequired(true);
        setMfaToken(res.mfaToken);
        return;
      }
      if (res.success && res.user) {
        if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
          onNavigate('/administrace');
        } else {
          onNavigate('/portal');
        }
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Nepodařilo se přihlásit přes Microsoft.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginWithPasskey();
      if (res.mfaRequired && res.mfaToken) {
        setMfaRequired(true);
        setMfaToken(res.mfaToken);
        return;
      }
      if (res.success && res.user) {
        if (res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN') {
          onNavigate('/administrace');
        } else {
          onNavigate('/portal');
        }
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Chyba při přihlašování bezpečnostním klíčem.');
    } finally {
      setLoading(false);
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
              onClick={resetMfaState}
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

        {/* SSO & Passkey Options */}
        <div className="space-y-4">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">Nebo</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Social SSO Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z" />
                <path fill="#80bb0a" d="M12 0h11v11H12z" />
                <path fill="#00a1f1" d="M0 12h11v11H0z" />
                <path fill="#ffb900" d="M12 12h11v11H12z" />
              </svg>
              <span>Microsoft</span>
            </button>
          </div>

          {/* Passkey Button */}
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Fingerprint className="w-4.5 h-4.5 text-blue-600" />
            <span>Přihlásit se bezpečnostním klíčem (Passkey)</span>
          </button>
        </div>

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
