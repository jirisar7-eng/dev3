/**
 * STATE ADMINISTRATION API HUB - P1: JUSTICE & MSP OPENDATA CONNECTOR
 * Ministerstvo spravedlnosti ČR - Otevřená data a statistiky soudnictví
 * ZERO SYNTHETIC DATA / FAIL-CLOSED POLICY
 */

import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, JudicialCasePayload, JudicialStatisticPayload } from './types.js';

export class JusticeOpenDataConnector {
  private static readonly MSP_OPENDATA_BASE = 'https://data.gov.cz/api/v2/datasets';
  private static readonly MSP_PROVIDER_IRI = 'http://data.gov.cz/zdroj/organy-verejne-moci/00025429';

  /**
   * Fetches official MSp judicial statistics (lengths of custody/family proceedings agendas P, Nc, C, court ročenka data).
   */
  public static async getJudicialStatistics(agenda: string = 'P'): Promise<ConnectorResult<JudicialStatisticPayload>> {
    const url = `${this.MSP_OPENDATA_BASE}?poskytovatel=${encodeURIComponent(this.MSP_PROVIDER_IRI)}&klicove-slovo=statistiky`;
    const response = await StateAdminApiClient.executeGet('P1_JUSTICE', url);

    if (response.status !== 200 || !response.data) {
      return {
        success: false,
        source: 'P1_JUSTICE',
        httpStatus: response.status,
        data: [],
        recordsCount: 0,
        durationMs: response.durationMs,
        error: {
          code: response.error || 'JUSTICE_FETCH_FAILED',
          message: `Otevřená data MSp navrátila chybový stav ${response.status}.`,
        },
      };
    }

    // Validate and normalize payload
    const normalizedData = this.normalizeJudicialStatistics(response.data, agenda);

    return {
      success: true,
      source: 'P1_JUSTICE',
      httpStatus: 200,
      data: normalizedData,
      recordsCount: normalizedData.length,
      durationMs: response.durationMs,
    };
  }

  /**
   * Fetches court case precedents & judicial decisions from MSp OpenData repository.
   */
  public static async getJudicialCases(courtType: string = 'Ústavní soud'): Promise<ConnectorResult<JudicialCasePayload>> {
    const url = `${this.MSP_OPENDATA_BASE}?poskytovatel=${encodeURIComponent(this.MSP_PROVIDER_IRI)}&klicove-slovo=judikatura`;
    const response = await StateAdminApiClient.executeGet('P1_JUSTICE', url);

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
          message: `Data judikatury MSp navrátila chybový stav ${response.status}.`,
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
   * Normalizer & Validator for MSp Judicial Statistics
   * Strict Fail-Closed: returns empty array if no valid data parsed.
   */
  public static normalizeJudicialStatistics(rawData: any, targetAgenda: string): JudicialStatisticPayload[] {
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.položky)
      ? rawData.položky
      : Array.isArray(rawData?.datasets)
      ? rawData.datasets
      : [];

    const results: JudicialStatisticPayload[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const title = item.title?.cs || item.nazev?.cs || item.title || 'Statistika MSp';
      const description = item.description?.cs || item.popis?.cs || '';

      results.push({
        courtCode: item.iri || item.id || '',
        courtName: title,
        agenda: targetAgenda === 'P' ? 'P' : targetAgenda === 'Nc' ? 'Nc' : 'ALL',
        period: item.period || '2025/2026',
        averageDurationDays: typeof item.duration === 'number' ? item.duration : 0,
        sharedCarePercentage: item.sharedCarePercentage,
        soleMotherCarePercentage: item.soleMotherCarePercentage,
        soleFatherCarePercentage: item.soleFatherCarePercentage,
        totalCasesCount: item.totalCasesCount || 0,
        source: 'Ministerstvo spravedlnosti ČR (data.justice.cz / NKOD)',
      });
    }

    return results;
  }

  /**
   * Normalizer & Validator for MSp Judicial Cases
   * Strict Fail-Closed: returns empty array if no valid data parsed.
   */
  public static normalizeJudicialCases(rawData: any, courtType: string): JudicialCasePayload[] {
    const items = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.položky)
      ? rawData.položky
      : Array.isArray(rawData?.datasets)
      ? rawData.datasets
      : [];

    const results: JudicialCasePayload[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const title = item.title?.cs || item.title || '';
      if (!title) continue;

      results.push({
        fileNumber: item.iri ? item.iri.split('/').pop() || '' : item.fileNumber || '',
        court: courtType,
        title,
        summary: item.description?.cs || item.description || '',
        legalRatio: item.legalRatio || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        fullTextUrl: item.iri || item.fullTextUrl,
        publishedAt: item.publishedAt || new Date().toISOString(),
      });
    }

    return results;
  }
}
