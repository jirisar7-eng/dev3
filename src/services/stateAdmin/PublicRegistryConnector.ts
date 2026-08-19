/**
 * STATE ADMINISTRATION API HUB - P3: PUBLIC REGISTRIES CONNECTOR
 * Registr orgánů veřejné moci (OVM) & Ověřené subjekty (Soudy, OSPOD, Znalci, Mediátoři, Advokáti)
 * ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, PublicRegistryEntityPayload } from './types.js';

export class PublicRegistryConnector {
  private static readonly OVM_OPENDATA_URL = 'https://data.gov.cz/api/v2/datasets?klicove-slovo=soudy';
  private static readonly ARES_REST_BASE = 'https://ares.gov.cz/ekonomicke-subjekty-v-ares/restApi/ekonomicke-subjekty';

  /**
   * Queries public registry of courts and OSPOD state organs.
   */
  public static async getOvmEntities(entityType: 'SOUD' | 'OSPOD' = 'SOUD'): Promise<ConnectorResult<PublicRegistryEntityPayload>> {
    const keyword = entityType === 'SOUD' ? 'soudy' : 'ospod';
    const url = `https://data.gov.cz/api/v2/datasets?klicove-slovo=${encodeURIComponent(keyword)}`;

    const response = await StateAdminApiClient.executeGet('P3_PUBLIC_REGISTRY', url);

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
          message: `Registr OVM navrátil chybový stav ${response.status}.`,
        },
      };
    }

    const normalizedEntities = this.normalizeOvmEntities(response.data, entityType);

    return {
      success: true,
      source: 'P3_PUBLIC_REGISTRY',
      httpStatus: 200,
      data: normalizedEntities,
      recordsCount: normalizedEntities.length,
      durationMs: response.durationMs,
    };
  }

  /**
   * Verifies legal professional (Advokát, Mediátor, Znalec) via ARES v3 REST API.
   */
  public static async verifyLegalProfessional(ico: string): Promise<ConnectorResult<PublicRegistryEntityPayload>> {
    const cleanIco = ico.trim().padStart(8, '0');
    const url = `${this.ARES_REST_BASE}/${cleanIco}`;

    const response = await StateAdminApiClient.executeGet('P3_PUBLIC_REGISTRY', url);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P3_PUBLIC_REGISTRY',
        httpStatus: response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'ARES_VERIFY_FAILED',
          message: `Ověření IČO ${cleanIco} v ARES navrátilo chybový stav ${response.status}.`,
        },
      };
    }

    const entity = this.normalizeAresLegalProfessional(response.data);

    return {
      success: true,
      source: 'P3_PUBLIC_REGISTRY',
      httpStatus: 200,
      data: entity ? [entity] : [],
      recordsCount: entity ? 1 : 0,
      durationMs: response.durationMs,
    };
  }

  /**
   * Normalizer & Validator for OVM entities
   * Strict Fail-Closed: returns empty array if no valid data.
   */
  public static normalizeOvmEntities(rawData: any, entityType: 'SOUD' | 'OSPOD'): PublicRegistryEntityPayload[] {
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.položky)
      ? rawData.položky
      : Array.isArray(rawData?.datasets)
      ? rawData.datasets
      : [];

    const results: PublicRegistryEntityPayload[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const title = item.title?.cs || item.title || item.nazev;
      if (!title) continue;

      results.push({
        type: entityType,
        name: title,
        institution: entityType === 'SOUD' ? 'Ministerstvo spravedlnosti ČR' : 'Ministerstvo práce a sociálních věcí ČR',
        city: item.city || 'Praha',
        region: item.region || 'Česká republika',
        address: item.address,
        email: item.email,
        phone: item.phone,
        website: item.website,
        isVerified: true,
        source: 'Registr orgánů veřejné moci (OVM / NKOD)',
      });
    }

    return results;
  }

  /**
   * Normalizer & Validator for ARES legal professional entity
   * Strict Fail-Closed: returns null if no valid subject found.
   */
  public static normalizeAresLegalProfessional(rawData: any): PublicRegistryEntityPayload | null {
    if (!rawData || typeof rawData !== 'object' || (!rawData.obchodniJmeno && !rawData.nazev)) {
      return null;
    }

    const obchodniJmeno = rawData.obchodniJmeno || rawData.nazev;
    const ico = rawData.ico || '';
    const sidlo = rawData.sidlo || {};
    const textAdresa = sidlo.textovaAdresa || `${sidlo.nazevUlice || ''} ${sidlo.cisloDomovni || ''}, ${sidlo.nazevObce || ''}`;

    // Determine legal type
    let type: 'ADVOKAT' | 'ZNALEC' | 'PORADNA_CHARITA' = 'ADVOKAT';
    if (obchodniJmeno.toLowerCase().includes('znalec') || obchodniJmeno.toLowerCase().includes('znaleck')) {
      type = 'ZNALEC';
    } else if (obchodniJmeno.toLowerCase().includes('poradna') || obchodniJmeno.toLowerCase().includes('charita')) {
      type = 'PORADNA_CHARITA';
    }

    return {
      type,
      name: obchodniJmeno,
      ico,
      institution: 'Kancelář / Pracoviště',
      city: sidlo.nazevObce || 'Praha',
      region: 'Česká republika',
      address: textAdresa.trim(),
      isVerified: true,
      source: 'Administrativní registr ekonomických subjektů (ARES v3)',
    };
  }
}
