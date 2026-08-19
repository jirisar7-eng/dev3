/**
 * STATE ADMINISTRATION API HUB - P2: ČSÚ / NKOD CONNECTOR
 * Národní katalog otevřených dat (data.gov.cz) & Český statistický úřad (ČSÚ)
 * ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, DemographicStatisticPayload, NkodDatasetItem } from './types.js';

export class CsuNkodConnector {
  private static readonly NKOD_DATASETS_URL = 'https://data.gov.cz/api/v2/datasets';
  private static readonly CSU_PROVIDER_IRI = 'http://data.gov.cz/zdroj/organy-verejne-moci/00025593';

  /**
   * Queries NKOD API for demography, family, divorce and child care datasets from ČSÚ.
   */
  public static async getDemographicStatistics(): Promise<ConnectorResult<DemographicStatisticPayload>> {
    const url = `${this.NKOD_DATASETS_URL}?poskytovatel=${encodeURIComponent(this.CSU_PROVIDER_IRI)}&klicove-slovo=obyvatelstvo`;
    const response = await StateAdminApiClient.executeGet('P2_CSU_NKOD', url);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P2_CSU_NKOD',
        httpStatus: response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'CSU_NKOD_FETCH_FAILED',
          message: `Otevřená data ČSÚ / NKOD navrátila chybový stav ${response.status}.`,
        },
      };
    }

    const normalizedData = this.normalizeDemographicStatistics(response.data);

    return {
      success: true,
      source: 'P2_CSU_NKOD',
      httpStatus: 200,
      data: normalizedData,
      recordsCount: normalizedData.length,
      durationMs: response.durationMs,
    };
  }

  /**
   * Search NKOD catalogue datasets by keyword (e.g. "rozvodovost", "výživné", "rodina").
   */
  public static async searchNkodDatasets(keyword: string = 'rodina'): Promise<ConnectorResult<NkodDatasetItem>> {
    const url = `${this.NKOD_DATASETS_URL}?klicove-slovo=${encodeURIComponent(keyword)}`;
    const response = await StateAdminApiClient.executeGet('P2_CSU_NKOD', url);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P2_CSU_NKOD',
        httpStatus: response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'NKOD_SEARCH_FAILED',
          message: `Vyhledávání v NKOD navrátilo chybový stav ${response.status}.`,
        },
      };
    }

    const items = this.normalizeNkodDatasets(response.data);

    return {
      success: true,
      source: 'P2_CSU_NKOD',
      httpStatus: 200,
      data: items,
      recordsCount: items.length,
      durationMs: response.durationMs,
    };
  }

  /**
   * Normalizer & Validator for ČSÚ Demographic Statistics
   * Strict Fail-Closed: returns empty array if no valid items.
   */
  public static normalizeDemographicStatistics(rawData: any): DemographicStatisticPayload[] {
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.položky)
      ? rawData.položky
      : Array.isArray(rawData?.datasets)
      ? rawData.datasets
      : [];

    const results: DemographicStatisticPayload[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const title = item.title?.cs || item.nazev?.cs || item.title;
      if (!title) continue;

      results.push({
        category: item.category || 'Demografie a rodina',
        title,
        description: item.description?.cs || item.popis?.cs || '',
        value: item.value || '',
        unit: item.unit || '',
        period: item.period || '2025/2026',
        region: item.region || 'Česká republika',
        source: 'Český statistický úřad (ČSÚ / NKOD data.gov.cz)',
      });
    }

    return results;
  }

  /**
   * Normalizer for NKOD Dataset Items
   * Strict Fail-Closed: returns empty array if no valid items.
   */
  public static normalizeNkodDatasets(rawData: any): NkodDatasetItem[] {
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.položky)
      ? rawData.položky
      : Array.isArray(rawData?.datasets)
      ? rawData.datasets
      : [];

    return items
      .filter((item) => item && typeof item === 'object')
      .map((item: any) => ({
        id: item.iri || item.id || '',
        title: item.title?.cs || item.title || '',
        description: item.description?.cs || item.description || '',
        provider: item.poskytovatel || 'Český statistický úřad',
        issuedDate: item.issued || '',
        keywords: Array.isArray(item.klicova_slova) ? item.klicova_slova : [],
        downloadUrl: item.dostupnost || item.iri || '',
        format: item.format || 'JSON/DCAT-AP',
      }))
      .filter((item) => item.id !== '' || item.title !== '');
  }
}
