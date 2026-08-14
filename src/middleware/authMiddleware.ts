import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { User, UserRole } from '../types';
import { prisma } from '../db/prisma';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  session?: {
    userId?: string;
    regenerate?: () => void;
    destroy?: () => void;
  };
  user?: User;
}

export async function parseAuthToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let userId: string | undefined = undefined;

  // 1. Try Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, { algorithms: ['HS256'] }) as any;
        if (decoded && (decoded.sub || decoded.userId || decoded.id)) {
          userId = decoded.sub || decoded.userId || decoded.id;
        }
      } catch (err) {
        // Token invalid or expired - do NOT set userId
      }
    }
  }

  // 2. Try signed or regular HttpOnly cookie if no Bearer token
  if (!userId) {
    const cookieToken = (req.signedCookies && req.signedCookies.token) || 
                        (req.cookies && req.cookies.token) || 
                        (req.signedCookies && req.signedCookies.userId) ||
                        (req.cookies && req.cookies.userId);
    if (cookieToken) {
      try {
        const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET as string, { algorithms: ['HS256'] }) as any;
        if (decoded && (decoded.sub || decoded.userId || decoded.id)) {
          userId = decoded.sub || decoded.userId || decoded.id;
        } else {
          // If cookieToken was directly a userId string (legacy cookie), resolve user
          userId = cookieToken;
        }
      } catch (err) {
        // If cookieToken was raw userId string without JWT wrap
        if (typeof cookieToken === 'string' && cookieToken.length < 100) {
          userId = cookieToken;
        }
      }
    }
  }

  // NOTE: x-user-id header is explicitly IGNORED for identity resolution.

  req.session = {
    userId,
    regenerate: () => {
      res.clearCookie('userId');
      res.clearCookie('token');
    },
    destroy: () => {
      res.clearCookie('userId');
      res.clearCookie('token');
      if (req.session) {
        req.session.userId = undefined;
      }
    }
  };

  if (userId) {
    try {
      const user = await AuthService.getUserById(userId);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.error('Error in parseAuthToken database query:', err);
    }
  }
  next();
}

const ROLES_REQUIRING_MFA = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'CONTENT_MANAGER', 'LEGAL_EDITOR', 'MODERATOR', 'ADMIN'];

function checkUserStatusAndMfa(user: User, req: Request, res: Response): boolean {
  // 1. Account status check
  if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
    res.status(403).json({ error: 'Přístup odepřen. Váš účet byl zablokován nebo pozastaven.' });
    return false;
  }

  // 2. MFA requirement check for administrative roles (except during MFA configuration/me routes)
  const isMfaSetupRoute = req.path.includes('/2fa/') || req.path.includes('/me') || req.path.includes('/logout') || req.path.includes('/profile');

  // Only allow explicit ALLOW_AUTH_BYPASS flag in non-production environments
  const isExplicitBypassAllowed = process.env.NODE_ENV !== 'production' && process.env.ALLOW_AUTH_BYPASS === 'true';

  if (ROLES_REQUIRING_MFA.includes(user.role) && !user.totpEnabled && !isMfaSetupRoute) {
    if (isExplicitBypassAllowed) {
      console.warn('[Auth] Explicit ALLOW_AUTH_BYPASS active for ' + user.email);
    } else {
      res.status(403).json({
        code: 'MFA_REQUIRED',
        error: 'Tato role vyžaduje aktivní dvoufázové ověření (2FA). Chcete-li pokračovat, aktivujte si 2FA v nastavení zabezpečení profilu.',
      });
      return false;
    }
  }

  return true;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Neautorizovaný přístup. Je vyžadováno přihlášení.' });
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Neautorizovaný přístup. Uživatel nebyl nalezen v databázi.' });
  }
  if (!checkUserStatusAndMfa(req.user, req, res)) {
    return;
  }
  next();
}

export function requireRole(minRole: UserRole) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.session?.userId;
    if (!userId || !req.user) {
      return res.status(401).json({ error: 'Neautorizovaný přístup. Přihlaste se prosím.' });
    }

    try {
      const dbUser = await AuthService.getUserById(userId);
      if (!dbUser) {
        return res.status(401).json({ error: 'Uživatel nebyl nalezen v databázi.' });
      }

      if (!checkUserStatusAndMfa(dbUser, req, res)) {
        return;
      }

      if (!AuthService.hasPermission(dbUser.role, minRole)) {
        return res.status(403).json({
          error: `Přístup odepřen. Vyžadována role minimálně '${minRole}', vaše role je '${dbUser.role}'.`,
        });
      }

      req.user = dbUser;
      next();
    } catch (err) {
      console.error('Error in requireRole database query:', err);
      return res.status(500).json({ error: 'Chyba při verifikaci role v databázi.' });
    }
  };
}

export function requirePermission(permissionKey: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.session?.userId;
    if (!userId || !req.user) {
      return res.status(401).json({ error: 'Neautorizovaný přístup. Přihlaste se prosím.' });
    }

    try {
      const dbUser = await AuthService.getUserById(userId);
      if (!dbUser) {
        return res.status(401).json({ error: 'Uživatel nebyl nalezen v databázi.' });
      }

      if (!checkUserStatusAndMfa(dbUser, req, res)) {
        return;
      }

      if (dbUser.role === 'SUPER_ADMIN') {
        req.user = dbUser;
        return next();
      }

      if (prisma) {
        const hasPerm = await (prisma as any).rolePermission.findFirst({
          where: {
            role: {
              key: dbUser.role
            },
            permission: {
              key: permissionKey
            }
          }
        });

        if (!hasPerm) {
          return res.status(403).json({
            error: `Přístup odepřen. Vyžadováno oprávnění '${permissionKey}'.`,
          });
        }
      }

      req.user = dbUser;
      next();
    } catch (err) {
      console.error('Error in requirePermission database query:', err);
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
        return next();
      }
      return res.status(403).json({ error: `Přístup odepřen. Vyžadováno oprávnění '${permissionKey}'.` });
    }
  };
}
