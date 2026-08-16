import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import bcrypt from 'bcryptjs';
import { hash, verify } from '@node-rs/argon2';
import { User, UserRole } from '../types';
import { UserRoleType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is missing.");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
  /**
   * Cleans sensitive security fields (passwords, TOTP secrets, backup codes)
   * before returning user objects across API endpoints.
   */
  static sanitizeUser(u: any): User {
    if (!u) return u;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as UserRole,
      status: u.status || 'ACTIVE',
      gender: u.gender || u.profile?.gender || null,
      hasChildrenInitial: u.hasChildrenInitial ?? u.profile?.hasChildrenInitial ?? false,
      totpEnabled: !!u.totpEnabled,
      avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.email || 'user')}`,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : (u.createdAt || new Date().toISOString()),
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : (u.updatedAt || new Date().toISOString()),
      profile: u.profile,
    };
  }

  static generateToken(user: { id: string; role: string }, mfaVerified = false): string {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        mfaVerified,
      },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );
  }

  static generateMfaToken(userId: string): string {
    return jwt.sign(
      {
        sub: userId,
        type: 'mfa_pending',
      },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' }
    );
  }

  static verifyMfaToken(mfaToken: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(mfaToken, JWT_SECRET, { algorithms: ['HS256'] }) as any;
      if (decoded && decoded.type === 'mfa_pending' && decoded.sub) {
        return { userId: decoded.sub };
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  static async login(email: string, password?: string): Promise<{ token?: string; user?: User; mfaRequired?: boolean; mfaToken?: string } | null> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return null;
    }

    if (isPrismaAvailable()) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (!user) {
          console.log("[AUTH ERROR] Uživatel nenalezen:", cleanEmail);
          return null;
        }

        if (user.status === 'SUSPENDED') {
          throw new Error('Účet je pozastaven.');
        }

        if (user.passwordHash) {
          let isMatch = false;
          try {
            isMatch = await verify(user.passwordHash, password);
          } catch (argonErr) {
            try {
              isMatch = await bcrypt.compare(password, user.passwordHash);
            } catch (bcryptErr) {
              const pbkdf2Hash = crypto.pbkdf2Sync(password, 'tatovacesta_salt_2026', 1000, 64, 'sha512').toString('hex');
              isMatch = (user.passwordHash === pbkdf2Hash);
            }
          }
          if (!isMatch) {
            console.log("[AUTH ERROR] Nesprávné heslo pro:", cleanEmail);
            return null;
          }

          // If matched using legacy hash (bcrypt or PBKDF2), transparently upgrade hash to Argon2id
          if (!user.passwordHash.startsWith('$argon2id$')) {
            try {
              const upgradedHash = await hash(password);
              await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: upgradedHash },
              });
              console.log("[AUTH INFO] Upgraded user password hash to Argon2id for:", cleanEmail);
            } catch (upgradeErr) {
              console.warn('[AUTH WARN] Failed to upgrade password hash to Argon2id:', upgradeErr);
            }
          }
        }

        // Record Audit Log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            userEmail: user.email,
            action: 'USER_LOGIN',
            module: 'AUTH',
            details: `Uživatel ${user.email} se přihlásil do systému.`,
          },
        });

        console.log("[AUTH OK] Přihlášen uživatel:", cleanEmail);

        // If 2FA is enabled, do NOT issue session JWT yet! Issue short-lived mfaToken instead.
        if (user.totpEnabled) {
          const mfaToken = AuthService.generateMfaToken(user.id);
          return { mfaRequired: true, mfaToken, user: AuthService.sanitizeUser(user) };
        }

        const token = AuthService.generateToken(user, false);
        return { token, user: AuthService.sanitizeUser(user) };
      } catch (err: any) {
        if (err.message === 'Účet je pozastaven.') throw err;
        console.error('[Prisma Auth Error] Database error during login:', err);
        // Fail securely when DB error occurs (P0-16: DB unavailable -> 503/error, NOT fallback user login success)
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    // Fallback in-memory ONLY if Prisma is explicitly not initialized/available
    let user = dbStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) return null;

    if (user.status === 'SUSPENDED') {
      throw new Error('Účet je pozastaven.');
    }

    dbStore.logAudit('USER_LOGIN', 'AUTH', `Uživatel ${user.email} se přihlásil do systému.`, user);

    if (user.totpEnabled) {
      const mfaToken = AuthService.generateMfaToken(user.id);
      return { mfaRequired: true, mfaToken, user: AuthService.sanitizeUser(user) };
    }

    const token = AuthService.generateToken(user, false);
    return { token, user: AuthService.sanitizeUser(user) };
  }

  static async register(
    name: string,
    email: string,
    password?: string,
    profileData?: {
      firstName?: string;
      lastName?: string;
      birthDate?: string;
      gender?: string;
      hasChildrenInitial?: boolean;
      phone?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      autoFillDocs?: boolean;
    },
    childrenData?: Array<{ name?: string; firstName?: string; lastName?: string; birthDate?: string; isStudying?: boolean; notes?: string }>,
    gender?: string,
    hasChildrenInitial?: boolean
  ): Promise<{ token: string; user: User }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw new Error('Zadejte platnou e-mailovou adresu.');
    }

    if (!password || password.length < 6) {
      throw new Error('Heslo musí mít minimálně 6 znaků.');
    }

    if (profileData?.phone) {
      const phoneClean = profileData.phone.replace(/\s+/g, '');
      const phoneRegex = /^(\+?[0-9]{9,15})$/;
      if (!phoneRegex.test(phoneClean)) {
        throw new Error('Zadejte platné telefonní číslo (např. +420777123456).');
      }
    }

    if (profileData?.postalCode) {
      const pscClean = profileData.postalCode.replace(/\s+/g, '');
      if (!/^[0-9]{5}$/.test(pscClean)) {
        throw new Error('PSČ musí obsahovat 5 číslic (např. 11000).');
      }
    }

    const userRole: UserRoleType = 'USER';
    const passwordHash = await hash(password);
    const displayName = (name || '').trim() || (profileData?.firstName ? `${profileData.firstName} ${profileData.lastName || ''}`.trim() : cleanEmail.split('@')[0]);

    const finalGender = gender || profileData?.gender || 'MALE';
    const finalHasChildren = hasChildrenInitial ?? profileData?.hasChildrenInitial ?? (Array.isArray(childrenData) && childrenData.length > 0);

    if (isPrismaAvailable()) {
      try {
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing) {
          throw new Error('Uživatel s tímto e-mailem již existuje.');
        }

        const newUser = await prisma.user.create({
          data: {
            name: displayName,
            email: cleanEmail,
            passwordHash,
            gender: finalGender,
            hasChildrenInitial: finalHasChildren,
            role: userRole,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
          },
        });

        await (prisma as any).userProfile.create({
          data: {
            userId: newUser.id,
            firstName: profileData?.firstName || null,
            lastName: profileData?.lastName || null,
            birthDate: profileData?.birthDate || null,
            gender: finalGender,
            hasChildrenInitial: finalHasChildren,
            phone: profileData?.phone || null,
            address: profileData?.address || null,
            city: profileData?.city || null,
            postalCode: profileData?.postalCode || null,
            autoFillDocs: profileData?.autoFillDocs ?? true,
          },
        });

        if (Array.isArray(childrenData) && childrenData.length > 0) {
          for (const child of childrenData) {
            if (child.name || child.firstName) {
              const fullName = child.name || `${child.firstName || ''} ${child.lastName || ''}`.trim();
              await (prisma as any).userChild.create({
                data: {
                  userId: newUser.id,
                  name: fullName,
                  firstName: child.firstName || null,
                  lastName: child.lastName || null,
                  birthDate: child.birthDate || null,
                  isStudying: child.isStudying ?? false,
                  notes: child.notes || null,
                },
              });
            }
          }
        }

        await prisma.auditLog.create({
          data: {
            userId: newUser.id,
            userEmail: newUser.email,
            action: 'USER_REGISTER',
            module: 'AUTH',
            details: `Úspěšně dokončena nová registrace uživatele.`,
          },
        });

        const token = AuthService.generateToken(newUser, false);
        return { token, user: AuthService.sanitizeUser(newUser) };
      } catch (err: any) {
        if (err.message?.includes('existuje') || err.message?.includes('heslo') || err.message?.includes('e-mail') || err.message?.includes('telefonní') || err.message?.includes('PSČ')) {
          throw err;
        }
        console.error('Prisma register error:', err);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    const existing = dbStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Uživatel s tímto e-mailem již existuje.');
    }

    const newUser: User = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      name: displayName,
      role: 'USER',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.users.push(newUser);
    dbStore.logAudit('USER_REGISTER', 'AUTH', `Registrován nový uživatel.`, newUser);

    const token = AuthService.generateToken(newUser, false);
    return { token, user: AuthService.sanitizeUser(newUser) };
  }

  static async getUsers(): Promise<User[]> {
    if (isPrismaAvailable()) {
      try {
        const users = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return users.map((u) => AuthService.sanitizeUser(u));
      } catch (err) {
        console.error('Prisma getUsers error:', err);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }
    return dbStore.users.map((u) => AuthService.sanitizeUser(u));
  }

  static async getUserById(id: string): Promise<User | null> {
    if (isPrismaAvailable()) {
      try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (u) {
          return AuthService.sanitizeUser(u);
        }
        return null;
      } catch (err) {
        console.error('getUserById error:', err);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }
    const found = dbStore.users.find((u) => u.id === id);
    return found ? AuthService.sanitizeUser(found) : null;
  }

  static async updateUserRole(userId: string, newRole: UserRole, adminUser?: User | null): Promise<User> {
    // RBAC Guard
    if (!adminUser) {
      throw new Error('Přístup odepřen: Chybí identifikace administrátora.');
    }

    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Přístup odepřen: Nedostatečné oprávnění.');
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (newRole === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Přístup odepřen: Pouze SUPER_ADMIN může udělit roli SUPER_ADMIN.');
    }

    if (isPrismaAvailable()) {
      try {
        const target = await prisma.user.findUnique({ where: { id: userId } });
        if (!target) throw new Error('Uživatel nenalezen');

        // ADMIN cannot modify a SUPER_ADMIN
        if (target.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
          throw new Error('Přístup odepřen: Administrátor nemůže upravovat účet SUPER_ADMIN.');
        }

        const updated = await prisma.user.update({
          where: { id: userId },
          data: { role: newRole as UserRoleType },
        });

        await prisma.auditLog.create({
          data: {
            userId: adminUser.id,
            userEmail: adminUser.email,
            action: 'ROLE_CHANGE',
            module: 'RBAC',
            details: `Změna role uživatele ${updated.email} na ${newRole}.`,
          },
        });

        return AuthService.sanitizeUser(updated);
      } catch (err: any) {
        if (err.message?.includes('Přístup') || err.message?.includes('nenalezen')) throw err;
        console.error('Prisma updateUserRole error:', err);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    const user = dbStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('Uživatel nenalezen');

    if (user.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Přístup odepřen: Administrátor nemůže upravovat účet SUPER_ADMIN.');
    }

    const oldRole = user.role;
    user.role = newRole;
    user.updatedAt = new Date().toISOString();

    dbStore.logAudit('ROLE_CHANGE', 'RBAC', `Změna role uživatele ${user.email} z ${oldRole} na ${newRole}.`, adminUser);
    return AuthService.sanitizeUser(user);
  }

  static async getRoles() {
    if (isPrismaAvailable()) {
      try {
        return await prisma.role.findMany({
          include: { rolePermissions: { include: { permission: true } } },
        });
      } catch (err) {
        console.warn('Prisma getRoles error:', err);
      }
    }
    return [
      { key: 'SUPER_ADMIN', name: 'Super Admin', description: 'Plný systémový přístup do všech vrstev' },
      { key: 'ADMIN', name: 'Administrátor', description: 'Správa obsahu, uživatelů a nastavení' },
      { key: 'MODERATOR', name: 'Moderátor', description: 'Moderace příspěvků a poradny' },
      { key: 'VOLUNTEER', name: 'Dobrovolník', description: 'Mentoring a pomoc tátům' },
      { key: 'USER', name: 'Uživatel', description: 'Běžný registrovaný uživatel' },
    ];
  }

  static async getPermissions() {
    if (isPrismaAvailable()) {
      try {
        return await prisma.permission.findMany({ orderBy: { category: 'asc' } });
      } catch (err) {
        console.warn('Prisma getPermissions error:', err);
      }
    }
    return [
      { key: 'cms:manage', name: 'Správa CMS', category: 'CMS' },
      { key: 'user:manage', name: 'Správa uživatelů', category: 'AUTH' },
      { key: 'theme:manage', name: 'Správa témat', category: 'THEME' },
      { key: 'module:manage', name: 'Správa modulů', category: 'MODULE' },
      { key: 'compliance:manage', name: 'Správa compliance', category: 'COMPLIANCE' },
      { key: 'system:config', name: 'Konfigurace systému', category: 'SYSTEM' },
    ];
  }

  static async updateUser(userId: string, data: Partial<User>, adminUser?: User | null): Promise<User> {
    if (!adminUser) {
      throw new Error('Přístup odepřen: Chybí identifikace administrátora.');
    }

    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Přístup odepřen: Nedostatečné oprávnění.');
    }

    if (data.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Přístup odepřen: Pouze SUPER_ADMIN může udělit roli SUPER_ADMIN.');
    }

    if (isPrismaAvailable()) {
      try {
        const target = await prisma.user.findUnique({ where: { id: userId } });
        if (!target) throw new Error('Uživatel nenalezen');

        if (target.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
          throw new Error('Přístup odepřen: Administrátor nemůže upravovat účet SUPER_ADMIN.');
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email.toLowerCase();
        if (data.role !== undefined) updateData.role = data.role as UserRoleType;

        const updated = await prisma.user.update({
          where: { id: userId },
          data: updateData,
        });

        await prisma.auditLog.create({
          data: {
            userId: adminUser.id,
            userEmail: adminUser.email,
            action: 'USER_UPDATE',
            module: 'RBAC',
            details: `Aktualizace údajů uživatele ${updated.email}.`,
          },
        });

        return AuthService.sanitizeUser(updated);
      } catch (err: any) {
        if (err.message?.includes('Přístup') || err.message?.includes('nenalezen')) throw err;
        console.error('Prisma updateUser error:', err);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    const user = dbStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('Uživatel nenalezen');

    if (user.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Přístup odepřen: Administrátor nemůže upravovat účet SUPER_ADMIN.');
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email.toLowerCase();
    if (data.role !== undefined) user.role = data.role;
    user.updatedAt = new Date().toISOString();

    dbStore.logAudit('USER_UPDATE', 'RBAC', `Aktualizace údajů uživatele ${user.email}.`, adminUser);
    return AuthService.sanitizeUser(user);
  }

  static async deleteUser(userId: string, adminUser?: User | null): Promise<boolean> {
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Přístup odepřen.');
    }

    if (userId === adminUser.id) {
      throw new Error('Uživatel nemůže smazat sám sebe.');
    }

    if (isPrismaAvailable()) {
      try {
        const target = await prisma.user.findUnique({ where: { id: userId } });
        if (!target) throw new Error('Uživatel nenalezen');

        if (target.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
          throw new Error('Přístup odepřen: Administrátor nemůže smazat účet SUPER_ADMIN.');
        }

        await prisma.user.delete({
          where: { id: userId },
        });

        await prisma.auditLog.create({
          data: {
            userId: adminUser.id,
            userEmail: adminUser.email,
            action: 'USER_DELETE',
            module: 'RBAC',
            details: `Smazání uživatele s ID ${userId}.`,
          },
        });

        return true;
      } catch (err: any) {
        if (err.message?.includes('Přístup') || err.message?.includes('smazat') || err.message?.includes('nenalezen')) throw err;
        console.error('Prisma deleteUser error:', err);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    const idx = dbStore.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('Uživatel nenalezen');

    if (dbStore.users[idx].role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Přístup odepřen: Administrátor nemůže smazat účet SUPER_ADMIN.');
    }

    dbStore.users.splice(idx, 1);
    dbStore.logAudit('USER_DELETE', 'RBAC', `Smazání uživatele s ID ${userId}.`, adminUser);
    return true;
  }

  static async adminResetPassword(userId: string, adminUser: User): Promise<string> {
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Přístup odepřen.');
    }

    if (isPrismaAvailable()) {
      const target = await prisma.user.findUnique({ where: { id: userId } });
      if (!target) throw new Error('Uživatel nenalezen');

      if (target.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
        throw new Error('Přístup odepřen: Administrátor nemůže resetovat heslo účtu SUPER_ADMIN.');
      }
    }

    // Kryptograficky bezpečné generování hesla o délce 12 znaků
    const newPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    const passwordHash = await hash(newPassword);

    if (isPrismaAvailable()) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash },
        });

        await prisma.auditLog.create({
          data: {
            userId: adminUser.id,
            userEmail: adminUser.email,
            action: 'PASSWORD_RESET',
            module: 'RBAC',
            details: `Administrátorský reset hesla pro uživatele ${userId}.`,
          },
        });
      } catch (err) {
        console.error('Prisma resetPassword error:', err);
        throw new Error('Chyba při resetu hesla v databázi.');
      }
    } else {
      const user = dbStore.users.find((u) => u.id === userId);
      if (!user) throw new Error('Uživatel nenalezen');
      (user as any).passwordHash = passwordHash;
      dbStore.logAudit('PASSWORD_RESET', 'RBAC', `Administrátorský reset hesla pro uživatele ${userId}.`, adminUser);
    }

    return newPassword;
  }

  static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
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

    return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 1);
  }
}
