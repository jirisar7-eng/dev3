import dotenv from 'dotenv';
dotenv.config();

import { prisma, isPrismaAvailable } from '../../src/db/prisma';
import { soudyDataset } from '../../src/data/soudyDataset';
import { SoudyPopulationPipeline } from '../../src/services/dataPipeline/soudyPopulationPipeline';

export async function importFullSoudy() {
  console.log('[Import Soudy] Zahajuji import kompletního registru 107 soudů ČR a jejich ověřených profilů...');

  if (!isPrismaAvailable()) {
    console.warn('[Import Soudy] Databáze není momentálně dostupná nebo je v režimu in-memory fallback. Provádím in-memory populaci...');
    const inMemoryRes = await SoudyPopulationPipeline.populateInMemory();
    return { success: true, reason: 'InMemory populated', inMemoryRes };
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

  console.log(`[Import Soudy] Dokončen základní import: ${createdCount} soudů. Spouštím ověřenou datovou populaci profilů a zdrojů...`);
  const pipelineResult = await SoudyPopulationPipeline.populatePrisma();
  console.log('[Import Soudy] Výsledek ověřené datové populace:', pipelineResult);

  return { success: errorCount === 0, processed: createdCount, errors: errorCount, pipelineResult };
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

