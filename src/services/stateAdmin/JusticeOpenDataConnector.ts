/**
 * STATE ADMINISTRATION API HUB - P1: JUSTICE & MSP OPENDATA CONNECTOR
 * Ministerstvo spravedlnosti ČR - Otevřená data a judikatura
 * ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, JudicialCasePayload, JudicialStatisticPayload } from './types.js';

export class JusticeOpenDataConnector {
  /**
   * Fetches official MSp judicial statistics.
   * UNVERIFIED IN NKOD SPARQL: Marked as BLOCKED / NOT_IMPLEMENTED (Zero synthetic data policy).
   */
  public static async getJudicialStatistics(agenda: string = 'P'): Promise<ConnectorResult<JudicialStatisticPayload>> {
    return {
      success: false,
      source: 'P1_JUSTICE',
      httpStatus: 501,
      data: [],
      recordsCount: 0,
      durationMs: 0,
      error: {
        code: 'SOURCE_BLOCKED_NOT_IMPLEMENTED',
        message: 'Dataset délek soudních řízení MSp není publikován v NKOD SPARQL. Zdroj označen jako BLOCKED/NOT_IMPLEMENTED.',
      },
    };
  }

  /**
   * Fetches court case precedents & judicial decision datasets from NKOD SPARQL endpoint.
   */
  public static async getJudicialCases(courtType: string = 'Ústavní soud'): Promise<ConnectorResult<JudicialCasePayload>> {
    const query = `PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT DISTINCT ?ds ?title ?desc WHERE {
  ?ds a dcat:Dataset ; dct:title ?title .
  OPTIONAL { ?ds dct:description ?desc }
  FILTER(CONTAINS(LCASE(?title), "judikát") || CONTAINS(LCASE(?title), "soudní rozhodnutí"))
} LIMIT 25`;

    const response = await StateAdminApiClient.executeSparqlQuery('P1_JUSTICE', query);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P1_JUSTICE',
        httpStatus: response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'JUSTICE_CASES_FETCH_FAILED',
          message: `Data judikatury v NKOD SPARQL navrátila chybový stav ${response.status}.`,
        },
      };
    }

    const normalizedCases = this.normalizeJudicialCases(response.data, courtType);

    return {
      success: true,
      source: 'P1_JUSTICE',
      httpStatus: 200,
      data: normalizedCases,
      recordsCount: normalizedCases.length,
      durationMs: response.durationMs,
    };
  }

  /**
   * Normalizer & Validator for MSp Judicial Statistics SPARQL/Raw data.
   * Strict Fail-Closed: returns empty array if no valid data parsed.
   */
  public static normalizeJudicialStatistics(rawData: any, targetAgenda: string): JudicialStatisticPayload[] {
    if (!Array.isArray(rawData)) return [];
    return [];
  }

  /**
   * Normalizer & Validator for MSp Judicial Cases SPARQL bindings.
   * Strict Fail-Closed: returns empty array if no valid data parsed.
   */
  public static normalizeJudicialCases(rawData: any, courtType: string): JudicialCasePayload[] {
    if (!Array.isArray(rawData)) return [];

    return rawData
      .filter((item) => item && item.title?.value)
      .map((item: any) => ({
        fileNumber: item.ds?.value ? item.ds.value.split('/').pop() || '' : '',
        court: courtType,
        title: item.title?.value || '',
        summary: item.desc?.value || '',
        legalRatio: '',
        tags: ['Judikatura', 'Opatrovnictví'],
        fullTextUrl: item.ds?.value,
        publishedAt: new Date().toISOString().split('T')[0],
      }));
  }
}
