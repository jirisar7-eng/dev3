import crypto from 'crypto';

export interface CakParsedAdvokat {
  rawHtmlHash: string;
  cakEvidencniCislo: string;
  fullName: string;
  titleBefore?: string;
  titleAfter?: string;
  ico?: string;
  officialAddress?: string;
  city?: string;
  zipCode?: string;
  officialPhone?: string;
  officialEmail?: string;
  officialWebsite?: string;
  dataBoxId?: string;
  statusText?: string;
  isActiveAdvokat: boolean;
  sourceUrl: string;
  extractedAt: string;
}

export type CakParserErrorCode =
  | 'EMPTY_HTML'
  | 'CAPTCHA_DETECTED'
  | 'WAF_BLOCKED'
  | 'HTML_LAYOUT_MISMATCH'
  | 'MISSING_CRITICAL_FIELDS'
  | 'SUSPENDED_PRACTICE'
  | 'INVALID_DATA';

export interface CakParseResult {
  success: boolean;
  data?: CakParsedAdvokat;
  error?: string;
  code?: CakParserErrorCode;
  contentHash: string;
}

/**
 * Enterprise Fail-Closed HTML Parser for Czech Bar Association (ČAK) Search Details.
 * 
 * Invariants:
 * - Deterministic SHA-256 hash calculation of raw payload
 * - Zero AI completion or deduction of missing fields
 * - Anti-bot / CAPTCHA / WAF detection with immediate fail-closed termination
 * - Fail-closed on corrupted, ambiguous, or modified HTML layouts
 * - Strict field normalization (phone, email, dataBoxId, IČO)
 */
export class CakHtmlParser {
  // Known WAF & CAPTCHA signatures
  private static readonly CAPTCHA_SIGNATURES = [
    'g-recaptcha',
    'hcaptcha',
    'cf-turnstile',
    'challenge-running',
    'cf-chl-bypass',
    'recaptcha/api.js',
    'hcaptcha.com/1/api.js',
    'turnstile/v0/api.js',
  ];

  private static readonly WAF_SIGNATURES = [
    'attention required! | cloudflare',
    'access denied | cloudflare',
    'cf-ray:',
    'security check to access',
    'incident id:',
    'waf-block',
    'shield protection active',
  ];

  /**
   * Computes SHA-256 hash of a string or buffer.
   */
  public static computeSha256(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Parses raw HTML from ČAK search detail page.
   */
  public static parse(rawHtml: string, sourceUrl: string): CakParseResult {
    const contentHash = this.computeSha256(rawHtml || '');

    if (!rawHtml || typeof rawHtml !== 'string' || rawHtml.trim().length === 0) {
      return {
        success: false,
        error: 'HTML payload je prázdný',
        code: 'EMPTY_HTML',
        contentHash,
      };
    }

    const lowerHtml = rawHtml.toLowerCase();

    // 1. CAPTCHA Check (Fail-Closed)
    for (const sig of this.CAPTCHA_SIGNATURES) {
      if (lowerHtml.includes(sig)) {
        return {
          success: false,
          error: `Detekována CAPTCHA výzva (${sig}). Automatizované obcházení je zakázáno.`,
          code: 'CAPTCHA_DETECTED',
          contentHash,
        };
      }
    }

    // 2. WAF Check (Fail-Closed)
    for (const sig of this.WAF_SIGNATURES) {
      if (lowerHtml.includes(sig)) {
        return {
          success: false,
          error: `Požadavek zablokován ochranným systémem WAF (${sig}).`,
          code: 'WAF_BLOCKED',
          contentHash,
        };
      }
    }

    // 3. Extract Raw Text and Cleaned Sections
    // Strip scripts and styles
    const sanitizedHtml = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Extract Evidenční číslo ČAK
    let evCislo: string | undefined;
    const evMatch =
      sanitizedHtml.match(/(?:Evidenční\s+číslo|Ev\.\s*č\.|Ev\.\s*číslo|Evidenční\s+č\.)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|<\/span>|:)?\s*<[^>]*>*\s*([0-9]{4,6})\b/i) ||
      sanitizedHtml.match(/data-ev-cislo=["']?([0-9]{4,6})["']?/i) ||
      sanitizedHtml.match(/\b([0-9]{4,6})\s*\/\s*ČAK\b/i);

    if (evMatch && evMatch[1]) {
      evCislo = evMatch[1].trim();
    } else {
      // Fallback regex looking directly in text lines
      const lineMatch = sanitizedHtml.match(/(?:Evidenční\s+číslo|Ev\.\s*č\.)\s*:?\s*([0-9]{4,6})/i);
      if (lineMatch && lineMatch[1]) {
        evCislo = lineMatch[1].trim();
      }
    }

    // Extract Full Name / Advokát
    let fullName: string | undefined;
    let titleBefore: string | undefined;
    let titleAfter: string | undefined;

    const nameMatch =
      sanitizedHtml.match(/<(?:h1|h2|h3|span|div)[^>]*class=["'][^"']*(?:advokat-name|detail-name|name|heading)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h1|h2|h3|span|div)>/i) ||
      sanitizedHtml.match(/(?:Jméno\s+a\s+příjmení|Advokát|Jméno)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|:)?\s*<[^>]*>*\s*([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž\.\-]+){1,4})/i);

    if (nameMatch && nameMatch[1]) {
      const rawName = nameMatch[1].replace(/<[^>]+>/g, '').trim();
      if (rawName.length >= 3 && rawName.length <= 150) {
        fullName = rawName;
        // Parse titles
        if (/^(JUDr\.|Mgr\.|doc\.|prof\.|Ing\.|PhDr\.)/i.test(fullName)) {
          const tMatch = fullName.match(/^(JUDr\.|Mgr\.|doc\.\s*JUDr\.|prof\.\s*JUDr\.|Ing\.|PhDr\.)\s+/i);
          if (tMatch) {
            titleBefore = tMatch[1].trim();
          }
        }
        if (/(LL\.M\.|Ph\.D\.|CSc\.)$/i.test(fullName)) {
          const tMatch = fullName.match(/,\s*(LL\.M\.|Ph\.D\.|CSc\.)$/i);
          if (tMatch) {
            titleAfter = tMatch[1].trim();
          }
        }
      }
    }

    // Extract IČO (8 digits)
    let ico: string | undefined;
    const icoMatch =
      sanitizedHtml.match(/(?:IČO|IČ)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|:)?\s*<[^>]*>*\s*([0-9]{8})\b/i) ||
      sanitizedHtml.match(/\bIČO?\s*:\s*([0-9]{8})\b/i);
    if (icoMatch && icoMatch[1]) {
      ico = icoMatch[1].trim();
    }

    // Extract Phone (+420...)
    let phone: string | undefined;
    const phoneMatch =
      sanitizedHtml.match(/(?:Telefon|Tel\.)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|:)?\s*<[^>]*>*\s*(\+420[\s0-9]{9,15}|[0-9]{3}\s+[0-9]{3}\s+[0-9]{3})/i) ||
      sanitizedHtml.match(/tel:(\+420[0-9]{9})/i) ||
      sanitizedHtml.match(/(\+420\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{3})/i);
    if (phoneMatch && phoneMatch[1]) {
      let p = phoneMatch[1].trim().replace(/\s+/g, ' ');
      if (!p.startsWith('+420') && /^[0-9]{3}\s+[0-9]{3}\s+[0-9]{3}$/.test(p)) {
        p = '+420 ' + p;
      }
      phone = p;
    }

    // Extract Email
    let email: string | undefined;
    const emailMatch =
      sanitizedHtml.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
      sanitizedHtml.match(/(?:E-mail|Email)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|:)?\s*<[^>]*>*\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
      sanitizedHtml.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i);
    if (emailMatch && emailMatch[1]) {
      email = emailMatch[1].trim().toLowerCase();
    }

