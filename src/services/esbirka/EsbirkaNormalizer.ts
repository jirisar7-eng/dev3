import crypto from 'crypto';
import {
  ValidatedEsbirkaAct,
  ValidatedEsbirkaSection,
  NormalizedLegalAct,
  NormalizedLegalSection,
  NormalizedLegalVersion,
} from './validationTypes';
import { EsbirkaApiError } from './errors';

/**
 * Enterprise-grade, deterministic data normalizer for e-Sbírka / e-Legislativa legal acts.
 * Transforms validated API domain objects into canonical, immutable database entities.
 * 
 * Invariants:
 * - Operates ONLY on strictly validated inputs (Fail Closed).
 * - PRESERVES NORMATIVE LEGAL CONTENT WITH 100% FIDELITY. Zero AI summarization or alterations.
 * - Computes deterministic SHA-256 content hash based strictly on legal content.
 * - Produces stable, deterministic section ordering.
 * - Zero secrets, zero external dependencies, zero DB writes.
 */
export class EsbirkaNormalizer {
  /**
   * Known legal short titles mapping for major Czech family and civil codes.
   */
  private static readonly KNOWN_SHORT_TITLES: Record<string, { shortTitle: string; category: ValidatedEsbirkaAct['category'] }> = {
    '89/2012': { shortTitle: 'OZ', category: 'FAMILY_LAW' },
    '359/1999': { shortTitle: 'zOSPOD', category: 'CHILD_PROTECTION' },
    '292/2013': { shortTitle: 'ZŘS', category: 'CIVIL_PROCEDURE' },
    '99/1963': { shortTitle: 'OSŘ', category: 'CIVIL_PROCEDURE' },
    '120/2001': { shortTitle: 'EŘ', category: 'EXECUTION' },
    '1/1993': { shortTitle: 'Ústava ČR', category: 'CONSTITUTIONAL' },
    '2/1993': { shortTitle: 'LZPS', category: 'CONSTITUTIONAL' },
    '94/1963': { shortTitle: 'ZoR (historický)', category: 'FAMILY_LAW' },
  };

  /**
   * Set of key family law / custody / child protection sections critical for parental rights.
   */
  private static readonly KEY_SECTIONS_REGISTRY: Record<string, Record<string, { practicalNote: string; courtRelevance: string }>> = {
    '89/2012': {
      '858': {
        practicalNote: 'Vymezení rodičovské odpovědnosti (péče o dítě, jeho zastupování a správa jmění). Trvá i po rozchodu.',
        courtRelevance: 'Základní argument pro rovná práva obou rodičů na podíl na výchově a rozhodování o dítěti.',
      },
      '885': {
        practicalNote: 'Rodič, který nemá dítě v péči, má právo na pravidelný osobní styk a podíl na výchově.',
        courtRelevance: 'Právní nárok na stanovení širokého styku nebo střídavé péče.',
      },
      '887': {
        practicalNote: 'Právo dítěte na styk s oběma rodiči a právo rodiče na styk s dítětem.',
        courtRelevance: 'Styk je primárně právem dítěte na oba rodiče, nikoliv pouhým privilegiem.',
      },
      '888': {
        practicalNote: 'Rodič, který má dítě u sebe, je povinen dítě na styk řádně připravit a předat bez obstrukcí.',
        courtRelevance: 'Klíčové ustanovení při maření styku a svévolném bránění ve styku druhým rodičem.',
      },
      '889': {
        practicalNote: 'Rodič se zdrží všeho, co narušuje vztah dítěte k druhému rodiči (zákaz manipulace a odcizení).',
        courtRelevance: 'Přímý zákonný zákaz popuzování a syndromu zavrženého rodiče předkládaný soudu a OSPOD.',
      },
      '890': {
        practicalNote: 'Právo rodiče na informace o dítěti (zdravotní stav, školní prospěch, zájmové kroužky).',
        courtRelevance: 'Školy a lékaři nesmí odpírat informace rodiči s rodičovskou odpovědností.',
      },
      '906': {
        practicalNote: 'Dohoda rodičů o péči a styku má přednost před autoritativním rozhodnutím soudu.',
        courtRelevance: 'Podklad pro schválení rodičovské dohody soudem.',
      },
      '907': {
        practicalNote: 'Formy péče: střídavá, společná, nebo výlučná péče jednoho rodiče se zachováním práv druhého.',
        courtRelevance: 'Přednostní zkoumání podmínek pro střídavou péči dle judikatury Ústavního soudu.',
      },
      '910': {
        practicalNote: 'Vzájemná vyživovací povinnost rodičů a dětí.',
        courtRelevance: 'Základní vymezení alimentační povinnosti obou rodičů.',
      },
      '913': {
        practicalNote: 'Kritéria pro stanovení výše výživného (odůvodněné potřeby dítěte a majetkové možnosti rodiče).',
        courtRelevance: 'Obrana proti nepřiměřeně vyměřenému výživnému a zohlednění péče v naturální formě.',
      },
    },
    '359/1999': {
      '1': {
        practicalNote: 'Základní principy sociálně-právní ochrany dětí: nejlepší zájem dítěte a neutralita orgánu.',
        courtRelevance: 'Povinnost OSPOD jednat nestranně a hájit zájem dítěte na zachování vazeb s oběma rodiči.',
      },
      '9a': {
        practicalNote: 'Právo rodiče vyjádřit se k opatřením OSPOD a nahlížet do spisu Om.',
        courtRelevance: 'Procesní práva rodiče při správním i opatrovnickém šetření OSPOD.',
      },
      '14': {
        practicalNote: 'Poskytování poradenské pomoci rodinám a mediace při neshodách rodičů.',
        courtRelevance: 'Výzva OSPOD k aktivní pomoci při obnově kontaktu s dítětem.',
      },
      '19': {
        practicalNote: 'Povinnost OSPOD vést rodiče k dohodě a nepodporovat jednostranné odloučení od druhého rodiče.',
        courtRelevance: 'Klíčové ustanovení při stížnosti na nečinnost nebo podjatost pracovníka OSPOD.',
      },
    },
  };

