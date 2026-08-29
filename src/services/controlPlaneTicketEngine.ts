import { PrismaClient, SynthesisSource, SynthesisSeverity, SynthesisCategory, User } from '@prisma/client';
import { ControlPlaneFinding } from '../types/controlPlane';
import { ControlPlaneRiskEngine } from './controlPlaneRiskEngine';
import { AuditService } from './auditService';

const prisma = new PrismaClient();

export class ControlPlaneTicketEngine {
  
  public static mapSeverity(severity: string): SynthesisSeverity {
    switch (severity) {
      case 'P0': return 'P0_CRITICAL';
      case 'P1': return 'P1_HIGH';
      case 'P2': return 'P2_MEDIUM';
      case 'P3': return 'P3_LOW';
      default: return 'INFO';
    }
  }

  public static mapSource(source: string): SynthesisSource {
    const validSources = ['QA_ENGINE', 'AUDIT_DOCUMENT', 'CODERABBIT', 'SUPPORT_PORTAL', 'MANUAL_ADMIN', 'QA_RUN', 'SUPPORT_TICKET', 'COMMUNITY_FEEDBACK', 'MANUAL_ENTRY'];
    // For ControlPlane sources, map to QA_ENGINE if not matched, or maybe we just add to prisma? 
    // Prisma model hasn't been changed.
    return 'QA_ENGINE'; // Safe fallback
  }

  public static mapCategory(title: string, description: string): SynthesisCategory {
    const text = (title + ' ' + description).toLowerCase();
    if (text.includes('security') || text.includes('únik') || text.includes('rbac')) return 'SECURITY';
    if (text.includes('data') || text.includes('database')) return 'DATA_INTEGRITY';
    if (text.includes('api')) return 'API';
    if (text.includes('ui') || text.includes('ux')) return 'UX';
    if (text.includes('performance') || text.includes('zpomalení')) return 'PERFORMANCE';
    return 'FUNCTIONAL';
  }

  public static async processFinding(
    finding: ControlPlaneFinding,
    user: any,
    ipAddress: string = '127.0.0.1'
  ): Promise<{ ticketId: string; isDuplicate: boolean }> {
    
    // 1. Calculate Deduplication Fingerprint
    const dedupHash = ControlPlaneRiskEngine.generateFingerprint(
      finding.source, 
      finding.title, 
      finding.affectedResources
    );
    finding.dedupHash = dedupHash;

    // 2. Check for Duplicates
    const existingTicket = await prisma.synthesisTicket.findUnique({
      where: { dedupHash }
    });

    if (existingTicket) {
      // 3a. Duplicate found - add event instead of new ticket
      await prisma.synthesisTicketEvent.create({
        data: {
          ticketId: existingTicket.id,
          eventType: 'FINDING_REOCCURRED',
          actorId: user.id,
          actorName: user.email,
          metadata: {
            findingId: finding.findingId,
            detectedAt: finding.detectedAt,
            confidence: finding.confidence
          }
        }
      });

      await AuditService.recordLog(
        'CONTROL_PLANE_FINDING_REOCCURRED',
        'SYSTEM',
        `Duplicitní nález '${finding.title}' byl přidán k existujícímu ticketu #${existingTicket.ticketNumber}`,
        user,
        ipAddress
      );

      return { ticketId: existingTicket.id, isDuplicate: true };
    }

    // 3b. Create new ticket
    const ticket = await prisma.synthesisTicket.create({
      data: {
        title: finding.title,
        description: `${finding.description}\n\n**Impact:**\nSecurity: ${finding.securityImpact}\nProduction: ${finding.productionImpact}\nUser: ${finding.userImpact}\n\n**Score:** ${finding.priorityScore} (${finding.priorityReason})\n**Confidence:** ${finding.confidence}\n**Affected:** ${finding.affectedResources.join(', ')}`,
        source: this.mapSource(finding.source),
        severity: this.mapSeverity(finding.severity),
        category: this.mapCategory(finding.title, finding.description),
        status: 'DISCOVERED',
        dedupHash: dedupHash
      }
    });

    await prisma.synthesisTicketEvent.create({
      data: {
        ticketId: ticket.id,
        eventType: 'TICKET_CREATED',
        actorId: user.id,
        actorName: user.email,
        metadata: {
          findingId: finding.findingId,
          risk: finding.severity,
          priorityScore: finding.priorityScore
        }
      }
    });

    await AuditService.recordLog(
      'CONTROL_PLANE_TICKET_CREATED',
      'SYSTEM',
      `Vytvořen nový SynthesisTicket #${ticket.ticketNumber} z nálezu '${finding.title}' (Severity: ${finding.severity})`,
      user,
      ipAddress
    );

    return { ticketId: ticket.id, isDuplicate: false };
  }

  public static async analyzeRootCause(
    symptoms: string[],
    affectedResources: string[]
  ): Promise<{ rootCause: string; isSecondaryEffect: boolean; blastRadius: string[] }> {
    // Deterministic logic for root cause
    // If symptoms are just "API timeout" but resource is "Database", root cause is likely DB
    let isSecondaryEffect = false;
    let rootCause = symptoms.join('; ');
    const blastRadius = [...affectedResources];

    if (symptoms.some(s => s.toLowerCase().includes('timeout')) && affectedResources.some(r => r.toLowerCase().includes('db') || r.toLowerCase().includes('database'))) {
      rootCause = 'Database overload / lock leading to API timeout';
      isSecondaryEffect = true;
      blastRadius.push('API Layer');
    }

    if (symptoms.some(s => s.toLowerCase().includes('ui')) && affectedResources.some(r => r.toLowerCase().includes('api'))) {
      rootCause = 'API Contract violation causing frontend render failure';
      isSecondaryEffect = true;
      blastRadius.push('Frontend UI');
    }

    return { rootCause, isSecondaryEffect, blastRadius };
  }
}