    // Extract DataBox ID (7 alphanumeric chars)
    let dataBoxId: string | undefined;
    const boxMatch =
      sanitizedHtml.match(/(?:Datová\s+schránka|IDDS|ISDS|ID\s+schránky)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|:)?\s*<[^>]*>*\s*([a-zA-Z0-9]{7})\b/i) ||
      sanitizedHtml.match(/\bIDDS\s*:\s*([a-zA-Z0-9]{7})\b/i);
    if (boxMatch && boxMatch[1]) {
      dataBoxId = boxMatch[1].trim();
    }

    // Extract Website
    let website: string | undefined;
    const webMatch =
      sanitizedHtml.match(/<a\b[^>]*href=["'](https?:\/\/(?!vyhledavac\.cak\.cz)[^"'>]+)["'][^>]*>(?:Web|WWW|Stránky|https?)/i) ||
      sanitizedHtml.match(/(?:Web|WWW|Internetové\s+stránky)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|:)?\s*<[^>]*>*\s*(https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<"']*)?)/i);
    if (webMatch && webMatch[1]) {
      website = webMatch[1].trim();
    }

    // Extract Address / Sídlo / Město
    let address: string | undefined;
    let city: string | undefined;
    let zipCode: string | undefined;

    const addressMatch =
      sanitizedHtml.match(/(?:Sídlo|Adresa\s+sídla|Adresa)[\s\S]*?(?:<\/th>|<\/td>|<\/div>|:)?\s*<[^>]*>*\s*([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽa-záčďéěíňóřšťúůýž0-9\s.,\/-]+?(?:[0-9]{3}\s*[0-9]{2})\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽa-záčďéěíňóřšťúůýž\s0-9]+)/i) ||
      sanitizedHtml.match(/<div[^>]*class=["'][^"']*(?:address|sidlo)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

    if (addressMatch && addressMatch[1]) {
      address = addressMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const zipMatch = address.match(/([0-9]{3}\s*[0-9]{2})\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽa-záčďéěíňóřšťúůýž\s0-9]+)/);
      if (zipMatch) {
        zipCode = zipMatch[1].replace(/\s+/g, '');
        city = zipMatch[2].trim();
      }
    }

    // Extract Status (Active vs Suspended)
    let isActive = true;
    let statusText = 'Aktivní advokát';
    if (lowerHtml.includes('pozastaven') || lowerHtml.includes('pozastavení výkonu')) {
      isActive = false;
      statusText = 'Pozastavený výkon advokacie';
    } else if (lowerHtml.includes('vyškrtnut') || lowerHtml.includes('vyškrtnutí')) {
      isActive = false;
      statusText = 'Vyškrtnut ze seznamu advokátů';
    }

    // 4. Fail-Closed Validation
    if (!evCislo || !fullName) {
      return {
        success: false,
        error: `HTML struktura neodpovídá očekávanému schématu ČAK (chybí ${!evCislo ? 'evidenční číslo' : 'jméno advokáta'}).`,
        code: 'HTML_LAYOUT_MISMATCH',
        contentHash,
      };
    }

    return {
      success: true,
      data: {
        rawHtmlHash: contentHash,
        cakEvidencniCislo: evCislo,
        fullName,
        titleBefore,
        titleAfter,
        ico,
        officialAddress: address,
        city,
        zipCode,
        officialPhone: phone,
        officialEmail: email,
        officialWebsite: website,
        dataBoxId,
        statusText,
        isActiveAdvokat: isActive,
        sourceUrl,
        extractedAt: new Date().toISOString(),
      },
      contentHash,
    };
  }
}
