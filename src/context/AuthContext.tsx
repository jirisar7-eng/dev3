import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  mfaRequired?: boolean;
  userId?: string;
  mfaToken?: string;
  redirectUrl?: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  login: (email: string, password?: string) => Promise<AuthResult>;
  verifyMfa: (mfaToken: string, code: string, userId?: string) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password?: string,
    role?: UserRole,
    profileData?: any,
    childrenData?: any[],
    consents?: any[],
    gender?: string,
    hasChildrenInitial?: boolean
  ) => Promise<AuthResult>;
  logout: () => void;
  switchUser: (user: User) => void;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  hasRole: (requiredRole: UserRole) => boolean;
  refreshMe: () => Promise<void>;
  loginWithGoogle: () => Promise<AuthResult>;
  loginWithMicrosoft: () => Promise<AuthResult>;
  registerPasskey: (name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPasskey: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_ROLES = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN'];
const ROLES_REQUIRING_MFA = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'CONTENT_MANAGER', 'LEGAL_EDITOR', 'MODERATOR', 'ADMIN'];

const canFetchUsers = (user: User | null) => {
  if (!user) return false;
  if (ROLES_REQUIRING_MFA.includes(user.role) && !user.totpEnabled) return false;
  return ADMIN_ROLES.includes(user.role);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        // Zabrání ztrátě dat při parsování odpovědi API
        const usersList = data?.users || data?.data || (Array.isArray(data) ? data : []);
        setUsers(usersList);
      } else {
        const errJson = await res.json().catch(() => null);
        const errorText = errJson?.error || `Chyba ${res.status}: ${res.statusText}`;
        setError(errorText);
        if (res.status === 403) {
          console.warn('[AuthContext] Načtení uživatelů odepřeno (403):', errorText);
        } else {
          console.error('Error fetching users, status:', res.status, errorText);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Chyba při komunikaci se serverem');
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshMe = async () => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          if (canFetchUsers(data.user)) {
            await fetchUsers(); // Fetch users after successful auth if permitted
          }
          return;
        }
      }
      setCurrentUser(null);
    } catch (e) {
      console.error('Error refreshing session:', e);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  useEffect(() => {
    const handle401 = () => {
      if (currentUser) {
        console.warn('Received 401 globally, clearing user context...');
        setCurrentUser(null);
        localStorage.removeItem('tatovacesta_auth_token');
      }
    };
    window.addEventListener('auth_401_error', handle401);
    return () => window.removeEventListener('auth_401_error', handle401);
  }, [currentUser]);


  // Automatické odhlášení při nečinnosti uživatele (30 minut)
  useEffect(() => {
    if (!currentUser) return;

    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minut nečinnosti
    let timeoutId: ReturnType<typeof setTimeout>;
    let lastReset = Date.now();

    const resetTimer = () => {
      const now = Date.now();
      // Omezení četnosti resetování na max. 1x za 2 sekundy pro vysoký výkon
      if (now - lastReset < 2000 && timeoutId) {
        return;
      }
      lastReset = now;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn('[AuthContext] Uživatel byl automaticky odhlášen z důvodu nečinnosti.');
        logout();
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    resetTimer();
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser]);

  const login = async (email: string, password?: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.mfaRequired) {
        return { success: false, mfaRequired: true, mfaToken: data.mfaToken, userId: data.userId };
      }
      if (res.ok && data.user) {
        if (data.token) {
          localStorage.setItem('tatovacesta_auth_token', data.token);
        }
        setCurrentUser(data.user);
        if (canFetchUsers(data.user)) {
          await fetchUsers();
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Neplatný e-mail nebo heslo.' };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: e.message || 'Chyba při přihlášení.' };
    }
  };

  const verifyMfa = async (mfaToken: string, code: string, userId?: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code, userId }),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.ok)) {
        if (data.token) {
          localStorage.setItem('tatovacesta_auth_token', data.token);
        }
        if (data.user) {
          setCurrentUser(data.user);
          if (canFetchUsers(data.user)) {
            await fetchUsers();
          }
        }
        return { success: true, user: data.user, redirectUrl: data.redirectUrl };
      }
      return { success: false, error: data.error || 'Neplatný ověřovací kód.' };
    } catch (e: any) {
      console.error('MFA verification error:', e);
      return { success: false, error: e.message || 'Chyba při ověřování kódu.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password?: string,
    role: UserRole = 'USER',
    profileData?: any,
    childrenData?: any[],
    consents?: any[],
    gender?: string,
    hasChildrenInitial?: boolean
  ): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, profileData, childrenData, consents, gender, hasChildrenInitial }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) {
          localStorage.setItem('tatovacesta_auth_token', data.token);
        }
        setCurrentUser(data.user);
        if (canFetchUsers(data.user)) {
          await fetchUsers();
        }
        return { success: true, user: data.user };
      } else {
        throw new Error(data.error || 'Registrace selhala.');
      }
    } catch (e: any) {
      console.error('Register error:', e);
      throw e;
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('tatovacesta_auth_token');
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role || role } : u)));
        if (currentUser?.id === userId) {
          setCurrentUser((prev) => (prev ? { ...prev, role: updated.role || role } : null));
        }
      } else {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Změna role selhala');
      }
    } catch (e) {
      console.error('Role update error:', e);
      throw e;
    }
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!currentUser) return false;
    const roleHierarchy: Record<string, number> = {
      USER: 1,
      REGISTERED_USER: 1,
      VERIFIED_USER: 2,
      VOLUNTEER: 3,
      VERIFIED_CONTRIBUTOR: 3,
      MODERATOR: 4,
      LEGAL_EDITOR: 4,
      CONTENT_MANAGER: 4,
      SYSTEM_ADMIN: 5,
      ADMIN: 5,
      SUPER_ADMIN: 6,
    };
    return (roleHierarchy[currentUser.role] || 0) >= (roleHierarchy[requiredRole] || 1);
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileUa || (isTouch && isSmallScreen);
  };

  const runOauthPopup = (urlEndpoint: string): Promise<AuthResult> => {
    // 1. On mobile devices, avoid popups completely and use direct full-page redirection
    if (isMobileDevice()) {
      const directUrl = urlEndpoint.endsWith('/url') ? urlEndpoint.slice(0, -4) : urlEndpoint;
      window.location.href = directUrl;
      return new Promise<AuthResult>(() => {});
    }

    // 2. On desktop, open popup with message listener and active status polling fallback
    return new Promise(async (resolve) => {
      let popup: Window | null = null;
      let isResolved = false;

      const safeResolve = (val: AuthResult) => {
        if (isResolved) return;
        isResolved = true;
        resolve(val);
      };

      try {
        const res = await fetch(urlEndpoint);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          return safeResolve({ success: false, error: data?.error || 'Nepodařilo se inicializovat přihlášení.' });
        }
        const { url } = await res.json();
        
        popup = window.open(url, 'oauth_popup', 'width=600,height=700,status=yes,scrollbars=yes');
        if (!popup) {
          // If popup is blocked by browser popup blocker, redirect directly in current window
          window.location.href = urlEndpoint.endsWith('/url') ? urlEndpoint.slice(0, -4) : urlEndpoint;
          return;
        }
      } catch (err: any) {
        return safeResolve({ success: false, error: err.message || 'Nepodařilo se inicializovat přihlášení.' });
      }

      const checkAuthStatus = async (): Promise<User | null> => {
        try {
          const token = localStorage.getItem('tatovacesta_auth_token');
          const res = await fetch('/api/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              return data.user;
            }
          }
        } catch (e) {
          // non-blocking
        }
        return null;
      };

      const handleMessage = async (event: MessageEvent) => {
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_RESULT') {
          cleanup();
          if (popup && !popup.closed) popup.close();

          const result = event.data;
          if (result.success) {
            if (result.mfaRequired) {
              return safeResolve({ success: false, mfaRequired: true, mfaToken: result.mfaToken });
            }
            if (result.token) {
              localStorage.setItem('tatovacesta_auth_token', result.token);
            }
            if (result.user) {
              setCurrentUser(result.user);
              if (canFetchUsers(result.user)) {
                await fetchUsers();
              }
            }
            return safeResolve({ success: true, user: result.user });
          } else {
            return safeResolve({ success: false, error: result.error || 'Přihlášení selhalo.' });
          }
        }
      };

      window.addEventListener('message', handleMessage);

      let elapsedSeconds = 0;
      const timer = setInterval(async () => {
        elapsedSeconds += 1;

        // Check if popup closed by user or completed
        if (!popup || popup.closed) {
          cleanup();
          const user = await checkAuthStatus();
          if (user) {
            setCurrentUser(user);
            if (canFetchUsers(user)) {
              await fetchUsers();
            }
            return safeResolve({ success: true, user });
          }
          return safeResolve({ success: false, error: 'Přihlašovací okno bylo zavřeno.' });
        }

        // Active polling every 2 seconds while popup is open
        if (elapsedSeconds % 2 === 0) {
          const user = await checkAuthStatus();
          if (user) {
            cleanup();
            if (popup && !popup.closed) popup.close();
            setCurrentUser(user);
            if (canFetchUsers(user)) {
              await fetchUsers();
            }
            return safeResolve({ success: true, user });
          }
        }

        // Timeout after 120 seconds
        if (elapsedSeconds > 120) {
          cleanup();
          if (popup && !popup.closed) popup.close();
          return safeResolve({ success: false, error: 'Časový limit pro přihlášení vypršel.' });
        }
      }, 1000);

      const cleanup = () => {
        clearInterval(timer);
        window.removeEventListener('message', handleMessage);
      };
    });
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    return runOauthPopup('/api/auth/google/url');
  };

  const loginWithMicrosoft = async (): Promise<AuthResult> => {
    return runOauthPopup('/api/auth/microsoft/url');
  };

  const registerPasskey = async (name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/auth/passkey/register/options', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        return { success: false, error: err?.error || 'Nelze vygenerovat možnosti registrace.' };
      }

      const options = await res.json();
      const credential = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch('/api/auth/passkey/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...credential, name }),
      });

      if (verifyRes.ok) {
        return { success: true };
      } else {
        const err = await verifyRes.json().catch(() => null);
        return { success: false, error: err?.error || 'Ověření klíče selhalo.' };
      }
    } catch (err: any) {
      console.error('Passkey registration error:', err);
      return { success: false, error: err.message || 'Registrace klíče selhala.' };
    }
  };

  const loginWithPasskey = async (): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/passkey/login/options', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        return { success: false, error: err?.error || 'Nelze načíst výzvu pro bezpečnostní klíč.' };
      }

      const options = await res.json();
      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch('/api/auth/passkey/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assertion),
      });

      const data = await verifyRes.json();
      if (data.mfaRequired) {
        return { success: false, mfaRequired: true, mfaToken: data.mfaToken };
      }

      if (verifyRes.ok && data.user) {
        if (data.token) {
          localStorage.setItem('tatovacesta_auth_token', data.token);
        }
        setCurrentUser(data.user);
        if (canFetchUsers(data.user)) {
          await fetchUsers();
        }
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || 'Ověření bezpečnostního klíče selhalo.' };
    } catch (err: any) {
      console.error('Passkey login error:', err);
      return { success: false, error: err.message || 'Chyba při přihlašování bezpečnostním klíčem.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        error,
        fetchUsers,
        login,
        verifyMfa,
        register,
        logout,
        switchUser,
        updateUserRole,
        hasRole,
        refreshMe,
        loginWithGoogle,
        loginWithMicrosoft,
        registerPasskey,
        loginWithPasskey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
