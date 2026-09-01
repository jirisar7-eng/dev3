import { SynthesisSource, SynthesisSeverity, SynthesisCategory, SynthesisStatus } from '@prisma/client';
import { isPrismaAvailable, getPrismaClient, prisma } from '../db/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AuditRegistryEngine } from './audit/auditRegistryEngine';
import { KnowledgeMirrorService } from './audit/knowledgeMirrorService';

// Operational Types
export interface CreateAuditInput {
  title: string;
  scope: string;
  source: string;
  createdBy?: string;
  findings?: Array<{
    code: string;
    title: string;
    description: string;
    severity: 'P0' | 'P1' | 'P2' | 'P3';
    evidence?: string;
    recommendation?: string;
  }>;
}

export interface CreateFindingInput {
  auditId: string;
  code: string;
  title: string;
  description: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  evidence?: string;
  recommendation?: string;
}

export interface CreateTicketFromFindingInput {
  findingId: string;
  assignedToId?: string;
  createdById?: string;
}

export class SynthesisOperationsCore {
  /**
   * Helper to assert database availability.
   * STRICT P0 RULE: Throw actual HTTP 503 error if DB is unreachable.
   */
  private static assertDatabase() {
    if (!isPrismaAvailable()) {
      const err: any = new Error('Database server is not reachable. Synthesis Operations Core in safe fail-closed state.');
      err.statusCode = 503;
      err.code = 'DATABASE_UNAVAILABLE';
      throw err;
    }
  }

