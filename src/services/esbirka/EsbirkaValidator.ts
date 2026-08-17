import {
  RawEsbirkaActEnvelope,
  RawEsbirkaSection,
  ValidatedEsbirkaAct,
  ValidatedEsbirkaSection,
  ValidationError,
  ValidationResult,
} from './validationTypes';
import { EsbirkaApiError } from './errors';

/**
 * Enterprise-grade, fail-closed validator for e-Sbírka / e-Legislativa API payloads.
 * Guarantees that only structurally sound, type-safe, and bounded data can enter normalization.
 */
export class EsbirkaValidator {
  // Defensive technical boundary limits
  public static readonly MAX_JSON_DEPTH = 15;
  public static readonly MAX_SECTIONS_COUNT = 10000;
  public static readonly MAX_TITLE_LENGTH = 2000;
  public static readonly MAX_SECTION_TITLE_LENGTH = 1000;
  public static readonly MAX_SECTION_CONTENT_LENGTH = 500000; // 500 KB per section text
  public static readonly MIN_VALID_YEAR = 1918;
  public static readonly MAX_VALID_YEAR = 2100;

  /**
   * Main validation entry point. Validates an untrusted raw envelope from e-Sbírka.
   * Returns a type-safe ValidationResult without throwing or modifying source data.
   */
  public static validateAct(raw: unknown): ValidationResult<ValidatedEsbirkaAct> {
    const errors: ValidationError[] = [];

    // 1. Guard against null / non-object root
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {
        isValid: false,
        errors: [
          {
            path: 'root',
            message: 'Raw API payload must be a non-null JSON object.',
            code: 'INVALID_ROOT_TYPE',
          },
        ],
      };
    }

    // 2. Check JSON Depth
    const depth = EsbirkaValidator.calculateObjectDepth(raw);
    if (depth > EsbirkaValidator.MAX_JSON_DEPTH) {
      return {
        isValid: false,
        errors: [
          {
            path: 'root',
            message: `JSON structure depth (${depth}) exceeded maximum allowed limit of ${EsbirkaValidator.MAX_JSON_DEPTH}.`,
            code: 'DEPTH_LIMIT_EXCEEDED',
          },
        ],
      };
    }

    // 3. Unwrap root envelope if nested (e.g. { predpis: { ... } } or { data: { ... } })
    const envelope = raw as RawEsbirkaActEnvelope;
    const data: RawEsbirkaActEnvelope = envelope.predpis || (raw as any).data || envelope;

    // 4. Validate Act Number (cislo / actNumber)
    const rawNumber = data.actNumber ?? data.cislo;
    let actNumber: number | null = null;
    if (typeof rawNumber === 'number' && Number.isInteger(rawNumber) && rawNumber > 0) {
      actNumber = rawNumber;
    } else if (typeof rawNumber === 'string' && /^\d+$/.test(rawNumber.trim())) {
      actNumber = parseInt(rawNumber.trim(), 10);
    }

    if (!actNumber || actNumber <= 0 || actNumber > 999999) {
      errors.push({
        path: 'actNumber',
        message: `Act number (cislo) must be a positive integer between 1 and 999999. Received: ${String(rawNumber)}`,
        code: 'INVALID_ACT_NUMBER',
      });
    }

    // 5. Validate Act Year (rok / actYear)
    const rawYear = data.actYear ?? data.rok;
    let actYear: number | null = null;
    if (typeof rawYear === 'number' && Number.isInteger(rawYear)) {
      actYear = rawYear;
    } else if (typeof rawYear === 'string' && /^\d{4}$/.test(rawYear.trim())) {
      actYear = parseInt(rawYear.trim(), 10);
    }

    if (!actYear || actYear < EsbirkaValidator.MIN_VALID_YEAR || actYear > EsbirkaValidator.MAX_VALID_YEAR) {
      errors.push({
        path: 'actYear',
        message: `Act year (rok) must be between ${EsbirkaValidator.MIN_VALID_YEAR} and ${EsbirkaValidator.MAX_VALID_YEAR}. Received: ${String(rawYear)}`,
        code: 'INVALID_ACT_YEAR',
      });
    }

