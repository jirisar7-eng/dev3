import { prisma, isPrismaAvailable } from '../../db/prisma';
import { SynthesisService } from '../synthesisService';
import type { GitHubSyncStatus } from '@prisma/client';

export interface LinkGithubMetadataInput {
  ticketId: string;
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  githubPrNumber?: number;
  githubPrUrl?: string;
  commitSha?: string | null;
  branch?: string;
  repository?: string;
  actorId?: string;
  actorName?: string;
}

export class GithubSyncService {
  /**
   * Returns configured default GitHub repository for the application.
   */
  public static getConfiguredRepository(): string {
    return (process.env.GITHUB_REPOSITORY || 'jirisar7-eng/dev3').trim();
  }

  /**
   * Validates and links GitHub metadata to a SynthesisTicket.
   * STRICT FAIL-CLOSED & SECURITY BOUNDARY:
   * - Requires DB availability (503 if down).
   * - Rejects cross-repository references (400).
   * - Rejects fake/invalid 40-character commit SHA strings (400).
   * - Rejects invalid Issue or PR numbers <= 0 (400).
   */
  public static async linkGithubMetadata(input: LinkGithubMetadataInput) {
    if (!isPrismaAvailable()) {
      const err: any = new Error('Database is unavailable. Cannot sync GitHub metadata.');
      err.statusCode = 503;
      err.code = 'DATABASE_UNAVAILABLE';
      throw err;
    }

    const configuredRepo = GithubSyncService.getConfiguredRepository();

    // 1. Cross-repository boundary check
    if (input.repository && input.repository.trim().toLowerCase() !== configuredRepo.toLowerCase()) {
      const err: any = new Error(`Cross-repository reference rejected. Ticket must belong to configured repository '${configuredRepo}'.`);
      err.statusCode = 400;
      err.code = 'CROSS_REPOSITORY_REJECTED';
      throw err;
    }

    // 2. Validate URLs if supplied
    if (input.githubIssueUrl && !input.githubIssueUrl.toLowerCase().includes(`github.com/${configuredRepo.toLowerCase()}`)) {
      const err: any = new Error(`Invalid GitHub Issue URL. Must belong to '${configuredRepo}'.`);
      err.statusCode = 400;
      err.code = 'CROSS_REPOSITORY_REJECTED';
      throw err;
    }

    if (input.githubPrUrl && !input.githubPrUrl.toLowerCase().includes(`github.com/${configuredRepo.toLowerCase()}`)) {
      const err: any = new Error(`Invalid GitHub PR URL. Must belong to '${configuredRepo}'.`);
      err.statusCode = 400;
      err.code = 'CROSS_REPOSITORY_REJECTED';
      throw err;
    }

    // 3. Validate Issue / PR numbers
    if (input.githubIssueNumber !== undefined) {
      if (!Number.isInteger(input.githubIssueNumber) || input.githubIssueNumber <= 0) {
        const err: any = new Error('Invalid GitHub Issue number. Must be a positive integer.');
        err.statusCode = 400;
        err.code = 'INVALID_GITHUB_NUMBER';
        throw err;
      }
    }

    if (input.githubPrNumber !== undefined) {
      if (!Number.isInteger(input.githubPrNumber) || input.githubPrNumber <= 0) {
        const err: any = new Error('Invalid GitHub PR number. Must be a positive integer.');
        err.statusCode = 400;
        err.code = 'INVALID_GITHUB_NUMBER';
        throw err;
      }
    }

    // 4. Validate Commit SHA strictly (40-char hex)
    let normalizedSha: string | null = null;
    if (input.commitSha !== undefined && input.commitSha !== null && input.commitSha !== '') {
      normalizedSha = SynthesisService.normalizeCommitSha(input.commitSha);
      if (!normalizedSha) {
        const err: any = new Error('Invalid commit SHA format. Must be an exact 40-character hex string.');
        err.statusCode = 400;
        err.code = 'INVALID_COMMIT_SHA';
        throw err;
      }
    }

    // 5. Fetch existing ticket
    const ticket = await prisma.synthesisTicket.findUnique({
      where: { id: input.ticketId },
    });

    if (!ticket) {
      const err: any = new Error(`Synthesis ticket '${input.ticketId}' not found.`);
      err.statusCode = 404;
      err.code = 'TICKET_NOT_FOUND';
      throw err;
    }

    // 6. Compute URLs if numbers supplied
    const issueNumber = input.githubIssueNumber ?? ticket.githubIssueNumber ?? undefined;
    const issueUrl =
      input.githubIssueUrl ||
      (issueNumber ? `https://github.com/${configuredRepo}/issues/${issueNumber}` : ticket.githubIssueUrl || undefined);

    const prNumber = input.githubPrNumber ?? ticket.githubPrNumber ?? undefined;
    const prUrl =
      input.githubPrUrl ||
      (prNumber ? `https://github.com/${configuredRepo}/pull/${prNumber}` : ticket.githubPrUrl || undefined);

    const finalSha = normalizedSha ?? ticket.commitSha;
    const finalBranch = input.branch || ticket.branch;

    // 7. Determine Sync Status
    let syncStatus: GitHubSyncStatus = 'SYNCED';
    if (prNumber) {
      syncStatus = 'PR_LINKED';
    } else if (issueNumber) {
      syncStatus = 'ISSUE_CREATED';
    } else if (finalSha) {
      syncStatus = 'CLOSED_BY_COMMIT';
    }

    // 8. Atomic update & event creation
    const updatedTicket = await prisma.synthesisTicket.update({
      where: { id: input.ticketId },
      data: {
        githubIssueNumber: issueNumber ?? null,
        githubIssueUrl: issueUrl ?? null,
        githubPrNumber: prNumber ?? null,
        githubPrUrl: prUrl ?? null,
        commitSha: finalSha,
        branch: finalBranch,
        githubSyncStatus: syncStatus,
        githubSyncedAt: new Date(),
        githubSyncError: null,
      },
      include: {
        comments: true,
        events: true,
      },
    });

    await prisma.synthesisTicketEvent.create({
      data: {
        ticketId: input.ticketId,
        eventType: 'GITHUB_SYNCED',
        actorId: input.actorId,
        actorName: input.actorName || 'System Admin',
        metadata: {
          repository: configuredRepo,
          githubIssueNumber: issueNumber,
          githubIssueUrl: issueUrl,
          githubPrNumber: prNumber,
          githubPrUrl: prUrl,
          commitSha: finalSha,
          branch: finalBranch,
          githubSyncStatus: syncStatus,
        },
      },
    });

    return updatedTicket;
  }
}