  /**
   * Helper to generate unique publicIds
   */
  public static generatePublicId(prefix: string): string {
    const dateStr = new Date().toISOString().replace(/[-T]/g, '').slice(0, 8);
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${dateStr}-${randomHex}`;
  }

  /**
   * Helper to map severity to SynthesisSeverity
   */
  public static mapSeverity(severity: string): SynthesisSeverity {
    switch (severity) {
      case 'P0': return 'P0_CRITICAL';
      case 'P1': return 'P1_HIGH';
      case 'P2': return 'P2_MEDIUM';
      case 'P3': return 'P3_LOW';
      default: return 'INFO';
    }
  }

  /**
   * Helper to map category based on title & description
   */
  public static mapCategory(title: string, description: string): SynthesisCategory {
    const text = (title + ' ' + description).toLowerCase();
    if (text.includes('security') || text.includes('rbac') || text.includes('autentiz') || text.includes('oprávnění')) {
      return 'SECURITY';
    }
    if (text.includes('data') || text.includes('databáz') || text.includes('integrita')) {
      return 'DATA_INTEGRITY';
    }
    if (text.includes('api') || text.includes('endpoint')) {
      return 'API';
    }
    if (text.includes('ui') || text.includes('ux') || text.includes('vzhled')) {
      return 'UX';
    }
    if (text.includes('výkon') || text.includes('rychlost') || text.includes('performance')) {
      return 'PERFORMANCE';
    }
    return 'FUNCTIONAL';
  }

  /**
   * Helper to map source based on string
   */
  public static mapSource(source: string): SynthesisSource {
    const validSources = ['QA_ENGINE', 'AUDIT_DOCUMENT', 'CODERABBIT', 'SUPPORT_PORTAL', 'MANUAL_ADMIN', 'QA_RUN', 'SUPPORT_TICKET', 'COMMUNITY_FEEDBACK', 'MANUAL_ENTRY'];
    if (validSources.includes(source)) {
      return source as SynthesisSource;
    }
    return 'MANUAL_ENTRY';
  }

  /**
   * 3. AUDIT CREATION WITH OUTBOX EVENT
   * Atomically registers a complete Audit, its findings, and queues outbox events.
   */
  public static async createAudit(input: CreateAuditInput) {
    this.assertDatabase();

    const auditId = crypto.randomUUID();
    const auditPublicId = this.generatePublicId('AUD');
    const createdBy = input.createdBy || 'SYSTEM';

    // Build the markdown path for Git/ledger mirroring
    const auditFilename = `AUDIT_${auditPublicId}.md`;
    const relativeAuditPath = `docs/audit/${auditFilename}`;
    const absoluteAuditPath = path.resolve(process.cwd(), relativeAuditPath);

    return await prisma.$transaction(async (tx) => {
      // 1. Save Audit in database
      const audit = await tx.audit.create({
        data: {
          id: auditId,
          publicId: auditPublicId,
          title: input.title,
          scope: input.scope,
          source: input.source,
          createdBy,
          status: 'COMPLETED',
        },
      });

      const findingsCreated = [];
      const outboxEventsToCreate = [];

      // 2. Save Findings and register outbox events
      if (input.findings && input.findings.length > 0) {
        for (const f of input.findings) {
          const findingId = crypto.randomUUID();
          const findingPublicId = this.generatePublicId('FND');

          const finding = await tx.auditFinding.create({
            data: {
              id: findingId,
              publicId: findingPublicId,
              auditId: audit.id,
              auditFilename,
              code: f.code,
              title: f.title,
              description: f.description,
              severity: f.severity,
              status: 'OPEN',
              evidence: f.evidence,
              recommendation: f.recommendation,
              verificationStatus: 'PENDING',
            },
          });

          findingsCreated.push(finding);

          // Queue outbox event for finding
          const findingEventId = crypto.randomUUID();
          outboxEventsToCreate.push({
            id: crypto.randomUUID(),
            eventId: findingEventId,
            eventType: 'FINDING_CREATED',
            aggregateType: 'Finding',
            aggregateId: findingId,
            actorId: createdBy,
            payload: {
              id: findingId,
              publicId: findingPublicId,
              auditId,
              code: f.code,
              title: f.title,
              severity: f.severity,
            },
          });
        }
      }

      // Queue outbox event for audit
      const auditEventId = crypto.randomUUID();
      outboxEventsToCreate.push({
        id: crypto.randomUUID(),
        eventId: auditEventId,
        eventType: 'AUDIT_CREATED',
        aggregateType: 'Audit',
        aggregateId: auditId,
        actorId: createdBy,
        payload: {
          id: auditId,
          publicId: auditPublicId,
          title: input.title,
          scope: input.scope,
          source: input.source,
        },
      });

      // 3. Atomically write to outbox
      await tx.outboxEvent.createMany({
        data: outboxEventsToCreate,
      });

      // 4. Mirror to disk (Audit Ledger) to integrate with AuditRegistryEngine and KnowledgeMirrorService
      try {
        const mdContent = this.generateAuditMarkdown(audit, findingsCreated);
        fs.writeFileSync(absoluteAuditPath, mdContent, 'utf-8');
      } catch (fsErr) {
        console.warn('[SynthesisOperationsCore] Disk mirroring failed (non-blocking for DB trans):', fsErr);
      }

      return {
        audit,
        findings: findingsCreated,
      };
    });
  }

  /**
   * Helper to write audit findings as markdown
   */
  private static generateAuditMarkdown(audit: any, findings: any[]): string {
    let md = `# ${audit.title}\n\n`;
    md += `**ID:** ${audit.publicId}\n`;
    md += `**Scope:** ${audit.scope}\n`;
    md += `**Source:** ${audit.source}\n`;
    md += `**Status:** ${audit.status}\n`;
    md += `**Datum:** ${audit.createdAt.toISOString().split('T')[0]}\n`;
    md += `**Vytvořil:** ${audit.createdBy}\n\n`;
    md += `## PŘEHLED NÁLEZŮ\n\n`;

    if (findings.length === 0) {
      md += `*Nebyly nalezeny žádné chyby.*\n`;
    } else {
      findings.forEach((f, idx) => {
        md += `### [${f.severity}] ${f.title} (${f.code})\n`;
        md += `**ID nálezu:** ${f.publicId}\n`;
        md += `**Popis:** ${f.description}\n`;
        if (f.evidence) md += `**Důkaz/Evidence:** \n\`\`\`\n${f.evidence}\n\`\`\`\n`;
        if (f.recommendation) md += `**Doporučení:** ${f.recommendation}\n`;
        md += `**Status:** ${f.status}\n\n`;
      });
    }

    return md;
  }

