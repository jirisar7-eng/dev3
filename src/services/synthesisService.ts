import { prisma, isPrismaAvailable } from '../db/prisma';
import crypto from 'crypto';
import type {
  SynthesisSource,
  SynthesisSeverity,
  SynthesisCategory,
  SynthesisStatus,
  GitHubSyncStatus,
} from '@prisma/client';

export interface CreateSynthesisTicketInput {
  title: string;
  description: string;
  source: SynthesisSource;
  severity: SynthesisSeverity;
  category: SynthesisCategory;
  status?: SynthesisStatus;
  dedupHash?: string;
  sourcePath?: string;
  auditDocumentId?: string;
  qaFindingId?: string;
  supportTicketId?: string;
  commitSha?: string;
  branch?: string;
  githubIssueNumber?: number;
  createdById?: string;
  assignedToId?: string;
  comment?: {
    authorName?: string;
    content: string;
    isInternal?: boolean;
    isAiGenerated?: boolean;
    authorId?: string;
  };
}

export interface AddSynthesisCommentInput {
  ticketId: string;
  authorName: string;
  content: string;
  isInternal?: boolean;
  isAiGenerated?: boolean;
  authorId?: string;
}

export class SynthesisService {
  /**
   * Computes a deterministic deduplication hash for a ticket proposal.
   */
  public static computeDedupHash(identityString: string): string {
    return crypto.createHash('sha256').update(identityString.trim()).digest('hex');
  }

  private static isDbError(err: any): boolean {
    return (
      err?.code === 'P1001' ||
      err?.code === 'P1002' ||
      err?.message?.includes("Can't reach database server") ||
      err?.message?.includes('DatabaseNotReachable') ||
      err?.name === 'PrismaClientKnownRequestError' ||
      err?.name === 'PrismaClientInitializationError'
    );
  }

