/**
 * STATE ADMINISTRATION API HUB - P4: E-LEGISLATIVA & E-SBÍRKA CONNECTOR
 * e-Sbírka REST API (https://api.e-sbirka.gov.cz) & e-Legislativa (https://api.e-legislativa.gov.cz)
 * STRICT OFFICIAL CONTRACT & ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, LegislativeBillPayload } from './types.js';

export class ELegislativaConnector {
  private static readonly ESBIRKA_BASE = 'https://api.e-sbirka.gov.cz';
  private static readonly ELEGISLATIVA_BASE = 'https://api.e-legislativa.gov.cz';

  /**
   * Fetches legislative documents & bills from official e-Sbírka / e-Legislativa REST API.
   * Requires ESBIRKA_API_KEY in process.env. Fails closed without making upstream calls if key missing.
   */
  public static async getLegislativeBills(actCodeAffected: string = '89/2012'): Promise<ConnectorResult<LegislativeBillPayload>> {
    const apiKey = process.env.ESBIRKA_API_KEY || '';

    // Strict Fail-Closed if API key missing: DO NOT call upstream without key
    if (!apiKey) {
      return {
        success: false,
        source: 'P4_E_LEGISLATIVA',
        httpStatus: 503,
        data: [],
        recordsCount: 0,
        durationMs: 0,
        error: {
          code: 'E_LEGISLATIVA_AUTH_REQUIRED',
          message: 'Chybí přístupový klíč ESBIRKA_API_KEY v proměnných prostředí pro e-Sbírka / e-Legislativa API.',
        },
      };
    }

    const headers: Record<string, string> = {
      'esel-api-access-key': apiKey,
    };

    // Official e-Sbírka contract path formatting: /dokumenty-sbirky/%2Fsb%2F2012%2F89
    const parts = actCodeAffected.split('/');
    const number = parts[0] || '89';
    const year = parts[1] || '2012';
    const actIriPath = encodeURIComponent(`/sb/${year}/${number}`);
    const url = `${this.ESBIRKA_BASE}/dokumenty-sbirky/${actIriPath}`;

    const response = await StateAdminApiClient.executeGet('P4_E_LEGISLATIVA', url, headers);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P4_E_LEGISLATIVA',
        httpStatus: response.status === 401 ? 401 : response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'E_LEGISLATIVA_FETCH_FAILED',
          message: `e-Sbírka / e-Legislativa API navrátila chybový stav ${response.status}.`,
        },
      };
    }

    const normalizedBills = this.normalizeLegislativeBills(response.data, actCodeAffected);

    return {
      success: true,
      source: 'P4_E_LEGISLATIVA',
      httpStatus: 200,
      data: normalizedBills,
      recordsCount: normalizedBills.length,
      durationMs: response.durationMs,
    };
  }

  /**
   * Normalizer & Validator for e-Sbírka / e-Legislativa bills payload
   * Strict Fail-Closed: returns empty array if no valid items parsed.
   */
  public static normalizeLegislativeBills(rawData: any, actCodeAffected: string): LegislativeBillPayload[] {
    if (!rawData || typeof rawData !== 'object') return [];

    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.položky)
      ? rawData.položky
      : Array.isArray(rawData?.dokumenty)
      ? rawData.dokumenty
      : rawData.nazev || rawData.iri
      ? [rawData]
      : [];

    const results: LegislativeBillPayload[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const title = item.nazev || item.title || item.cisloSekce || item.iri;
      if (!title) continue;

      let billNumber = 'Neuvedeno';
      if (item.cisloTisku) {
        billNumber = String(item.cisloTisku);
      } else if (item.kod) {
        billNumber = String(item.kod);
      } else if (item.iri) {
        billNumber = String(item.iri).split('/').pop() || 'Neuvedeno';
      }

      let submittedAt = item.datumPrijeti || item.datumVyhlaseni || 'Neuvedeno';
      // Basic validation to prevent "Invalid Date" scenarios down the line
      if (submittedAt !== 'Neuvedeno' && isNaN(Date.parse(submittedAt))) {
        submittedAt = 'Neuvedeno';
      }

      results.push({
        billNumber,
        title,
        actCodeAffected,
        status: item.stav === 'SCHVALENO' ? 'PASSED' : item.stav === 'ZAMITNUTO' ? 'REJECTED' : 'READING_2',
        proposedBy: item.navrhovatel || 'Neuvedeno',
        submittedAt,
        summary: item.anotace || item.popis || '',
        sourceUri: item.iri ? `${this.ESBIRKA_BASE}${item.iri}` : `${this.ESBIRKA_BASE}/dokumenty-sbirky`,
      });
    }

    return results;
  }
}
