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
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    connectors: Record<
      string,
      {
        name: string;
        priority: string;
        status: 'OK' | 'ERROR' | 'UNCHECKED';
        lastHttpStatus?: number;
      }
    >;
    auditLogsCount: number;
  }> {
    const audits = StateAdminApiClient.getAuditLogs();

    const getConnectorLastAudit = (source: string) => {
      return audits.find((a) => a.source === source);
    };

    const p1Audit = getConnectorLastAudit('P1_JUSTICE');
    const p2Audit = getConnectorLastAudit('P2_CSU_NKOD');
    const p3Audit = getConnectorLastAudit('P3_PUBLIC_REGISTRY');
    const p4Audit = getConnectorLastAudit('P4_E_LEGISLATIVA');

    const connectors = {
      P1_JUSTICE: {
        name: 'Ministerstvo spravedlnosti / OpenData (P1)',
        priority: 'P1',
        status: p1Audit ? (p1Audit.success ? 'OK' : 'ERROR') : 'OK',
        lastHttpStatus: p1Audit?.httpStatus,
      },
      P2_CSU_NKOD: {
        name: 'ČSÚ / Národní katalog otevřených dat (P2)',
        priority: 'P2',
        status: p2Audit ? (p2Audit.success ? 'OK' : 'ERROR') : 'OK',
        lastHttpStatus: p2Audit?.httpStatus,
      },
      P3_PUBLIC_REGISTRY: {
        name: 'Veřejné registry / OVM Soudy & OSPOD (P3)',
        priority: 'P3',
        status: p3Audit ? (p3Audit.success ? 'OK' : 'ERROR') : 'OK',
        lastHttpStatus: p3Audit?.httpStatus,
      },
      P4_E_LEGISLATIVA: {
        name: 'e-Legislativa / Sněmovní tisky (P4)',
        priority: 'P4',
        status: p4Audit ? (p4Audit.success ? 'OK' : 'ERROR') : 'OK',
        lastHttpStatus: p4Audit?.httpStatus,
      },
    };

    const hasError = Object.values(connectors).some((c) => c.status === 'ERROR');

    return {
      status: hasError ? 'DEGRADED' : 'HEALTHY',
      connectors,
      auditLogsCount: audits.length,
    };
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
