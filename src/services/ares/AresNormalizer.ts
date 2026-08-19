import { AresEconomicSubjectRaw, AresNormalizedSubject } from './types';

const REGION_MAP: Record<string, string> = {
  '19': 'Hlavní město Praha',
  '27': 'Středočeský kraj',
  '35': 'Jihočeský kraj',
  '43': 'Plzeňský kraj',
  '51': 'Karlovarský kraj',
  '60': 'Ústecký kraj',
  '78': 'Liberecký kraj',
  '86': 'Královéhradecký kraj',
  '94': 'Pardubický kraj',
  '108': 'Kraj Vysočina',
  '116': 'Jihomoravský kraj',
  '124': 'Olomoucký kraj',
  '132': 'Zlínský kraj',
  '141': 'Moravskoslezský kraj',
  'praha': 'Hlavní město Praha',
  'hlavní město praha': 'Hlavní město Praha',
  'středočeský': 'Středočeský kraj',
  'jihočeský': 'Jihočeský kraj',
  'plzeňský': 'Plzeňský kraj',
  'karlovarský': 'Karlovarský kraj',
  'ústecký': 'Ústecký kraj',
  'liberecký': 'Liberecký kraj',
  'královéhradecký': 'Královéhradecký kraj',
  'pardubický': 'Pardubický kraj',
  'vysočina': 'Kraj Vysočina',
  'jihomoravský': 'Jihomoravský kraj',
  'olomoucký': 'Olomoucký kraj',
  'zlínský': 'Zlínský kraj',
  'moravskoslezský': 'Moravskoslezský kraj',
};

/**
 * Normalizer for raw ARES JSON data into unified application formats.
 */
export class AresNormalizer {
  /**
   * Normalizes raw ARES v3 subject payload.
   */
  public static normalizeSubject(raw: AresEconomicSubjectRaw): AresNormalizedSubject {
    const sidlo = raw.sidlo || {};
    
    // 1. Format street line
    let streetLine = sidlo.nazevUlice || sidlo.nazevCastiObce || sidlo.nazevObce || '';
    if (streetLine && sidlo.cisloDomovni) {
      if (sidlo.cisloOrientacni) {
        streetLine += ` ${sidlo.cisloDomovni}/${sidlo.cisloOrientacni}${sidlo.cisloOrientacniPismeno || ''}`;
      } else {
        streetLine += ` ${sidlo.cisloDomovni}`;
      }
    }

    // 2. Format postal code
    let pscStr: string | undefined;
    if (sidlo.psc) {
      const pscDigits = String(sidlo.psc).padStart(5, '0');
      pscStr = `${pscDigits.slice(0, 3)} ${pscDigits.slice(3)}`;
    }

    // 3. Format city
    const city = sidlo.nazevObce || sidlo.nazevMestskeCastiObvodu || 'Neznámé město';

    // 4. Format full address
    let fullAddress = sidlo.textovaAdresa || '';
    if (!fullAddress) {
      const parts: string[] = [];
      if (streetLine) parts.push(streetLine);
      if (pscStr && city) parts.push(`${pscStr} ${city}`);
      else if (city) parts.push(city);
      fullAddress = parts.join(', ');
    }

    // 5. Normalize Region
    const region = this.resolveRegion(sidlo.kodKraje, sidlo.nazevKraje, sidlo.nazevOkresu, city);

    // 6. Active check
    const isEntityActive = !raw.datumZaniku;

    // 7. Infer EntityType suggestion
    const suggestedType = this.inferEntityType(raw.obchodniJmeno, raw.pravniForma, raw.czNace);

    return {
      ico: raw.ico.padStart(8, '0'),
      name: raw.obchodniJmeno.trim(),
      legalForm: raw.pravniForma,
      isEntityActive,
      establishedDate: raw.datumVzniku,
      terminationDate: raw.datumZaniku,
      address: fullAddress,
      street: streetLine || undefined,
      city,
      postalCode: pscStr,
      region,
      suggestedType,
      rawSource: 'ARES_REST_V3',
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Resolves standard Czech region name from ARES codes or text descriptors.
   */
  private static resolveRegion(kodKraje?: number, nazevKraje?: string, nazevOkresu?: string, city?: string): string {
    if (kodKraje && REGION_MAP[String(kodKraje)]) {
      return REGION_MAP[String(kodKraje)];
    }

    if (nazevKraje) {
      const norm = nazevKraje.toLowerCase().replace(/kraj/g, '').trim();
      for (const [key, val] of Object.entries(REGION_MAP)) {
        if (norm.includes(key) || key.includes(norm)) {
          return val;
        }
      }
    }

    if (city) {
      const normCity = city.toLowerCase().trim();
      if (normCity === 'praha' || normCity.startsWith('praha ')) {
        return 'Hlavní město Praha';
      }
      if (normCity === 'brno' || normCity.startsWith('brno-')) {
        return 'Jihomoravský kraj';
      }
      if (normCity === 'ostrava' || normCity.startsWith('ostrava-')) {
        return 'Moravskoslezský kraj';
      }
      if (normCity === 'plzeň') {
        return 'Plzeňský kraj';
      }
    }

    return 'Hlavní město Praha'; // Fallback standard
  }

  /**
   * Infers application EntityType based on subject name, legal form and NACE codes.
   */
  private static inferEntityType(
    name: string,
    legalForm?: string,
    nace?: string[]
  ): 'ADVOKAT' | 'MEDIATOR' | 'ZNALEC' | 'NEZISKOVKA' | 'SOUD' | 'OSPOD' | undefined {
    const lowerName = name.toLowerCase();

    // Soudy
    if (lowerName.includes('soud') || lowerName.includes('justice')) {
      return 'SOUD';
    }

    // OSPOD / Úřady
    if (lowerName.includes('ospod') || lowerName.includes('městský úřad') || lowerName.includes('magistrát')) {
      return 'OSPOD';
    }

    // Advokáti
    if (
      lowerName.includes('advokát') ||
      lowerName.includes('law office') ||
      lowerName.includes('právní kancelář') ||
      lowerName.includes('judr.') ||
      legalForm === '101' || // Fyzická osoba podnikající dle jiných zákonů (často advokáti)
      (nace && nace.includes('69100')) // Právní činnosti
    ) {
      return 'ADVOKAT';
    }

    // Mediátoři
    if (lowerName.includes('mediac') || lowerName.includes('mediát')) {
      return 'MEDIATOR';
    }

    // Znalci
    if (lowerName.includes('znalec') || lowerName.includes('znaleck')) {
      return 'ZNALEC';
    }

    // Neziskovky
    if (
      lowerName.includes('z.s.') ||
      lowerName.includes('spolek') ||
      lowerName.includes('nadační fond') ||
      lowerName.includes('nadace') ||
      lowerName.includes('ústav') ||
      lowerName.includes('o.p.s.') ||
      ['117', '118', '141', '145', '706', '716', '721'].includes(legalForm || '')
    ) {
      return 'NEZISKOVKA';
    }

    return undefined;
  }
}
