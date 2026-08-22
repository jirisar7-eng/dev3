import { getPrismaClient } from '../db/prisma';
import fs from 'fs';
import path from 'path';

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

export async function importOspody(datasetPath?: string) {
  const filePath = datasetPath || path.join(process.cwd(), 'src/data/ospodDataset.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset file not found at ${filePath}`);
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const dataset: OspodDatasetItem[] = JSON.parse(rawData);

  console.log(`Starting safe import of ${dataset.length} OSPOD records...`);

  const prisma = getPrismaClient();
  if (!prisma) {
    console.warn('Prisma client unavailable. Import skipped or running in fallback mode.');
    return { created: 0, updated: 0, total: dataset.length };
  }

  let created = 0;
  let updated = 0;

  try {
    for (const item of dataset) {
      const existing = await prisma.subjekt.findFirst({
        where: {
          name: item.name,
          city: item.city,
          type: 'OSPOD'
        }
      });

      if (existing) {
        await prisma.subjekt.update({
          where: { id: existing.id },
          data: {
            region: item.region,
            address: item.address,
            website: item.officialWebsite || existing.website,
            lat: item.lat,
            lng: item.lng,
            isVerified: true,
            status: 'VERIFIED'
          }
        });
        updated++;
      } else {
        await prisma.subjekt.create({
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
            status: 'VERIFIED'
          }
        });
        created++;
      }
    }

    console.log(`Import completed safely. Created: ${created}, Updated: ${updated}`);
    return { created, updated, total: dataset.length };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test' && require.main === module) {
  importOspody()
    .then((res) => {
      console.log('OSPOD Import Result:', res);
    })
    .catch((err) => {
      console.error('OSPOD Import Error:', err);
      process.exit(1);
    });
}