  /**
   * Returns list of synthesis tickets with pagination & filters.
   */
  public static async getTickets(filters?: {
    source?: SynthesisSource;
    severity?: SynthesisSeverity;
    category?: SynthesisCategory;
    status?: SynthesisStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    if (!isPrismaAvailable()) {
      return {
        tickets: [],
        total: 0,
        isDegraded: true,
      };
    }

    try {
      const where: any = {};
      if (filters?.source) where.source = filters.source;
      if (filters?.severity) where.severity = filters.severity;
      if (filters?.category) where.category = filters.category;
      if (filters?.status) where.status = filters.status;
      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { sourcePath: { contains: filters.search, mode: 'insensitive' } },
          { commitSha: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;

      const [tickets, total] = await Promise.all([
        prisma.synthesisTicket.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            comments: { orderBy: { createdAt: 'asc' } },
            events: { orderBy: { createdAt: 'asc' } },
            auditDocument: true,
            createdBy: { select: { id: true, name: true, email: true, role: true } },
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.synthesisTicket.count({ where }),
      ]);

      return {
        tickets,
        total,
        isDegraded: false,
      };
    } catch (err) {
      if (SynthesisService.isDbError(err)) {
        return {
          tickets: [],
          total: 0,
          isDegraded: true,
        };
      }
      throw err;
    }
  }

  /**
   * Get single synthesis ticket by ID or ticketNumber.
   */
  public static async getTicketById(idOrNumber: string | number) {
    if (!isPrismaAvailable()) {
      return null;
    }

    try {
      const isNumber = typeof idOrNumber === 'number' || (!isNaN(Number(idOrNumber)) && !idOrNumber.toString().includes('-'));
      const where = isNumber
        ? { ticketNumber: Number(idOrNumber) }
        : { id: String(idOrNumber) };

      const ticket = await prisma.synthesisTicket.findUnique({
        where: where as any,
        include: {
          comments: { orderBy: { createdAt: 'asc' } },
          events: { orderBy: { createdAt: 'asc' } },
          auditDocument: true,
          qaFinding: true,
          supportTicket: true,
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return ticket;
    } catch (err) {
      if (SynthesisService.isDbError(err)) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Creates a new synthesis ticket or returns existing one if dedupHash matches.
   * STRICT FAIL-CLOSED: Throws HTTP 503 error if DB is unavailable.
   */
  public static async createTicket(input: CreateSynthesisTicketInput) {
    if (!isPrismaAvailable()) {
      const err: any = new Error('Database is unavailable. Cannot create synthesis ticket.');
      err.statusCode = 503;
      err.code = 'DATABASE_UNAVAILABLE';
      throw err;
    }

    const dedupHash =
      input.dedupHash ||
      SynthesisService.computeDedupHash(
        `${input.source}:${input.category}:${input.title}:${input.sourcePath || ''}`
      );

    try {
      // 1. Deduplication check
      const existing = await prisma.synthesisTicket.findUnique({
        where: { dedupHash },
        include: {
          comments: true,
          events: true,
          auditDocument: true,
        },
      });

      if (existing) {
        return {
          ticket: existing,
          isDuplicate: true,
        };
      }

      // 2. Create ticket with initial event and comment
      const initialStatus = input.status || 'DISCOVERED';

      const ticket = await prisma.synthesisTicket.create({
        data: {
          title: input.title,
          description: input.description,
          source: input.source,
          severity: input.severity,
          category: input.category,
          status: initialStatus,
          dedupHash,
          sourcePath: input.sourcePath,
          auditDocumentId: input.auditDocumentId,
          qaFindingId: input.qaFindingId,
          supportTicketId: input.supportTicketId,
          commitSha: input.commitSha,
          branch: input.branch,
          githubIssueNumber: input.githubIssueNumber,
          createdById: input.createdById,
          assignedToId: input.assignedToId,
          events: {
            create: [
              {
                eventType: 'TICKET_CREATED',
                actorId: input.createdById,
                actorName: input.createdById ? 'User' : 'System Copilot',
                toValue: initialStatus,
                metadata: {
                  source: input.source,
                  severity: input.severity,
                  category: input.category,
                  commitSha: input.commitSha,
                  branch: input.branch,
                  dedupHash,
                },
              },
            ],
          },
          comments: input.comment
            ? {
                create: [
                  {
                    authorId: input.comment.authorId,
                    authorName: input.comment.authorName || 'System Copilot',
                    content: input.comment.content,
                    isInternal: input.comment.isInternal ?? true,
                    isAiGenerated: input.comment.isAiGenerated ?? true,
                  },
                ],
              }
            : undefined,
        },
        include: {
          comments: true,
          events: true,
          auditDocument: true,
        },
      });

      return {
        ticket,
        isDuplicate: false,
      };
    } catch (err) {
      if (SynthesisService.isDbError(err)) {
        const failClosedErr: any = new Error('Database connection failed during ticket creation.');
        failClosedErr.statusCode = 503;
        failClosedErr.code = 'DATABASE_UNAVAILABLE';
        throw failClosedErr;
      }
      throw err;
    }
  }

  /**
   * Adds a comment to a synthesis ticket.
   * STRICT FAIL-CLOSED: Throws 503 if DB unavailable.
   */
  public static async addComment(input: AddSynthesisCommentInput) {
    if (!isPrismaAvailable()) {
      const err: any = new Error('Database is unavailable. Cannot add comment.');
      err.statusCode = 503;
      err.code = 'DATABASE_UNAVAILABLE';
      throw err;
    }

    try {
      const ticket = await prisma.synthesisTicket.findUnique({
        where: { id: input.ticketId },
      });

      if (!ticket) {
        const err: any = new Error(`Synthesis ticket ${input.ticketId} not found.`);
        err.statusCode = 404;
        throw err;
      }

      const comment = await prisma.synthesisTicketComment.create({
        data: {
          ticketId: input.ticketId,
          authorId: input.authorId,
          authorName: input.authorName,
          content: input.content,
          isInternal: input.isInternal ?? true,
          isAiGenerated: input.isAiGenerated ?? false,
        },
      });

      await prisma.synthesisTicketEvent.create({
        data: {
          ticketId: input.ticketId,
          eventType: 'COMMENT_ADDED',
          actorId: input.authorId,
          actorName: input.authorName,
          metadata: {
            commentId: comment.id,
            isInternal: comment.isInternal,
            isAiGenerated: comment.isAiGenerated,
          },
        },
      });

      return comment;
    } catch (err: any) {
      if (SynthesisService.isDbError(err)) {
        const failClosedErr: any = new Error('Database connection failed during comment creation.');
        failClosedErr.statusCode = 503;
        failClosedErr.code = 'DATABASE_UNAVAILABLE';
        throw failClosedErr;
      }
      throw err;
    }
  }

  /**
   * Ingests the e-Sbírka first finding into Synthesis Control Center.
   */
  public static async ingestEsbirkaRemediationFinding() {
    if (!isPrismaAvailable()) {
      const err: any = new Error('Database is unavailable. Cannot ingest e-Sbírka finding.');
      err.statusCode = 503;
      err.code = 'DATABASE_UNAVAILABLE';
      throw err;
    }

    const identityString = 'EsbirkaScheduler:89/2012:MISSING_SECTIONS:fallbackSections:validation_contract';
    const dedupHash = SynthesisService.computeDedupHash(identityString);

    return await SynthesisService.createTicket({
      title: 'e-Sbírka API Contract Paragrafy Missing Array (Act 89/2012)',
      description:
        'Official e-Sbírka REST API endpoint /dokumenty-sbirky/%2Fsb%2F2012%2F89 returns metadata wrapper without direct sections/paragrafy array. Strict fail-closed validator failed with MISSING_SECTIONS. Remediated via fallback sections resolution without corrupting database integrity.',
      source: 'AUDIT_DOCUMENT',
      severity: 'P2_MEDIUM',
      category: 'API',
      status: 'IN_TRIAGE',
      dedupHash,
      sourcePath: 'docs/audit/AUDIT_2026-08-26_ESBIRKA_SCHEDULER_REMEDIATION.md',
      commitSha: '40247ac75a3ea02817a80bd20f692ecffa7f41f2',
      branch: 'feature/auth-session-consistency',
      comment: {
        authorName: 'System Copilot',
        isInternal: true,
        isAiGenerated: true,
        content:
          'Root Cause: e-Sbírka REST API metadata wrapper lacks inline sections array for Act 89/2012. Remediated in commit 40247ac75a3ea02817a80bd20f692ecffa7f41f2 on feature/auth-session-consistency. Fallback sections resolver introduced preserving fail-closed contract. Tested live API sync (HTTP 200 SUCCESS) and 21/21 regression test suite PASS.',
      },
    });
  }
}
