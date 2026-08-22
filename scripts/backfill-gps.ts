import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('CRITICAL ERROR: DATABASE_URL is not defined in the environment.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function geocodeAddress(address: string, city: string): Promise<{ lat: number, lng: number } | null> {
  const query = `${address ? address + ',' : ''} ${city}`.trim();
  if (!query || query === ',') return null;
  
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: {
        'User-Agent': 'TataMaPravo/1.0 (backfill-script)'
      }
    });
    
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error(`Error geocoding ${query}:`, error);
  }
  return null;
}

async function runBackfill() {
  console.log('--- STARTING GPS BACKFILL ---');
  let processed = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const subjekty = await prisma.subjekt.findMany({
      where: {
        OR: [
          { lat: null },
          { lng: null }
        ]
      }
    });
    console.log(`Found ${subjekty.length} subjekts missing GPS coordinates.`);

    for (const s of subjekty) {
      processed++;
      console.log(`Processing [${processed}/${subjekty.length}]: ${s.name}`);
      const coords = await geocodeAddress(s.address || '', s.city);
      if (coords) {
        await prisma.subjekt.update({
          where: { id: s.id },
          data: {
            lat: coords.lat,
            lng: coords.lng
          }
        });
        console.log(`  -> Updated with lat: ${coords.lat}, lng: ${coords.lng}`);
        updated++;
      } else {
        console.log(`  -> Geocoding failed or returned no results.`);
        skipped++;
      }
      // Wait 1s to respect Nominatim API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`--- BACKFILL COMPLETE ---`);
    console.log(`Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('Backfill error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runBackfill();
