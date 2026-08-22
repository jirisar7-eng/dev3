/**
 * STATE ADMINISTRATION API HUB - CENTRAL ORCHESTRATOR
 * Phase 5: State Administration API Hub Orchestrator Service
 */

import { CsuNkodConnector } from './CsuNkodConnector.js';
import { ELegislativaConnector } from './ELegislativaConnector.js';
import { JusticeOpenDataConnector } from './JusticeOpenDataConnector.js';
import { PublicRegistryConnector } from './PublicRegistryConnector.js';
import { StateAdminApiClient } from './StateAdminApiClient.js';
import { ConnectorResult, StateAdminAuditLog } from './types.js';

export class StateAdminHubService {
  /**
   * Health Check: Returns status and last audit for all 4 connectors.
   */
  public static async getHealthStatus(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
    connectors: Record<
      string,
      {
        id: string;
        name: string;
        provider: string;
        priority: string;
        status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
        lastHttpStatus?: number;
        durationMs?: number;
        lastCheckedAt?: string;
        lastSuccessAt?: string;
        errorMessage?: string;
        recordsCount?: number;
        endpoint: string;
      }
    >;
    auditLogsCount: number;
    lastCheckedAt: string;
  }> {
    const audits = StateAdminApiClient.getAuditLogs();

    const getConnectorAudits = (source: string) => {
      return audits.filter((a) => a.source === source);
    };

    const buildConnectorHealth = (
      id: string,
      name: string,
      provider: string,
      priority: string,
      endpoint: string
    ) => {
      const sourceAudits = getConnectorAudits(id);
      const lastAudit = sourceAudits[0];
      const lastSuccessAudit = sourceAudits.find((a) => a.success);

      let status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN' = 'UNKNOWN';

      if (!lastAudit) {
        status = 'UNKNOWN';
      } else if (lastAudit.success && lastAudit.httpStatus === 200) {
        status = 'HEALTHY';
      } else if (lastAudit.httpStatus === 501 || (lastAudit.httpStatus === 503 && id === 'P4_E_LEGISLATIVA')) {
        // 501 Not Implemented upstream or 503 Missing optional key
        status = 'DEGRADED';
      } else {
        status = 'UNAVAILABLE';
      }

      return {
        id,
        name,
        provider,
        priority,
        status,
        lastHttpStatus: lastAudit?.httpStatus,
        durationMs: lastAudit?.durationMs,
        lastCheckedAt: lastAudit?.timestamp ? new Date(lastAudit.timestamp).toISOString() : undefined,
        lastSuccessAt: lastSuccessAudit?.timestamp ? new Date(lastSuccessAudit.timestamp).toISOString() : undefined,
        errorMessage: lastAudit?.errorMessage,
        recordsCount: lastAudit?.recordsCount,
        endpoint,
      };
    };

    const connectors: Record<
      string,
      {
        id: string;
        name: string;
        provider: string;
        priority: string;
        status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
        lastHttpStatus?: number;
        durationMs?: number;
        lastCheckedAt?: string;
        lastSuccessAt?: string;
        errorMessage?: string;
        recordsCount?: number;
        endpoint: string;
      }
    > = {
      P1_JUSTICE: buildConnectorHealth(
        'P1_JUSTICE',
        'Otevřená data a judikatura MSp',
        'Ministerstvo spravedlnosti ČR',
        'P1',
        'https://data.gov.cz/sparql (MSp Datasets)'
      ),
      P2_CSU_NKOD: buildConnectorHealth(
        'P2_CSU_NKOD',
        'Demografické statistiky a NKOD',
        'Český statistický úřad & NKOD',
        'P2',
        'https://data.gov.cz/sparql (ČSÚ Datasets)'
      ),
      P3_PUBLIC_REGISTRY: buildConnectorHealth(
        'P3_PUBLIC_REGISTRY',
        'Registr orgánů veřejné moci (OVM)',
        'Soudy, OSPOD & ARES',
        'P3',
        'https://data.gov.cz/sparql (OVM Registry)'
      ),
      P4_E_LEGISLATIVA: buildConnectorHealth(
        'P4_E_LEGISLATIVA',
        'e-Sbírka & e-Legislativa API',
        'Ministerstvo vnitra ČR',
        'P4',
        'https://api.e-sbirka.gov.cz'
      ),
    };

    const statuses = Object.values(connectors).map((c) => c.status);
    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN' = 'HEALTHY';

    if (statuses.every((s) => s === 'UNKNOWN')) {
      overallStatus = 'UNKNOWN';
    } else if (statuses.some((s) => s === 'UNAVAILABLE')) {
      overallStatus = 'DEGRADED';
    } else if (statuses.some((s) => s === 'DEGRADED')) {
      overallStatus = 'DEGRADED';
    } else if (statuses.every((s) => s === 'HEALTHY')) {
      overallStatus = 'HEALTHY';
    }

    return {
      status: overallStatus,
      connectors,
      auditLogsCount: audits.length,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  /**
   * Run Live Diagnostic Health Check across all 4 connectors in parallel.
   */
  public static async performLiveHealthCheck(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
    connectors: Record<string, any>;
    auditLogsCount: number;
    lastCheckedAt: string;
  }> {
    // Run all connector queries with isolated try/catch so one failure never blocks others
    await Promise.allSettled([
      JusticeOpenDataConnector.getJudicialCases('Ústavní soud').catch(() => null),
      CsuNkodConnector.searchNkodDatasets('rodina').catch(() => null),
      PublicRegistryConnector.getOvmEntities('SOUD').catch(() => null),
      ELegislativaConnector.getLegislativeBills('89/2012').catch(() => null),
    ]);

    return this.getHealthStatus();
  }

  // P1: Justice / MSp
  public static async getJudicialStatistics(agenda: string = 'P'): Promise<ConnectorResult<any>> {
    return JusticeOpenDataConnector.getJudicialStatistics(agenda);
  }

  public static async getJudicialCases(courtType: string = 'Ústavní soud'): Promise<ConnectorResult<any>> {
    return JusticeOpenDataConnector.getJudicialCases(courtType);
  }

  // P2: ČSÚ / NKOD
  public static async getDemographicStatistics(): Promise<ConnectorResult<any>> {
    return CsuNkodConnector.getDemographicStatistics();
  }

  public static async searchNkodDatasets(keyword: string = 'rodina'): Promise<ConnectorResult<any>> {
    return CsuNkodConnector.searchNkodDatasets(keyword);
  }

  // P3: Public Registries
  public static async getOvmEntities(entityType: 'SOUD' | 'OSPOD' = 'SOUD'): Promise<ConnectorResult<any>> {
    return PublicRegistryConnector.getOvmEntities(entityType);
  }

  public static async verifyLegalProfessional(ico: string): Promise<ConnectorResult<any>> {
    return PublicRegistryConnector.verifyLegalProfessional(ico);
  }

  // P4: e-Legislativa
  public static async getLegislativeBills(actCodeAffected: string = '89/2012'): Promise<ConnectorResult<any>> {
    return ELegislativaConnector.getLegislativeBills(actCodeAffected);
  }

  // Audit Logs
  public static getAuditLogs(): StateAdminAuditLog[] {
    return StateAdminApiClient.getAuditLogs();
  }
}
