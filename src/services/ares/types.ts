/**
 * Type definitions for ARES (Administrativní registr ekonomických subjektů) REST API v3
 */

export interface AresClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseSizeBytes?: number;
  customFetch?: (url: string, init?: any) => Promise<any>;
}

export interface AresSídloRaw {
  kodStatu?: string;
  nazevStatu?: string;
  kodKraje?: number;
  nazevKraje?: string;
  kodOkresu?: number;
  nazevOkresu?: string;
  kodObce?: number;
  nazevObce?: string;
  kodCastiObce?: number;
  nazevCastiObce?: string;
  kodMestskeCastiObvodu?: number;
  nazevMestskeCastiObvodu?: string;
  nazevUlice?: string;
  cisloDomovni?: number;
  cisloOrientacni?: number;
  cisloOrientacniPismeno?: string;
  psc?: number;
  textovaAdresa?: string;
}

export interface AresEconomicSubjectRaw {
  ico: string;
  obchodniJmeno: string;
  sidlo?: AresSídloRaw;
  pravniForma?: string;
  financniUrad?: string;
  datumVzniku?: string;
  datumZaniku?: string;
  datumAktualizace?: string;
  dic?: string;
  czNace?: string[];
  primarniZdroj?: string;
}

export interface AresNormalizedSubject {
  ico: string;
  name: string;
  legalForm?: string;
  isEntityActive: boolean;
  establishedDate?: string;
  terminationDate?: string;
  address: string;
  street?: string;
  city: string;
  postalCode?: string;
  region: string;
  suggestedType?: 'ADVOKAT' | 'MEDIATOR' | 'ZNALEC' | 'NEZISKOVKA' | 'SOUD' | 'OSPOD';
  rawSource: 'ARES_REST_V3';
  verifiedAt: string;
}

export interface AresValidationResult {
  valid: boolean;
  errors: string[];
  normalizedIco?: string;
}

export type AresErrorCode =
  | 'INVALID_ICO'
  | 'NOT_FOUND'
  | 'HTTP_ERROR'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'RESPONSE_TOO_LARGE'
  | 'SSRF_DETECTED'
  | 'CONFIGURATION_ERROR';

export interface AresVerifyResult {
  success: boolean;
  subject?: AresNormalizedSubject;
  error?: {
    code: AresErrorCode;
    message: string;
    httpStatus?: number;
  };
}
