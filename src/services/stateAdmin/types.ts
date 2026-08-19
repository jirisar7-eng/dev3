/**
 * STATE ADMINISTRATION API HUB - DOMAIN TYPES
 * Phase 5: Official State Administration API Connectors
 */

export type StateAdminSourceCategory =
  | 'P1_JUSTICE'
  | 'P2_CSU_NKOD'
  | 'P3_PUBLIC_REGISTRY'
  | 'P4_E_LEGISLATIVA';

export interface StateAdminConnectorConfig {
  sourceId: StateAdminSourceCategory;
  name: string;
  baseUrl: string;
  timeoutMs: number;
  rateLimitPerMin: number;
  isAuthenticationRequired: boolean;
  apiKeyEnvVar?: string;
}

export interface StateAdminAuditLog {
  id: string;
  source: StateAdminSourceCategory;
  endpoint: string;
  httpStatus: number;
  durationMs: number;
  success: boolean;
  recordsCount: number;
  errorMessage?: string;
  timestamp: Date;
}

// P1: Justice / MSp Payload Types
export interface JudicialStatisticPayload {
  courtCode?: string;
  courtName: string;
  agenda: 'P' | 'Nc' | 'C' | 'ALL'; // P/Nc = Opatrovnická agenda, C = Občanskoprávní
  period: string;
  averageDurationDays: number;
  sharedCarePercentage?: number;
  soleMotherCarePercentage?: number;
  soleFatherCarePercentage?: number;
  totalCasesCount: number;
  source: string;
}

export interface JudicialCasePayload {
  fileNumber: string;
  court: string;
  title: string;
  summary: string;
  legalRatio: string;
  tags: string[];
  fullTextUrl?: string;
  publishedAt: string;
}

// P2: ČSÚ / NKOD Payload Types
export interface NkodDatasetItem {
  id: string;
  title: string;
  description?: string;
  provider: string; // ČSÚ, MPSV, MSp
  issuedDate?: string;
  modifiedDate?: string;
  keywords: string[];
  downloadUrl?: string;
  format?: string;
}

export interface DemographicStatisticPayload {
  category: string;
  title: string;
  description?: string;
  value: string;
  unit: string;
  period: string;
  region?: string;
  source: string;
}

// P3: Public Registries (OVM, Soudy, OSPOD, ARES Legal Professionals)
export interface PublicRegistryEntityPayload {
  type: 'SOUD' | 'OSPOD' | 'ZNALEC' | 'ADVOKAT' | 'PORADNA_CHARITA';
  name: string;
  ico?: string;
  institution?: string;
  city: string;
  region: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  isVerified: boolean;
  source: string;
}

// P4: e-Legislativa Payload Types
export interface LegislativeBillPayload {
  billNumber: string; // Např. "Sněmovní tisk 450/0"
  title: string;
  actCodeAffected?: string; // Např. "89/2012"
  status: 'PROPOSED' | 'READING_1' | 'READING_2' | 'READING_3' | 'PASSED' | 'REJECTED';
  proposedBy: string;
  submittedAt: string;
  summary?: string;
  sourceUri: string;
}

export interface ConnectorResult<T> {
  success: boolean;
  source: StateAdminSourceCategory;
  httpStatus: number;
  data: T[];
  recordsCount: number;
  durationMs: number;
  error?: {
    code: string;
    message: string;
  };
}