    // 6. Validate Collection (sbirka / collection)
    const collection = (data.collection || data.sbirka || 'Sb.').trim();
    if (!collection || collection.length > 50) {
      errors.push({
        path: 'collection',
        message: 'Collection identifier (collection/sbirka) must be a non-empty string up to 50 characters.',
        code: 'INVALID_COLLECTION',
      });
    }

    // 7. Validate Title (nazev / title)
    const rawTitle = data.title ?? data.nazev;
    let title = '';
    if (typeof rawTitle === 'string') {
      title = rawTitle.trim();
    }

    if (!title) {
      errors.push({
        path: 'title',
        message: 'Act title (nazev/title) is required and cannot be empty.',
        code: 'MISSING_TITLE',
      });
    } else if (title.length > EsbirkaValidator.MAX_TITLE_LENGTH) {
      errors.push({
        path: 'title',
        message: `Act title length (${title.length}) exceeds maximum allowed length (${EsbirkaValidator.MAX_TITLE_LENGTH}).`,
        code: 'TITLE_TOO_LONG',
      });
    }

    // 8. Validate Short Title (zkratka / shortTitle)
    const rawShortTitle = data.shortTitle ?? data.zkratka;
    let shortTitle: string | undefined = undefined;
    if (rawShortTitle !== undefined && rawShortTitle !== null) {
      if (typeof rawShortTitle !== 'string') {
        errors.push({
          path: 'shortTitle',
          message: 'Short title (zkratka) must be a string if provided.',
          code: 'INVALID_SHORT_TITLE_TYPE',
        });
      } else {
        const trimmed = rawShortTitle.trim();
        if (trimmed.length > 200) {
          errors.push({
            path: 'shortTitle',
            message: 'Short title (zkratka) must not exceed 200 characters.',
            code: 'SHORT_TITLE_TOO_LONG',
          });
        } else if (trimmed.length > 0) {
          shortTitle = trimmed;
        }
      }
    }

    // 9. Validate Enums: ActType, Category, Status
    const rawType = (data.actType || data.typ || 'ZAKON').toUpperCase();
    const validActTypes = ['ZAKON', 'USTAVNI_ZAKON', 'VYHLASKA', 'NARIZENI_VLADY'];
    const actType = validActTypes.includes(rawType)
      ? (rawType as ValidatedEsbirkaAct['actType'])
      : 'ZAKON';

    const rawCategory = (data.category || 'FAMILY_LAW').toUpperCase();
    const validCategories = ['FAMILY_LAW', 'CHILD_PROTECTION', 'CIVIL_PROCEDURE', 'EXECUTION', 'CONSTITUTIONAL'];
    const category = validCategories.includes(rawCategory)
      ? (rawCategory as ValidatedEsbirkaAct['category'])
      : 'FAMILY_LAW';

