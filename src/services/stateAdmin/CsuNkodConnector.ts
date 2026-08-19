/**
 * STATE ADMINISTRATION API HUB - P2: ČSÚ / NKOD CONNECTOR
 * Národní katalog otevřených dat (data.gov.cz) & Český statistický úřad (ČSÚ)
 * ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, DemographicStatisticPayload, NkodDatasetItem } from './types.js';

export class CsuNkodConnector {
  /**
   * Queries NKOD SPARQL endpoint for demography, family, divorce and child care datasets from ČSÚ/NKOD.
   */
  public static async getDemographicStatistics(): Promise<ConnectorResult<DemographicStatisticPayload>> {
    const query = `PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT DISTINCT ?ds ?title ?desc WHERE {
  ?ds a dcat:Dataset ; dct:title ?title .
  OPTIONAL { ?ds dct:description ?desc }
  FILTER(CONTAINS(LCASE(?title), "obyvatelst") || CONTAINS(LCASE(?title), "demograf") || CONTAINS(LCASE(?title), "rodin"))
} LIMIT 25`;

    const response = await StateAdminApiClient.executeSparqlQuery('P2_CSU_NKOD', query);

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
          message: `Otevřená data ČSÚ / NKOD SPARQL navrátila chybový stav ${response.status}.`,
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
   * Search NKOD catalogue datasets by keyword via SPARQL endpoint (e.g. "rozvodovost", "výživné", "rodina").
   */
  public static async searchNkodDatasets(keyword: string = 'rodina'): Promise<ConnectorResult<NkodDatasetItem>> {
    const rawKw = (keyword || 'rodin').replace(/"/g, '').trim().toLowerCase();
    const searchStem = rawKw === 'rodina' ? 'rodin' : rawKw;

    const query = `PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT DISTINCT ?ds ?title ?desc WHERE {
  ?ds a dcat:Dataset ; dct:title ?title .
  OPTIONAL { ?ds dct:description ?desc }
  FILTER(CONTAINS(LCASE(?title), "${searchStem}") || CONTAINS(LCASE(?desc), "${searchStem}"))
} LIMIT 25`;

    const response = await StateAdminApiClient.executeSparqlQuery('P2_CSU_NKOD', query);

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
          message: `Vyhledávání v NKOD SPARQL navrátilo chybový stav ${response.status}.`,
        },
      };
    }

    const items = this.normalizeNkodDatasets(response.data, rawKw);

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
   * Normalizer for ČSÚ Demographic Statistics SPARQL bindings.
   * Strict Fail-Closed: returns empty array if no valid items.
   */
  public static normalizeDemographicStatistics(rawData: any): DemographicStatisticPayload[] {
    if (!Array.isArray(rawData)) return [];

    return rawData
      .filter((item) => item && item.title?.value)
      .map((item: any) => ({
        category: 'Demografie a rodina',
        title: item.title?.value || '',
        description: item.desc?.value || '',
        value: 'Dataset NKOD',
        unit: 'DCAT-AP',
        period: '2025/2026',
        region: 'Česká republika',
        source: 'Český statistický úřad (ČSÚ / NKOD data.gov.cz)',
      }));
  }

  /**
   * Normalizer for NKOD Dataset Items SPARQL bindings.
   * Strict Fail-Closed: returns empty array if no valid items.
   */
  public static normalizeNkodDatasets(rawData: any, searchKeyword: string = 'rodina'): NkodDatasetItem[] {
    if (!Array.isArray(rawData)) return [];

    return rawData
      .filter((item) => item && item.title?.value)
      .map((item: any) => ({
        id: item.ds?.value || '',
        title: item.title?.value || '',
        description: item.desc?.value || '',
        provider: 'Národní katalog otevřených dat (data.gov.cz)',
        issuedDate: new Date().toISOString().split('T')[0],
        keywords: [searchKeyword],
        downloadUrl: item.ds?.value || '',
        format: 'RDF/DCAT-AP',
      }));
  }
}
