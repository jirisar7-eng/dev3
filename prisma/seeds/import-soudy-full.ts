import dotenv from 'dotenv';
dotenv.config();

import { prisma, isPrismaAvailable } from '../../src/db/prisma';
import { soudyDataset } from '../../src/data/soudyDataset';

export async function importFullSoudy() {
  console.log('[Import Soudy] Zahajuji import kompletního registru 109 soudů ČR...');

  if (!isPrismaAvailable()) {
    console.warn('[Import Soudy] Databáze není momentálně dostupná nebo je v režimu in-memory fallback. SQL zápis vynechán.');
    return { success: false, reason: 'Database unavailable' };
  }

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const s of soudyDataset) {
    try {
      // Každý soud má v našem datasetu unikátní email podatelny, což je ideální pro @unique upsert klíč.
      await prisma.subjekt.upsert({
        where: { email: s.email },
        update: {
          type: 'SOUD',
          name: s.name,
          titleBefore: s.titleBefore,
          position: s.position,
          institution: s.institution,
          city: s.city,
          region: s.region,
          address: s.address,
          phone: s.phone,
          website: s.website,
          isVerified: s.isVerified,
          lat: s.lat,
          lng: s.lng,
          status: 'VERIFIED'
        },
        create: {
          type: 'SOUD',
          name: s.name,
          titleBefore: s.titleBefore,
          position: s.position,
          institution: s.institution,
          city: s.city,
          region: s.region,
          address: s.address,
          email: s.email,
          phone: s.phone,
          website: s.website,
          isVerified: s.isVerified,
          lat: s.lat,
          lng: s.lng,
          avgRating: 0.0,
          reviewCount: 0,
          status: 'VERIFIED'
        }
      });
      createdCount++;
    } catch (err: any) {
      console.error(`[Import Soudy Error] Selhal import soudu: ${s.name}`, err?.message || err);
      errorCount++;
    }
  }

  console.log(`[Import Soudy] Dokončeno. Úspěšně zpracováno: ${createdCount} soudů, chyby: ${errorCount}.`);
  return { success: errorCount === 0, processed: createdCount, errors: errorCount };
}

// Podpora přímého spuštění přes tsx
if (process.argv[1]?.endsWith('import-soudy-full.ts') || process.argv[1]?.endsWith('import-soudy-full.js')) {
  importFullSoudy()
    .then((res) => {
      console.log('[Import Soudy CLI] Hotovo.', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Import Soudy CLI Error]:', err);
      process.exit(1);
    });
}
