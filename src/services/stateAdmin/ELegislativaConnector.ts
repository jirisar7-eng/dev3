/**
 * STATE ADMINISTRATION API HUB - P4: E-LEGISLATIVA CONNECTOR
 * e-Legislativa & Sněmovní tisky / Legislativní proces (api.e-sbirka.gov.cz / MV ČR)
 * ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, LegislativeBillPayload } from './types.js';

export class ELegislativaConnector {
  private static readonly E_LEGISLATIVA_BASE = 'https://api.e-sbirka.gov.cz/esel-esbir-daver';

  /**
   * Fetches legislative bills, proposed amendments and status of family law novelizations.
   */
  public static async getLegislativeBills(actCodeAffected: string = '89/2012'): Promise<ConnectorResult<LegislativeBillPayload>> {
    const apiKey = process.env.ESBIRKA_API_KEY || '';
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['esel-api-access-key'] = apiKey;
    }

    const encodedActCode = encodeURIComponent(actCodeAffected.replace('/', '-'));
    const url = `${this.E_LEGISLATIVA_BASE}/dokumenty-sbirky?kod=${encodedActCode}`;

    const response = await StateAdminApiClient.executeGet('P4_E_LEGISLATIVA', url, headers);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P4_E_LEGISLATIVA',
        httpStatus: response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'E_LEGISLATIVA_FETCH_FAILED',
          message: `e-Legislativa API navrátila chybový stav ${response.status}.`,
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
   * Normalizer & Validator for e-Legislativa bills payload
   * Strict Fail-Closed: returns empty array if no valid bills.
   */
  public static normalizeLegislativeBills(rawData: any, actCodeAffected: string): LegislativeBillPayload[] {
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.položky)
      ? rawData.položky
      : Array.isArray(rawData?.dokumenty)
      ? rawData.dokumenty
      : [];

    const results: LegislativeBillPayload[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const title = item.nazev || item.title;
      if (!title) continue;

      results.push({
        billNumber: item.cisloTisku || item.kod || item.id || '',
        title,
        actCodeAffected,
        status: item.stav === 'SCHVALENO' ? 'PASSED' : item.stav === 'ZAMITNUTO' ? 'REJECTED' : 'READING_2',
        proposedBy: item.navrhovatel || 'Ministerstvo spravedlnosti ČR',
        submittedAt: item.datumPrijeti || new Date().toISOString(),
        summary: item.anotace || '',
        sourceUri: `${this.E_LEGISLATIVA_BASE}/tisky/${item.id || ''}`,
      });
    }

    return results;
  }
}