  /**
   * Normalizes a validated legal act into a canonical NormalizedLegalAct structure.
   */
  public static normalizeAct(act: ValidatedEsbirkaAct): NormalizedLegalAct {
    if (!act || typeof act !== 'object' || !Array.isArray(act.sections)) {
      throw new EsbirkaApiError({
        message: 'Normalizer received invalid or unvalidated legal act object.',
        code: 'INVALID_RESPONSE',
        requestId: crypto.randomUUID(),
        endpoint: 'normalizeAct',
      });
    }

    const actCode = `${act.actNumber}/${act.actYear}`;
    const knownMeta = EsbirkaNormalizer.KNOWN_SHORT_TITLES[actCode];

    // 1. Title & Short Title Normalization
    const normalizedTitle = EsbirkaNormalizer.normalizeWhitespace(act.title);
    const shortTitle = act.shortTitle
      ? EsbirkaNormalizer.normalizeWhitespace(act.shortTitle)
      : (knownMeta?.shortTitle || null);

    const category = knownMeta ? knownMeta.category : act.category;

    // 2. Sections Normalization & Deterministic Sorting
    const normalizedSections: NormalizedLegalSection[] = act.sections.map((sec) => {
      return EsbirkaNormalizer.normalizeSection(sec, actCode);
    });

    // Stable sort by sectionOrder ascending
    normalizedSections.sort((a, b) => {
      if (a.sectionOrder !== b.sectionOrder) {
        return a.sectionOrder - b.sectionOrder;
      }
      return a.sectionNumber.localeCompare(b.sectionNumber);
    });

    // 3. Compute Deterministic Content Hash over Canonical Normative Text
    const contentHash = EsbirkaNormalizer.computeContentHash(normalizedSections);

    // 4. Determine Sync Priority
    let syncPriority = 10;
    if (actCode === '89/2012' || actCode === '359/1999') {
      syncPriority = 1; // P0 critical core code
    } else if (actCode === '292/2013' || actCode === '99/1963') {
      syncPriority = 2; // Procedural family law
    } else if (actCode === '1/1993' || actCode === '2/1993') {
      syncPriority = 3; // Constitutional foundation
    }

    // 5. Build Normalized Legal Version Snapshot
    const versionNumber = act.versionNumber || `v-${new Date().toISOString().slice(0, 10)}`;
    const effectiveFrom = act.effectiveFrom || act.promulgationDate || act.passedDate || new Date();

    const versionSnapshot: NormalizedLegalVersion = {
      versionNumber,
      effectiveFrom,
      effectiveTo: act.effectiveTo || null,
      promulgationDate: act.promulgationDate || null,
      contentSnapshot: {
        actCode,
        actNumber: act.actNumber,
        actYear: act.actYear,
        title: normalizedTitle,
        sectionsCount: normalizedSections.length,
        contentHash,
        sections: normalizedSections.map((s) => ({
          sectionNumber: s.sectionNumber,
          sectionOrder: s.sectionOrder,
          title: s.title,
          content: s.content,
          isKeySection: s.isKeySection,
        })),
      },
      contentHash,
      changeSummary: null,
      sourceNote: `Synchronized from e-Sbírka / e-Legislativa (${act.source})`,
    };

    return {
      actCode,
      actNumber: act.actNumber,
      actYear: act.actYear,
      collection: act.collection,
      title: normalizedTitle,
      shortTitle,
      actType: act.actType,
      category,
      status: act.status,
      source: act.source,
      sourceUri: act.sourceUri || null,
      passedDate: act.passedDate || null,
      promulgationDate: act.promulgationDate || null,
      effectiveFrom: act.effectiveFrom || null,
      effectiveTo: act.effectiveTo || null,
      lastAmendedDate: act.lastAmendedDate || null,
      contentHash,
      syncPriority,
      sections: normalizedSections,
      versionSnapshot,
      rawMetadata: act.rawMetadata || null,
    };
  }