    const rawStatus = (data.status || data.stav || 'ACTIVE').toUpperCase();
    const validStatuses = ['ACTIVE', 'AMENDED', 'REPEALED'];
    if (!validStatuses.includes(rawStatus)) {
      errors.push({
        path: 'status',
        message: `Invalid legal act status: '${rawStatus}'. Allowed: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS',
      });
    }
    const status = (validStatuses.includes(rawStatus) ? rawStatus : 'ACTIVE') as ValidatedEsbirkaAct['status'];

    // 10. Validate Dates
    const passedDate = EsbirkaValidator.parseAndValidateDate(data.passedDate ?? data.datumSchvaleni, 'passedDate', errors);
    const promulgationDate = EsbirkaValidator.parseAndValidateDate(data.promulgationDate ?? data.datumVyhlaseni, 'promulgationDate', errors);
    const effectiveFrom = EsbirkaValidator.parseAndValidateDate(data.effectiveFrom ?? data.datumUcinnostiOd, 'effectiveFrom', errors);
    const effectiveTo = EsbirkaValidator.parseAndValidateDate(data.effectiveTo ?? data.datumUcinnostiDo, 'effectiveTo', errors);
    const lastAmendedDate = EsbirkaValidator.parseAndValidateDate(data.lastAmendedDate ?? data.datumPosledniNovely, 'lastAmendedDate', errors);

    // 11. Validate Sections (paragrafy / ustanoveni / clanky / sections)
    const rawSections = data.sections || data.paragrafy || data.ustanoveni || data.clanky;
    const validatedSections: ValidatedEsbirkaSection[] = [];

    if (!rawSections || !Array.isArray(rawSections)) {
      errors.push({
        path: 'sections',
        message: 'Legal act sections list (paragrafy/ustanoveni/sections) must be a non-empty array.',
        code: 'MISSING_SECTIONS',
      });
    } else if (rawSections.length === 0) {
      errors.push({
        path: 'sections',
        message: 'Legal act must contain at least 1 section/paragraph.',
        code: 'EMPTY_SECTIONS_ARRAY',
      });
    } else if (rawSections.length > EsbirkaValidator.MAX_SECTIONS_COUNT) {
      errors.push({
        path: 'sections',
        message: `Sections count (${rawSections.length}) exceeds technical maximum of ${EsbirkaValidator.MAX_SECTIONS_COUNT}.`,
        code: 'SECTIONS_COUNT_EXCEEDED',
      });
    } else {
      for (let i = 0; i < rawSections.length; i++) {
        const sec = rawSections[i];
        const secPath = `sections[${i}]`;

        if (!sec || typeof sec !== 'object' || Array.isArray(sec)) {
          errors.push({
            path: secPath,
            message: `Section at index ${i} is not a valid object.`,
            code: 'INVALID_SECTION_OBJECT',
          });
          continue;
        }

        // Section Number
        const rawSecNum = sec.sectionNumber ?? sec.cislo ?? sec.paragraf;
        let sectionNumber = '';
        if (typeof rawSecNum === 'number') {
          sectionNumber = String(rawSecNum);
        } else if (typeof rawSecNum === 'string') {
          sectionNumber = rawSecNum.trim().replace(/^§\s*/, '');
        }

        if (!sectionNumber || !/^[0-9]+[a-z]?$/i.test(sectionNumber)) {
          errors.push({
            path: `${secPath}.sectionNumber`,
            message: `Section number '${String(rawSecNum)}' is invalid. Expected format like '888', '888a', '19'.`,
            code: 'INVALID_SECTION_NUMBER',
          });
        }

        // Section Title
        const rawSecTitle = sec.title ?? sec.nazev ?? sec.nadpis;
        let secTitle: string | undefined = undefined;
        if (rawSecTitle !== undefined && rawSecTitle !== null) {
          if (typeof rawSecTitle !== 'string') {
            errors.push({
              path: `${secPath}.title`,
              message: `Section title must be a string. Received: ${typeof rawSecTitle}`,
              code: 'INVALID_SECTION_TITLE_TYPE',
            });
          } else {
            const trimmed = rawSecTitle.trim();
            if (trimmed.length > EsbirkaValidator.MAX_SECTION_TITLE_LENGTH) {
              errors.push({
                path: `${secPath}.title`,
                message: `Section title exceeds ${EsbirkaValidator.MAX_SECTION_TITLE_LENGTH} characters.`,
                code: 'SECTION_TITLE_TOO_LONG',
              });
            } else if (trimmed.length > 0) {
              secTitle = trimmed;
            }
          }
        }

        // Section Content / Text
        let content = '';
        const rawContent = sec.content ?? sec.text;

        if (typeof rawContent === 'string') {
          content = rawContent.trim();
        } else if (Array.isArray(sec.odstavce)) {
          // If paragraphs are structured as array of odstavce objects/strings
          const parts: string[] = [];
          for (let j = 0; j < sec.odstavce.length; j++) {
            const odst = sec.odstavce[j];
            if (typeof odst === 'string') {
              parts.push(odst.trim());
            } else if (odst && typeof odst === 'object') {
              const numPrefix = odst.cislo ? `(${odst.cislo}) ` : '';
              const odstText = (odst.text || '').trim();
              let fullOdst = `${numPrefix}${odstText}`.trim();
              if (Array.isArray(odst.pismena)) {
                const pismenaTexts = odst.pismena
                  .filter((p) => p && typeof p === 'object' && p.text)
                  .map((p) => `  ${p.pismeno ? `${p.pismeno}) ` : ''}${p.text?.trim()}`);
                if (pismenaTexts.length > 0) {
                  fullOdst += '\n' + pismenaTexts.join('\n');
                }
              }
              if (fullOdst) parts.push(fullOdst);
            }
          }
          content = parts.join('\n\n');
        }

        if (!content) {
          errors.push({
            path: `${secPath}.content`,
            message: `Section § ${sectionNumber || i} has empty normative text content.`,
            code: 'EMPTY_SECTION_CONTENT',
          });
        } else if (content.length > EsbirkaValidator.MAX_SECTION_CONTENT_LENGTH) {
          errors.push({
            path: `${secPath}.content`,
            message: `Section § ${sectionNumber} content length (${content.length}) exceeds maximum limit (${EsbirkaValidator.MAX_SECTION_CONTENT_LENGTH}).`,
            code: 'SECTION_CONTENT_TOO_LONG',
          });
        }

        if (sectionNumber && content) {
          validatedSections.push({
            sectionNumber,
            title: secTitle,
            content,
            isKeySection: Boolean(sec.isKeySection),
            practicalNote: typeof sec.practicalNote === 'string' ? sec.practicalNote.trim() : undefined,
            courtRelevance: typeof sec.courtRelevance === 'string' ? sec.courtRelevance.trim() : undefined,
          });
        }
      }
    }

    // Fail closed if any errors detected
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      data: {
        actNumber: actNumber!,
        actYear: actYear!,
        collection,
        title,
        shortTitle,
        actType,
        category,
        status,
        source: (data.source || 'ESBIRKA').trim(),
        sourceUri: typeof data.sourceUri === 'string' ? data.sourceUri.trim() : typeof data.uri === 'string' ? data.uri.trim() : undefined,
        passedDate,
        promulgationDate,
        effectiveFrom,
        effectiveTo,
        lastAmendedDate,
        versionNumber: typeof data.versionNumber === 'string' ? data.versionNumber.trim() : typeof data.verze === 'string' ? data.verze.trim() : undefined,
        sections: validatedSections,
        rawMetadata: data.rawMetadata,
      },
    };
  }

  /**
   * Helper to parse and strictly validate dates, catching invalid calendar dates like 2026-02-31.
   */
  private static parseAndValidateDate(
    val: unknown,
    fieldName: string,
    errors: ValidationError[]
  ): Date | undefined {
    if (val === undefined || val === null || val === '') {
      return undefined;
    }

    if (val instanceof Date) {
      if (isNaN(val.getTime())) {
        errors.push({
          path: fieldName,
          message: `Date field '${fieldName}' contains an invalid Date object.`,
          code: 'INVALID_DATE',
        });
        return undefined;
      }
      return val;
    }

    if (typeof val === 'string') {
      const trimmed = val.trim();
      const timestamp = Date.parse(trimmed);
      if (isNaN(timestamp)) {
        errors.push({
          path: fieldName,
          message: `Date field '${fieldName}' contains invalid date string: '${trimmed}'.`,
          code: 'INVALID_DATE_FORMAT',
        });
        return undefined;
      }

      // Check strictly against calendar overflows for YYYY-MM-DD
      const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10);
        const day = parseInt(ymdMatch[3], 10);

        const d = new Date(Date.UTC(year, month - 1, day));
        if (
          d.getUTCFullYear() !== year ||
          d.getUTCMonth() + 1 !== month ||
          d.getUTCDate() !== day
        ) {
          errors.push({
            path: fieldName,
            message: `Date field '${fieldName}' contains non-existent calendar date: '${trimmed}'.`,
            code: 'NON_EXISTENT_CALENDAR_DATE',
          });
          return undefined;
        }
      }

      return new Date(timestamp);
    }

    errors.push({
      path: fieldName,
      message: `Date field '${fieldName}' must be an ISO string or Date object. Received: ${typeof val}`,
      code: 'INVALID_DATE_TYPE',
    });
    return undefined;
  }

  /**
   * Defensive helper to compute maximum nesting depth of an object structure.
   */
  public static calculateObjectDepth(obj: any, currentDepth = 1): number {
    if (obj === null || typeof obj !== 'object') {
      return currentDepth;
    }
    if (currentDepth > EsbirkaValidator.MAX_JSON_DEPTH) {
      return currentDepth;
    }

    let maxChildDepth = currentDepth;
    const values = Array.isArray(obj) ? obj : Object.values(obj);

    for (const val of values) {
      if (val && typeof val === 'object') {
        const childDepth = EsbirkaValidator.calculateObjectDepth(val, currentDepth + 1);
        if (childDepth > maxChildDepth) {
          maxChildDepth = childDepth;
        }
      }
    }

    return maxChildDepth;
  }
}
