import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Parse arguments
const isApply = process.argv.includes('--apply');
const isDryRun = process.argv.includes('--dry-run') || !isApply;

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

const SUSPICIOUS_COORDS = [
  { lat: 50.0865, lng: 14.4239 } // Known duplicate Praha coords for courts in PROD
];

function isSuspicious(lat: number | null, lng: number | null, city: string): boolean {
  if (lat === null || lng === null) return false;
  if (!city) return false;
  
  // Check known fake coordinates
  for (const bad of SUSPICIOUS_COORDS) {
    if (Math.abs(bad.lat - lat) < 0.0001 && Math.abs(bad.lng - lng) < 0.0001) {
      if (!city.toLowerCase().includes('praha') && !city.toLowerCase().includes('prague')) {
        return true; // Marked as Prague but city is not Prague
      }
    }
  }
  return false;
}

// Normalize strings for comparison (remove diacritics, lowercase)
function normalizeStr(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type GeocodeResult = {
  status: 'SUCCESS' | 'NOT_FOUND' | 'ERROR';
  lat?: number;
  lng?: number;
  source?: string;
};

async function geocode(subject: any): Promise<GeocodeResult> {
  const city = subject.city || '';
  const address = subject.address || '';
  const name = subject.name || '';
  
  // Query strategies ordered by precision
  const queries = [
    `${name}, ${address}, ${city}, Czech Republic`.replace(/,\s*,/g, ','),
    `${address}, ${city}, Czech Republic`.replace(/,\s*,/g, ','),
    `${city}, Czech Republic`
  ];

  const MAX_RETRIES = 2;
  let encounteredError = false;

  for (const q of queries) {
    if (!q || q.trim().length < 5 || q.startsWith(',')) continue;
    
    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q.trim())}&addressdetails=1&limit=3`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'TataMaPravo/1.1 (backfill-script)' }
        });
        
        if (!res.ok) {
          console.error(`HTTP error ${res.status} on attempt ${attempt + 1} for query: ${q}`);
          encounteredError = true;
          attempt++;
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.error(`Invalid Content-Type: ${contentType} on attempt ${attempt + 1}. Expected JSON (Got XML/HTML?). Query: ${q}`);
          encounteredError = true;
          attempt++;
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }

        const data = await res.json();
        
        if (data && data.length > 0) {
          // Validate result
          for (const item of data) {
            const resCity = item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.address?.state || '';
            const resDisplay = item.display_name || '';
            
            const expectedCityNorm = normalizeStr(city);
            
            // Must match city
            if (
              expectedCityNorm && 
              (normalizeStr(resCity).includes(expectedCityNorm) || 
               normalizeStr(resDisplay).includes(expectedCityNorm))
            ) {
              return {
                status: 'SUCCESS',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                source: `Nominatim: ${q}`
              };
            }
          }
        }
        
        // If we reach here, we successfully got JSON but no valid result matched our criteria.
        // Break out of the retry loop for this query and move to the next fallback query.
        break;
      } catch (err) {
        console.error(`Geocoding error for ${name} on attempt ${attempt + 1}:`, err);
        encounteredError = true;
        attempt++;
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
    
    // Delay 1s before trying the next query strategy to respect Nominatim limits
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return { status: encounteredError ? 'ERROR' : 'NOT_FOUND' };
}

async function run() {
  console.log(`Starting GPS Backfill in ${isApply ? 'APPLY' : 'DRY-RUN'} mode...`);
  
  const subjects = await prisma.subjekt.findMany();
  
  let total = subjects.length;
  let missingGps = 0;
  let hasGps = 0;
  let suspiciousCount = 0;
  let candidateCount = 0;
  
  let added = 0;
  let corrected = 0;
  let skipped = 0;
  let unchanged = 0;
  let errors = 0;
  
  const reportLines = [
    '| ID | Subjekt | Město | Staré GPS | Nové GPS | Zdroj | Validace | Akce |',
    '|---|---|---|---|---|---|---|---|'
  ];
  
  for (const s of subjects) {
    let oldGpsStr = 'NULL';
    const isMissing = s.lat === null || s.lng === null;
    let isSusp = false;
    
    if (isMissing) {
      missingGps++;
    } else {
      hasGps++;
      oldGpsStr = `${s.lat}, ${s.lng}`;
      if (isSuspicious(s.lat, s.lng, s.city || '')) {
        isSusp = true;
        suspiciousCount++;
      }
    }
    
    if (isMissing || isSusp) {
      candidateCount++;
      console.log(`Processing: ${s.name} (${s.city}) - Suspicious: ${isSusp}`);
      const newCoords = await geocode(s);
      
      if (newCoords.status === 'SUCCESS' && newCoords.lat !== undefined && newCoords.lng !== undefined) {
        // Ensure lat/lng are in valid bounds before applying
        if (newCoords.lat < -90 || newCoords.lat > 90 || newCoords.lng < -180 || newCoords.lng > 180) {
          skipped++;
          reportLines.push(`| ${s.id.substring(0,8)} | ${s.name} | ${s.city} | ${oldGpsStr} | ${newCoords.lat}, ${newCoords.lng} | ${newCoords.source} | FAIL (Out of bounds) | SKIP |`);
          continue;
        }
        
        const action = isMissing ? 'ADD' : 'CORRECT';
        if (isApply) {
          await prisma.subjekt.update({
            where: { id: s.id },
            data: { lat: newCoords.lat, lng: newCoords.lng }
          });
        }
        if (isMissing) added++; else corrected++;
        
        reportLines.push(`| ${s.id.substring(0,8)} | ${s.name} | ${s.city} | ${oldGpsStr} | ${newCoords.lat}, ${newCoords.lng} | ${newCoords.source} | PASS (Město souhlasí) | ${action} |`);
      } else if (newCoords.status === 'ERROR') {
        errors++;
        reportLines.push(`| ${s.id.substring(0,8)} | ${s.name} | ${s.city} | ${oldGpsStr} | NULL | Nelze ověřit / API Chyba | FAIL | ERROR |`);
      } else {
        skipped++;
        reportLines.push(`| ${s.id.substring(0,8)} | ${s.name} | ${s.city} | ${oldGpsStr} | NULL | Nenalezeno přesné shody | FAIL | SKIP |`);
      }
    } else {
      unchanged++;
    }
  }
  
  const report = `# Auditní zpráva: GPS Backfill

**Datum:** ${new Date().toISOString()}
**Režim:** ${isApply ? 'APPLY (Zápis)' : 'DRY-RUN (Pouze test)'}

## Souhrn databáze
- Celkem subjektů: ${total}
- S GPS před během: ${hasGps}
- Bez GPS před během: ${missingGps}
- Podezřelých GPS: ${suspiciousCount}
- Kandidátů na opravu (Bez GPS + Podezřelé): ${candidateCount}

## Výsledky
- Úspěšně nalezeno a ${isApply ? 'zapsáno' : 'navrženo'} (ADD): ${added}
- Úspěšně opraveno a ${isApply ? 'přepsáno' : 'navrženo'} (CORRECT): ${corrected}
- Odmítnuto/neověřeno (SKIP): ${skipped}
- Selhání/chyba API (ERROR): ${errors}
- Beze změny (UNCHANGED): ${unchanged}

## Detailní protokol
${reportLines.join('\n')}
`;

  fs.mkdirSync(path.join(process.cwd(), 'docs/audit'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), 'docs/audit/AUDIT_2026-08-22_GPS_BACKFILL.md'), report, 'utf8');
  
  console.log(`Done! Report saved to docs/audit/AUDIT_2026-08-22_GPS_BACKFILL.md`);
  console.log(`ADD: ${added}, CORRECT: ${corrected}, SKIP: ${skipped}, UNCHANGED: ${unchanged}, ERROR: ${errors}, SUSPICIOUS: ${suspiciousCount}`);
  
  await prisma.$disconnect();
  await pool.end();
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