  /**
   * Normalizes an individual section, calculating its sort order and matching key metadata.
   */
  public static normalizeSection(sec: ValidatedEsbirkaSection, actCode: string): NormalizedLegalSection {
    const rawNumber = (sec.sectionNumber || '').trim().toLowerCase();
    const sectionOrder = EsbirkaNormalizer.calculateSectionOrder(rawNumber);

    // Normalize text layout strictly preserving all legal wording and punctuation
    const normalizedContent = EsbirkaNormalizer.normalizeLegalText(sec.content);
    const normalizedTitle = sec.title ? EsbirkaNormalizer.normalizeWhitespace(sec.title) : null;

    // Check key section registry
    const actKeyRegistry = EsbirkaNormalizer.KEY_SECTIONS_REGISTRY[actCode];
    const keyMeta = actKeyRegistry ? actKeyRegistry[rawNumber] : undefined;

    const isKeySection = Boolean(sec.isKeySection || Boolean(keyMeta));
    const practicalNote = keyMeta?.practicalNote || sec.practicalNote || null;
    const courtRelevance = keyMeta?.courtRelevance || sec.courtRelevance || null;

    return {
      sectionNumber: sec.sectionNumber.trim(),
      sectionOrder,
      title: normalizedTitle,
      content: normalizedContent,
      isKeySection,
      practicalNote,
      courtRelevance,
    };
  }

  /**
   * Calculates a numeric sort key for section numbers like "1", "888", "888a", "888b".
   * Example:
   * "888"  -> 88800
   * "888a" -> 88801
   * "888b" -> 88802
   * "19"   -> 1900
   */
  public static calculateSectionOrder(sectionNumberStr: string): number {
    const clean = sectionNumberStr.trim().toLowerCase().replace(/^§\s*/, '');
    const match = /^(\d+)([a-z])?$/.exec(clean);

    if (!match) {
      // Fallback for non-standard section numbers
      const numOnly = parseInt(clean.replace(/\D/g, ''), 10);
      return isNaN(numOnly) ? 99999999 : numOnly * 100;
    }

    const baseNum = parseInt(match[1], 10);
    const suffixChar = match[2];
    let suffixOffset = 0;

    if (suffixChar) {
      // 'a' -> 1, 'b' -> 2, etc.
      suffixOffset = suffixChar.charCodeAt(0) - 96;
      if (suffixOffset < 1 || suffixOffset > 99) {
        suffixOffset = 99;
      }
    }

    return baseNum * 100 + suffixOffset;
  }

  /**
   * Normalizes legal text strictly preserving paragraph breaks, numbering, and exact words.
   * - Unifies line endings (\r\n -> \n)
   * - Trims trailing whitespace on each line
   * - Collapses multiple blank lines (max 2 newlines)
   * - Applies Unicode NFC normalization
   * - NEVER rewrites, summarizes, or deletes words.
   */
  public static normalizeLegalText(rawText: string): string {
    if (!rawText) return '';

    return rawText
      .normalize('NFC')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Normalizes single-line strings (titles, identifiers).
   */
  public static normalizeWhitespace(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFC')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Computes a deterministic SHA-256 hash across canonical sorted sections.
   * Excludes any transient metadata, timestamps, request IDs, or API keys.
   */
  public static computeContentHash(sections: NormalizedLegalSection[]): string {
    const canonicalPayload = sections
      .map((sec) => `[SEC:${sec.sectionNumber}|ORD:${sec.sectionOrder}|TITLE:${sec.title || ''}]\n${sec.content}`)
      .join('\n\n---LEGAL_SECTION_BOUNDARY---\n\n');

    return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
  }
}
