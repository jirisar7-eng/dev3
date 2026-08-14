import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { hash } from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`[RBAC Admin API] Načteno z DB celkem ${users.length} uživatelů.`);

    // Clean sensitive data
    const safeUsers = users.map(user => {
      const { password, totpSecret, totpTempSecret, ...safe } = user as any;
      return safe;
    });

    res.json({ 
      success: true, 
      count: safeUsers.length, 
      users: safeUsers 
    });
  } catch (err: any) {
    console.error("Error fetching users:", err);
    
    // Check if it's a database connection error
    if (err.message?.includes('momentálně nedostupná') || err.message?.includes('connection failed') || err.code?.startsWith('P1')) {
      return res.status(503).json({ 
        success: false, 
        error: "Databáze je momentálně nedostupná." 
      });
    }

    res.status(500).json({ success: false, error: "Chyba při načítání uživatelů: " + err.message });
  }
};