  /**
   * 5. TICKET CREATION WITH LIFECYCLE MANAGEMENT
   * Generates a ticket linked to a Finding -> Audit. Deduplication included.
   */
  public static async createTicketFromFinding(input: CreateTicketFromFindingInput) {
    this.assertDatabase();

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch Finding and link to Audit
      const finding = await tx.auditFinding.findUnique({
        where: { id: input.findingId },
        include: { audit: true },
      });

      if (!finding) {
        throw new Error(`Finding with ID ${input.findingId} not found.`);
      }

      // 2. Check Deduplication
      const dedupHash = crypto.createHash('sha256').update(`FINDING:${finding.id}`).digest('hex');
      const existingTicket = await tx.synthesisTicket.findUnique({
        where: { dedupHash },
      });

      if (existingTicket) {
        return {
          ticket: existingTicket,
          isDuplicate: true,
        };
      }

      const ticketId = crypto.randomUUID();
      const ticketPublicId = this.generatePublicId('TKT');
      const actorId = input.createdById || null;

      // 3. Create SynthesisTicket with NEW status
      const ticket = await tx.synthesisTicket.create({
        data: {
          id: ticketId,
          publicId: ticketPublicId,
          title: `[${finding.severity}] - ${finding.title}`,
          description: `Chyba z auditu: ${finding.auditFilename}\nKód chyby: ${finding.code}\n\n**Popis:**\n${finding.description}\n\n**Doporučení:**\n${finding.recommendation || 'Není specifikováno'}`,
          source: finding.audit ? this.mapSource(finding.audit.source) : 'MANUAL_ENTRY',
          severity: this.mapSeverity(finding.severity),
          category: this.mapCategory(finding.title, finding.description),
          status: 'NEW', // Lifecycle P0 state
          dedupHash,
          findingId: finding.id,
          auditId: finding.auditId,
          createdById: actorId,
          assignedToId: input.assignedToId || null,
          events: {
            create: [
              {
                eventType: 'TICKET_CREATED',
                actorId: actorId,
                actorName: actorId ? 'User' : 'System Copilot',
                toValue: 'NEW',
                metadata: {
                  findingId: finding.id,
                  severity: finding.severity,
                },
              },
            ],
          },
        },
      });

      // 4. Log Domain/Outbox event
      const eventId = crypto.randomUUID();
      await tx.outboxEvent.create({
        data: {
          id: crypto.randomUUID(),
          eventId,
          eventType: 'TICKET_CREATED',
          aggregateType: 'Ticket',
          aggregateId: ticketId,
          actorId,
          payload: {
            id: ticketId,
            publicId: ticketPublicId,
            title: ticket.title,
            status: 'NEW',
            findingId: finding.id,
            auditId: finding.auditId,
          },
        },
      });

      return {
        ticket,
        isDuplicate: false,
      };
    });
  }

  /**
   * 6. TICKET STATUS TRANSITION ENGINE
   * Enforces lifecycle constraints and logs status changed events.
   */
  public static async transitionTicketStatus(
    ticketId: string,
    toStatus: SynthesisStatus,
    actorId?: string,
    actorName: string = 'System'
  ) {
    this.assertDatabase();

    return await prisma.$transaction(async (tx) => {
      const ticket = await tx.synthesisTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error(`Ticket with ID ${ticketId} not found.`);
      }

      const fromStatus = ticket.status;
      if (fromStatus === toStatus) {
        return ticket;
      }

      // State Transition Validation
      const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        DISCOVERED: ['TRIAGED', 'PLANNED', 'CLOSED'],
        NEW: ['TRIAGED', 'PLANNED', 'CLOSED'],
        TRIAGED: ['PLANNED', 'CLOSED', 'NEW'],
        PLANNED: ['IN_PR', 'IMPLEMENTED', 'TRIAGED', 'CLOSED'],
        IN_PR: ['IMPLEMENTED', 'PLANNED', 'CLOSED'],
        IMPLEMENTED: ['VERIFICATION', 'IN_PR'], // Direct transition from IMPLEMENTED to CLOSED is forbidden! Must go through VERIFICATION or be verified via verifyTicket
        VERIFICATION: ['CLOSED', 'REOPENED', 'IMPLEMENTED'],
        VERIFIED_LOCAL: ['RELEASED', 'CLOSED'],
        RELEASED: ['REOPENED', 'CLOSED'],
        CLOSED: ['REOPENED'],
        RESOLVED: ['REOPENED'],
        REOPENED: ['TRIAGED', 'PLANNED', 'IN_PR', 'IMPLEMENTED', 'CLOSED']
      };

      const allowed = ALLOWED_TRANSITIONS[fromStatus];
      if (!allowed || !allowed.includes(toStatus)) {
        throw new Error(`State Transition Forbidden: Direct transition from ${fromStatus} to ${toStatus} is not allowed in the operational lifecycle.`);
      }

      // Update Ticket status
      const updatedTicket = await tx.synthesisTicket.update({
        where: { id: ticketId },
        data: {
          status: toStatus,
          resolvedAt: toStatus === 'CLOSED' || toStatus === 'RESOLVED' ? new Date() : ticket.resolvedAt,
        },
      });

      // Log SynthesisTicketEvent
      await tx.synthesisTicketEvent.create({
        data: {
          ticketId,
          eventType: 'TICKET_STATUS_CHANGED',
          actorId,
          actorName,
          fromValue: fromStatus,
          toValue: toStatus,
          metadata: {
            transitionedBy: actorName,
          },
        },
      });

      // Determine specific outbox Event Type
      let eventType = 'TICKET_STATUS_CHANGED';
      if (toStatus === 'IMPLEMENTED') {
        eventType = 'TICKET_IMPLEMENTED';
      } else if (toStatus === 'REOPENED') {
        eventType = 'TICKET_REOPENED';
      }

      // Write to transactional outbox
      const eventId = crypto.randomUUID();
      await tx.outboxEvent.create({
        data: {
          id: crypto.randomUUID(),
          eventId,
          eventType,
          aggregateType: 'Ticket',
          aggregateId: ticketId,
          actorId,
          payload: {
            id: ticketId,
            fromStatus,
            toStatus,
          },
        },
      });

      return updatedTicket;
    });
  }

  /**
   * 7. TICKET VERIFICATION ENGINE WITH IMMUTABLE HISTORY
   * Verifies the implemented ticket, creates Verification records, and drives state:
   * PASS -> CLOSED
   * FAIL -> REOPENED
   */
  public static async verifyTicket(
    ticketId: string,
    result: 'PASS' | 'FAIL',
    evidence: string,
    verifiedBy: string
  ) {
    this.assertDatabase();

    return await prisma.$transaction(async (tx) => {
      const ticket = await tx.synthesisTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error(`Ticket with ID ${ticketId} not found.`);
      }

      if (ticket.status === 'CLOSED') {
        throw new Error('Ticket is already CLOSED. Active verification cannot be performed on closed tickets.');
      }

      if (result === 'PASS' && (!evidence || !evidence.trim())) {
        throw new Error('Verification evidence is required for a PASS result to maintain ledger integrity.');
      }

      // Add Verification history record
      const verification = await tx.verification.create({
        data: {
          ticketId,
          status: 'COMPLETED',
          result,
          evidence,
          verifiedBy,
        },
      });

      // Determine new status and event type
      const newStatus = result === 'PASS' ? 'CLOSED' : 'REOPENED';
      const eventType = result === 'PASS' ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED';

      // Transition ticket status
      const updatedTicket = await tx.synthesisTicket.update({
        where: { id: ticketId },
        data: {
          status: newStatus as any,
          resolvedAt: newStatus === 'CLOSED' ? new Date() : ticket.resolvedAt,
        },
      });

      // Log ticket history event
      await tx.synthesisTicketEvent.create({
        data: {
          ticketId,
          eventType: result === 'PASS' ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILURE',
          actorName: verifiedBy,
          fromValue: ticket.status,
          toValue: newStatus as any,
          metadata: {
            verificationId: verification.id,
            evidence,
          },
        },
      });

      // Queue Outbox Event for verification
      const outboxEventId = crypto.randomUUID();
      await tx.outboxEvent.create({
        data: {
          id: crypto.randomUUID(),
          eventId: outboxEventId,
          eventType,
          aggregateType: 'Verification',
          aggregateId: verification.id,
          payload: {
            ticketId,
            verificationId: verification.id,
            result,
            evidence,
            verifiedBy,
            newTicketStatus: newStatus,
          },
        },
      });

      return {
        verification,
        ticket: updatedTicket,
      };
    });
  }
}
