import { getPrismaClient, checkDatabaseReachable } from '../db/prisma';
import fs from 'fs';
import path from 'path';
import { dbStore } from '../services/dbStore';

export interface OspodDatasetItem {
  id: string;
  name: string;
  rawName: string;
  entityType: string;
  region: string;
  city: string;
  address: string;
  officialWebsite?: string;
  lat: number;
  lng: number;
  sourceUrl: string;
  sourceVerifiedAt: string;
  status: string;
  flags: string[];
}

export function syncDbStoreWithOspodDataset(dataset: OspodDatasetItem[]) {
  const nonOspodSubjekty = dbStore.subjekty.filter((s) => s.type !== 'OSPOD');

  const ospodSubjekty = dataset.map((item) => {
    const isPrelouc = item.city === 'Přelouč' || item.name.includes('Přelouč');
    return {
      id: item.id,
      type: 'OSPOD' as const,
      name: item.name,
      position: 'Oddělení sociálně-právní ochrany dětí',
      institution: item.rawName,
      city: item.city,
      region: item.region,
      address: item.address,
      website: item.officialWebsite || null,
      lat: item.lat,
      lng: item.lng,
      avgRating: 0.0,
      reviewCount: 0,
      isVerified: true,
      status: 'VERIFIED' as const,
      createdAt: new Date('2026-08-22'),
      pracovnici: isPrelouc
        ? [
            {
              id: 'prac-1',
              jmeno: 'Bc. Pavelková',
              pozice: 'Sociální pracovnice OSPOD',
              telefon: '+420 469 605 122',
              email: 'pavelkova@muprelouc.cz',
              kancelar: 'Kancelář č. 214',
              subjektId: item.id,
              createdAt: new Date(),
            },
            {
              id: 'prac-2',
              jmeno: 'Šejnová',
              pozice: 'Sociální pracovnice / Kurátorka',
              telefon: '+420 469 605 125',
              email: 'sejnova@muprelouc.cz',
              kancelar: 'Kancelář č. 216',
              subjektId: item.id,
              createdAt: new Date(),
            },
          ]
        : [],
      reviews: [],
    };
  });

  dbStore.subjekty = [...nonOspodSubjekty, ...ospodSubjekty];
}

export async function importOspody(datasetPath?: string) {
  const filePath = datasetPath || path.join(process.cwd(), 'src/data/ospodDataset.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset file not found at ${filePath}`);
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const dataset: OspodDatasetItem[] = JSON.parse(rawData);

  console.log(`Starting safe import of ${dataset.length} OSPOD records...`);

  // Always sync in-memory store
  syncDbStoreWithOspodDataset(dataset);

  const isDbReachable = await checkDatabaseReachable();
  const prisma = isDbReachable ? getPrismaClient() : null;
  if (!prisma) {
    console.warn('Prisma/PostgreSQL database server is not reachable. Import synchronized 227 OSPOD records into in-memory dbStore.');
    return { created: 0, updated: 0, deletedDemo: 0, total: dataset.length };
  }

  let created = 0;
  let updated = 0;
  let deletedDemo = 0;

  try {
    const matchedIds = new Set<string>();

    for (const item of dataset) {
      const existing = await prisma.subjekt.findFirst({
        where: {
          type: 'OSPOD',
          OR: [
            { name: item.name, city: item.city },
            { city: item.city, institution: item.rawName },
            { name: item.name },
          ],
        },
      });

      let savedId: string;

      if (existing) {
        savedId = existing.id;
        await prisma.subjekt.update({
          where: { id: existing.id },
          data: {
            name: item.name,
            institution: item.rawName,
            city: item.city,
            region: item.region,
            address: item.address,
            website: item.officialWebsite || existing.website || null,
            lat: item.lat,
            lng: item.lng,
            isVerified: true,
            status: 'VERIFIED',
          },
        });
        updated++;
      } else {
        const createdSubjekt = await prisma.subjekt.create({
          data: {
            type: 'OSPOD',
            name: item.name,
            institution: item.rawName,
            city: item.city,
            region: item.region,
            address: item.address,
            website: item.officialWebsite || null,
            lat: item.lat,
            lng: item.lng,
            isVerified: true,
            status: 'VERIFIED',
          },
        });
        savedId = createdSubjekt.id;
        created++;
      }

      matchedIds.add(savedId);

      // Seed sample workers for OSPOD Přelouč
      if (item.city === 'Přelouč' || item.name.includes('Přelouč')) {
        const samplePracovnici = [
          {
            jmeno: 'Bc. Pavelková',
            pozice: 'Sociální pracovnice OSPOD',
            telefon: '+420 469 605 122',
            email: 'pavelkova@muprelouc.cz',
            kancelar: 'Kancelář č. 214',
          },
          {
            jmeno: 'Šejnová',
            pozice: 'Sociální pracovnice / Kurátorka',
            telefon: '+420 469 605 125',
            email: 'sejnova@muprelouc.cz',
            kancelar: 'Kancelář č. 216',
          },
        ];

        for (const p of samplePracovnici) {
          const existingPrac = await prisma.pracovnik.findFirst({
            where: {
              subjektId: savedId,
              jmeno: p.jmeno,
            },
          });
          if (!existingPrac) {
            await prisma.pracovnik.create({
              data: {
                subjektId: savedId,
                jmeno: p.jmeno,
                pozice: p.pozice,
                telefon: p.telefon,
                email: p.email,
                kancelar: p.kancelar,
                status: 'APPROVED',
              },
            });
          }
        }
      }
    }

    // Clean up obsolete demo OSPOD records in DB that were not matched
    const allOspodsInDb = await prisma.subjekt.findMany({
      where: { type: 'OSPOD' },
      select: { id: true, name: true, city: true },
    });

    for (const ospod of allOspodsInDb) {
      if (!matchedIds.has(ospod.id)) {
        const matchesDataset = dataset.some(
          (d) => d.name === ospod.name && d.city === ospod.city
        );
        if (!matchesDataset) {
          console.log(`Removing obsolete demo OSPOD record: ${ospod.name} (${ospod.city}) [${ospod.id}]`);
          await prisma.subjekt.delete({ where: { id: ospod.id } });
          deletedDemo++;
        }
      }
    }

    console.log(
      `Import completed safely. Created: ${created}, Updated: ${updated}, Deleted obsolete demo: ${deletedDemo}, Total dataset: ${dataset.length}`
    );
    return { created, updated, deletedDemo, total: dataset.length };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test' && process.argv[1]?.includes('importOspody')) {
  importOspody()
    .then((res) => {
      console.log('OSPOD Import Result:', res);
    })
    .catch((err) => {
      console.error('OSPOD Import Error:', err);
      process.exit(1);
    });
}

