import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password?: string) => Promise<AuthResult>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      // Zajišťuje načítání skutečných uživatelů z PostgreSQL DEV3 databáze
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error('Error fetching users, status:', res.status);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
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
          if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
            await fetchUsers(); // Fetch users after successful auth
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
      if (res.ok && data.user) {
        if (data.token) {
          localStorage.setItem('tatovacesta_auth_token', data.token);
        }
        setCurrentUser(data.user);
        if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
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
        if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
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
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        if (currentUser?.id === userId) {
          setCurrentUser(updated);
        }
      }
    } catch (e) {
      console.error('Role update error:', e);
    }
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!currentUser) return false;
    const roleHierarchy: Record<UserRole, number> = {
      USER: 1,
      VOLUNTEER: 2,
      MODERATOR: 3,
      ADMIN: 4,
      SUPER_ADMIN: 5,
    };
    return (roleHierarchy[currentUser.role] || 0) >= (roleHierarchy[requiredRole] || 1);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
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
