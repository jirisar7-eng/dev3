import dotenv from 'dotenv';
dotenv.config();

import { getPrismaClient } from '../src/db/prisma';
import { ensureSuperAdminAccount } from '../src/services/seedService';

async function main() {
  console.log('[CLI Seed Admin] Spouštím inicializaci SUPER_ADMIN účtu...');
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('[CLI Seed Admin Error] Prisma klient nebyl inicializován. Zkontrolujte DATABASE_URL v .env');
    process.exit(1);
  }

  const result = await ensureSuperAdminAccount();
  console.log('[CLI Seed Admin Výsledek]:', JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[CLI Seed Admin Error]:', e);
  process.exit(1);
});
