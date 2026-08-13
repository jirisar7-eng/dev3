import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { hash } from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        isActive: true,
      }
    });

    res.json({ users });
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
