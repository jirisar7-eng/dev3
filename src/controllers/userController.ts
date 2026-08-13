import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { hash } from 'bcryptjs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    let users = await prisma.user.findMany();

    if (users.length === 0) {
      // Auto-heal SuperAdmin
      try {
        await prisma.user.upsert({
          where: { email: 'sarji@seznam.cz' },
          update: {},
          create: {
            id: 'usr-sarji-superadmin',
            email: 'sarji@seznam.cz',
            name: 'Jiří Šár',
            role: 'SUPER_ADMIN',
            passwordHash: await hash('159753', 10),
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarji',
          },
        });
        users = await prisma.user.findMany();
      } catch (upsertError) {
        console.error("Failed to upsert superadmin:", upsertError);
      }
    }

    res.json({ users });
  } catch (err: any) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, error: "Chyba databáze: " + err.message });
  }
};
