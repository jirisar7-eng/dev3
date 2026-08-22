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
  status: 'SUCCESS' | 'NOT_FOUND' | 'ERROR' | 'RATE_LIMITED';
  lat?: number;
  lng?: number;
  source?: string;
};

// Global states for Rate Limiting & Caching
let globalAbort = false;
let globalConsecutive429 = 0;
const MAX_GLOBAL_429 = 2; // Stop after 2 consecutive 429s to prevent spamming
const geocodeCache = new Map<string, GeocodeResult>();

async function geocode(subject: any): Promise<GeocodeResult> {
  if (globalAbort) return { status: 'RATE_LIMITED' };

  const city = subject.city || '';
  const address = subject.address || '';
  const name = subject.name || '';
  
  // Deduplicate and prioritize queries
  const queries = [
    `${name}, ${address}, ${city}, Czech Republic`.replace(/,\s*,/g, ','),
    `${address}, ${city}, Czech Republic`.replace(/,\s*,/g, ','),
    `${city}, Czech Republic`
  ].map(q => q.trim()).filter(q => q.length >= 5 && !q.startsWith(','));

  // Remove duplicates from queries array
  const uniqueQueries = [...new Set(queries)];

  const MAX_RETRIES = 2;
  let encounteredError = false;

  for (const q of uniqueQueries) {
    if (globalAbort) return { status: 'RATE_LIMITED' };

    // Check cache first to save requests
    if (geocodeCache.has(q)) {
      console.log(`  -> Cache hit for query: ${q}`);
      const cached = geocodeCache.get(q)!;
      if (cached.status === 'SUCCESS') return cached;
      continue; // If cached NOT_FOUND, try next query strategy. We don't cache ERROR to retry them if needed.
    }

    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      if (globalAbort) return { status: 'RATE_LIMITED' };

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=3`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'TataMaPravo/1.2 (backfill-script)' }
        });
        
        if (res.status === 429) {
          globalConsecutive429++;
          if (globalConsecutive429 > MAX_GLOBAL_429) {
            console.error(`FATAL: Systemic HTTP 429 Too Many Requests hit. Aborting entire backfill.`);
            globalAbort = true;
            return { status: 'RATE_LIMITED' };
          }
          
          const retryAfter = res.headers.get('retry-after');
          let waitMs = 15000; // Default 15s backoff if no header
          if (retryAfter) {
            const sec = parseInt(retryAfter, 10);
            if (!isNaN(sec)) waitMs = sec * 1000;
          }
          
          console.warn(`HTTP 429 Too Many Requests. Backing off for ${waitMs}ms... (Attempt ${globalConsecutive429}/${MAX_GLOBAL_429})`);
          await new Promise(r => setTimeout(r, waitMs));
          continue; // Retry the same query without incrementing the standard `attempt` counter
        }

        if (!res.ok) {
          console.error(`HTTP error ${res.status} on attempt ${attempt + 1} for query: ${q}`);
          encounteredError = true;
          attempt++;
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }

        // We got a 2xx response, reset 429 counter
        globalConsecutive429 = 0;

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
          for (const item of data) {
            const resCity = item.address?.city || item.address?.town || item.address?.village || item.address?.county || item.address?.state || '';
            const resDisplay = item.display_name || '';
            const expectedCityNorm = normalizeStr(city);
            
            if (
              expectedCityNorm && 
              (normalizeStr(resCity).includes(expectedCityNorm) || 
               normalizeStr(resDisplay).includes(expectedCityNorm))
            ) {
              const result: GeocodeResult = {
                status: 'SUCCESS',
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                source: `Nominatim: ${q}`
              };
              geocodeCache.set(q, result);
              return result;
            }
          }
        }
        
        // Cache NOT_FOUND to avoid repeating exact same useless query for other subjects
        geocodeCache.set(q, { status: 'NOT_FOUND' });
        break; // Break retry loop, go to next query strategy
        
      } catch (err) {
        console.error(`Geocoding network/parsing error for ${name} on attempt ${attempt + 1}:`, err);
        encounteredError = true;
        attempt++;
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
    
    // Delay 1.5s before next request to respect Nominatim limits safely
    await new Promise(r => setTimeout(r, 1500));
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
      
      if (newCoords.status === 'RATE_LIMITED') {
        reportLines.push(`| ${s.id.substring(0,8)} | ${s.name} | ${s.city} | ${oldGpsStr} | NULL | PŘERUŠENO (Rate Limit 429) | FAIL | RATE_LIMITED |`);
        break; // Stop processing further subjects immediately
      }

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
  
  if (globalAbort) {
    console.error(`\n>>> SCRIPT ABORTED EARLY DUE TO RATE LIMITING (HTTP 429) <<<`);
  }

  const report = `# Auditní zpráva: GPS Backfill

**Datum:** ${new Date().toISOString()}
**Režim:** ${isApply ? 'APPLY (Zápis)' : 'DRY-RUN (Pouze test)'}
**Stav:** ${globalAbort ? 'PŘERUŠENO (HTTP 429 RATE LIMIT)' : 'DOKONČENO'}

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

  if (globalAbort) {
    process.exit(2);
  }
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
