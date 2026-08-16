import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { prisma, isPrismaAvailable } from '../db/prisma';

export const getUsers = async (req: Request, res: Response) => {
  try {
    let users: any[] = [];
    
    if (isPrismaAvailable()) {
      try {
        users = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (dbErr) {
        console.warn('[RBAC Admin API] Prisma direct query failed, falling back to AuthService:', dbErr);
        users = await AuthService.getUsers();
      }
    } else {
      users = await AuthService.getUsers();
    }

    console.log(`[RBAC Admin API] Načteno z DB celkem ${users.length} uživatelů.`);

    // Clean sensitive data (passwords, secrets)
    const safeUsers = users.map((user) => {
      const u = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
      delete u.password;
      delete u.passwordHash;
      delete u.totpSecret;
      delete u.totpTempSecret;
      delete u.totpBackupCodes;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status || 'ACTIVE',
        totpEnabled: !!u.totpEnabled,
        avatar: u.avatar || '',
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : (u.createdAt || new Date().toISOString()),
        updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : (u.updatedAt || new Date().toISOString()),
      };
    });

    res.json({ 
      success: true, 
      count: safeUsers.length, 
      users: safeUsers 
    });
  } catch (err: any) {
    console.error('[RBAC Admin API] Error fetching users:', err);
    
    // Check if it's a database connection error
    if (err.message?.includes('momentálně nedostupná') || err.message?.includes('connection failed') || err.code?.startsWith('P1')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Databáze je momentálně nedostupná. Zkontrolujte připojení k PostgreSQL.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Chyba při načítání uživatelů: ' + (err.message || 'Interní chyba serveru') 
    });
  }
};

