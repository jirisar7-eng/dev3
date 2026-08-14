import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  mfaRequired?: boolean;
  userId?: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  login: (email: string, password?: string) => Promise<AuthResult>;
  verifyMfa: (userId: string, code: string) => Promise<AuthResult>;
  register: (
    name: string,
    email: string,
    password?: string,
    role?: UserRole,
    profileData?: any,
    childrenData?: any[],
    consents?: any[]
  ) => Promise<AuthResult>;
  logout: () => void;
  switchUser: (user: User) => void;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  hasRole: (requiredRole: UserRole) => boolean;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_ROLES = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN'];

const canFetchUsers = (user: User | null) => {
  if (!user) return false;
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
        console.error('Error fetching users, status:', res.status, errorText);
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

  const login = async (email: string, password?: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.mfaRequired) {
        return { success: false, mfaRequired: true, userId: data.userId };
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

  const verifyMfa = async (userId: string, code: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
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
    consents?: any[]
  ): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, profileData, childrenData, consents }),
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
