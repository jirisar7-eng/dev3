/**
 * Validation and normalization type definitions for e-Sbírka / e-Legislativa data pipelines.
 * Strictly separates raw untrusted API payloads from validated & normalized domain models.
 */

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationSuccess<T> {
  isValid: true;
  data: T;
  warnings?: string[];
}

export interface ValidationFailure {
  isValid: false;
  errors: ValidationError[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type VersionValidityStatus = 'CURRENT' | 'PAST' | 'FUTURE';

export interface VersionValidityInfo {
  isValidAtDate: boolean;
  isCurrent: boolean;
  status: VersionValidityStatus;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  referenceDate: Date;
}

/**
 * Raw untrusted section payload as received from e-Sbírka / e-Legislativa REST endpoints.
 */
export interface RawEsbirkaSection {
  sectionNumber?: string | number;
  cislo?: string | number;
  paragraf?: string | number;
  title?: string;
  nazev?: string;
  nadpis?: string;
  content?: string;
  text?: string;
  odstavce?: Array<{
    cislo?: string | number;
    text?: string;
    pismena?: Array<{ pismeno?: string; text?: string }>;
  }> | string[];
  isKeySection?: boolean;
  practicalNote?: string;
  courtRelevance?: string;
}

/**
 * Raw untrusted version item as received in casovaZneni / verze lists.
 */
export interface RawEsbirkaVersion {
  versionNumber?: string | number;
  verze?: string | number;
  cisloVerze?: string | number;
  oznaceniVerze?: string;
  effectiveFrom?: string | Date;
  datumUcinnostiOd?: string;
  datumUcinnosti?: string;
  ucinnostOd?: string;
  effectiveTo?: string | Date;
  datumUcinnostiDo?: string;
  ucinnostDo?: string;
  promulgationDate?: string | Date;
  datumVyhlaseni?: string;
  datumPlatnosti?: string;
  contentHash?: string;
  hash?: string;
  changeSummary?: string;
  popisZmeny?: string;
  sourceNote?: string;
  sections?: RawEsbirkaSection[];
  paragrafy?: RawEsbirkaSection[];
}

/**
 * Clean, verified data structure guaranteed to meet all mandatory structural constraints.
 */
export interface ValidatedEsbirkaSection {
  sectionNumber: string; // e.g. "888", "888a", "19"
  title?: string;
  content: string; // Guaranteed non-empty normative legal text
  isKeySection?: boolean;
  practicalNote?: string;
  courtRelevance?: string;
}

/**
 * Validated version structure.
 */
export interface ValidatedEsbirkaVersion {
  versionNumber: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  promulgationDate?: Date;
  contentHash?: string;
  changeSummary?: string;
  sourceNote?: string;
  sections?: ValidatedEsbirkaSection[];
}

/**
 * Raw untrusted act envelope as received from e-Sbírka / e-Legislativa REST endpoints.
 */
export interface RawEsbirkaActEnvelope {
  actCode?: string;
  kod?: string;
  actNumber?: number | string;
  cislo?: number | string;
  actYear?: number | string;
  rok?: number | string;
  collection?: string;
  sbirka?: string;
  title?: string;
  nazev?: string;
  shortTitle?: string;
  zkratka?: string;
  actType?: string;
  typ?: string;
  category?: string;
  status?: string;
  stav?: string;
  source?: string;
  sourceUri?: string;
  uri?: string;
  passedDate?: string | Date;
  datumSchvaleni?: string;
  promulgationDate?: string | Date;
  datumVyhlaseni?: string;
  datumPlatnosti?: string;
  effectiveFrom?: string | Date;
  datumUcinnostiOd?: string;
  datumUcinnosti?: string;
  ucinnostOd?: string;
  effectiveTo?: string | Date;
  datumUcinnostiDo?: string;
  ucinnostDo?: string;
  lastAmendedDate?: string | Date;
  datumPosledniNovely?: string;
  datumNovely?: string;
  versionNumber?: string;
  verze?: string;
  cisloVerze?: string | number;
  oznaceniVerze?: string;
  casovaZneni?: RawEsbirkaVersion[];
  verzeList?: RawEsbirkaVersion[];
  historicalVersions?: RawEsbirkaVersion[];
  sections?: RawEsbirkaSection[];
  paragrafy?: RawEsbirkaSection[];
  ustanoveni?: RawEsbirkaSection[];
  clanky?: RawEsbirkaSection[];
  rawMetadata?: Record<string, any>;
  predpis?: RawEsbirkaActEnvelope; // In case payload is wrapped in { predpis: { ... } }
}

/**
 * Clean, verified data structure guaranteed to meet all mandatory structural constraints.
 */
export interface ValidatedEsbirkaAct {
  actNumber: number;
  actYear: number;
  collection: string;
  title: string;
  shortTitle?: string;
  actType: 'ZAKON' | 'USTAVNI_ZAKON' | 'VYHLASKA' | 'NARIZENI_VLADY';
  category: 'FAMILY_LAW' | 'CHILD_PROTECTION' | 'CIVIL_PROCEDURE' | 'EXECUTION' | 'CONSTITUTIONAL';
  status: 'ACTIVE' | 'AMENDED' | 'REPEALED';
  source: string;
  sourceUri?: string;
  passedDate?: Date;
  promulgationDate?: Date;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  lastAmendedDate?: Date;
  versionNumber?: string;
  sections: ValidatedEsbirkaSection[];
  historicalVersions?: ValidatedEsbirkaVersion[];
  rawMetadata?: Record<string, any>;
}

/**
 * Normalized domain models ready for atomic synchronizer processing and PostgreSQL storage.
 */
export interface NormalizedLegalSection {
  sectionNumber: string;
  sectionOrder: number;
  title: string | null;
  content: string;
  isKeySection: boolean;
  practicalNote: string | null;
  courtRelevance: string | null;
}

export interface NormalizedLegalVersion {
  versionNumber: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  promulgationDate: Date | null;
  contentSnapshot: Record<string, any>;
  contentHash: string;
  changeSummary: string | null;
  sourceNote: string | null;
}

export interface NormalizedLegalAct {
  actCode: string; // e.g. "89/2012"
  actNumber: number;
  actYear: number;
  collection: string;
  title: string;
  shortTitle: string | null;
  actType: string;
  category: string;
  status: 'ACTIVE' | 'AMENDED' | 'REPEALED';
  source: string;
  sourceUri: string | null;
  passedDate: Date | null;
  promulgationDate: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  lastAmendedDate: Date | null;
  contentHash: string; // SHA-256 hash of canonical normalized legal text
  syncPriority: number;
  sections: NormalizedLegalSection[];
  versionSnapshot: NormalizedLegalVersion;
  historicalVersions?: NormalizedLegalVersion[];
  rawMetadata: Record<string, any> | null;
}
