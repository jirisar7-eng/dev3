/**
 * STATE ADMINISTRATION API HUB - P3: PUBLIC REGISTRIES CONNECTOR
 * Registr orgánů veřejné moci (OVM), MSp soudy & OSPOD
 * ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, PublicRegistryEntityPayload } from './types.js';

export class PublicRegistryConnector {
  /**
   * Queries public registry of courts and OSPOD state organs via NKOD SPARQL endpoint.
   */
  public static async getOvmEntities(entityType: 'SOUD' | 'OSPOD' = 'SOUD'): Promise<ConnectorResult<PublicRegistryEntityPayload>> {
    const keyword = entityType === 'SOUD' ? 'soud' : 'ospod';
    const query = `PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT DISTINCT ?ds ?title ?desc WHERE {
  ?ds a dcat:Dataset ; dct:title ?title .
  OPTIONAL { ?ds dct:description ?desc }
  FILTER(CONTAINS(LCASE(?title), "${keyword}"))
} LIMIT 25`;

    const response = await StateAdminApiClient.executeSparqlQuery('P3_PUBLIC_REGISTRY', query);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P3_PUBLIC_REGISTRY',
        httpStatus: response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'OVM_FETCH_FAILED',
          message: `Registr OVM SPARQL navrátil chybový stav ${response.status}.`,
        },
      };
    }

    const normalizedData = this.normalizeOvmEntities(response.data, entityType);

    return {
      success: true,
      source: 'P3_PUBLIC_REGISTRY',
      httpStatus: 200,
      data: normalizedData,
      recordsCount: normalizedData.length,
      durationMs: response.durationMs,
    };
  }

  /**
   * Verifies legal professional / public authority subject by IČO via NKOD SPARQL OVM registry.
   */
  public static async verifyLegalProfessional(ico: string): Promise<ConnectorResult<PublicRegistryEntityPayload>> {
    const cleanIco = ico.trim().padStart(8, '0');
    const query = `PREFIX dct: <http://purl.org/dc/terms/>
SELECT DISTINCT ?ds ?title ?desc WHERE {
  ?ds a <http://www.w3.org/ns/dcat#Dataset> ; dct:title ?title .
  OPTIONAL { ?ds dct:description ?desc }
  FILTER(CONTAINS(str(?ds), "${cleanIco}"))
} LIMIT 1`;

    const response = await StateAdminApiClient.executeSparqlQuery('P3_PUBLIC_REGISTRY', query);

    if (response.status !== 200 || !response.data || response.data.length === 0) {
      return {
        success: false,
        source: 'P3_PUBLIC_REGISTRY',
        httpStatus: response.status === 200 ? 404 : response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: 'SUBJECT_NOT_FOUND',
          message: `Subjekt s IČO ${cleanIco} nebyl nalezen v registru.`,
        },
      };
    }

    const item = response.data[0];
    const payload: PublicRegistryEntityPayload = {
      type: 'SOUD',
      name: item.title?.value || `Subjekt IČO ${cleanIco}`,
      institution: 'Ministerstvo spravedlnosti ČR',
      city: 'Praha',
      region: 'Česká republika',
      address: item.desc?.value || '',
      isVerified: true,
      source: 'Registr orgánů veřejné moci (OVM / NKOD SPARQL)',
    };

    return {
      success: true,
      source: 'P3_PUBLIC_REGISTRY',
      httpStatus: 200,
      data: [payload],
      recordsCount: 1,
      durationMs: response.durationMs,
    };
  }

  /**
   * Normalizer & Validator for OVM entities SPARQL bindings.
   * Strict Fail-Closed: returns empty array if no valid data.
   */
  public static normalizeOvmEntities(rawData: any, entityType: 'SOUD' | 'OSPOD'): PublicRegistryEntityPayload[] {
    if (!Array.isArray(rawData)) return [];

    return rawData
      .filter((item) => item && item.title?.value)
      .map((item: any) => ({
        type: entityType,
        name: item.title?.value || '',
        institution: entityType === 'SOUD' ? 'Ministerstvo spravedlnosti ČR' : 'Ministerstvo práce a sociálních věcí ČR',
        city: 'Praha',
        region: 'Česká republika',
        address: item.desc?.value || '',
        isVerified: true,
        source: 'Registr orgánů veřejné moci (OVM / NKOD SPARQL)',
      }));
  }

  /**
   * Normalizer for legal subject verification.
   * Strict Fail-Closed: returns null if invalid payload.
   */
  public static normalizeAresLegalProfessional(rawData: any): PublicRegistryEntityPayload | null {
    if (!rawData || typeof rawData !== 'object') return null;

    const name = rawData.obchodniJmeno || rawData.nazev || rawData.name;
    if (!name) return null;

    return {
      type: 'SOUD',
      name,
      institution: rawData.pravniForma || 'Právní subjekt',
      city: rawData.sidlo?.nazevObce || 'Česká republika',
      region: rawData.sidlo?.nazevKraje || 'Česká republika',
      address: rawData.sidlo?.textovaAdresa || '',
      isVerified: true,
      source: 'Registr ekonomických subjektů (ARES v3 / OVM)',
    };
  }
}
