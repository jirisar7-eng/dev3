import crypto from 'crypto';
import {
  KnowledgeRecord,
  KnowledgeMirrorDTO,
  KnowledgeMirrorSyncResult,
  KnowledgeSyncOptions,
  KnowledgeType,
} from './knowledgeTypes';
import { sanitizeText } from '../qa/ai/sanitizer';
import { AuditRegistryEngine } from './auditRegistryEngine';
import { OrionTraceStore } from './orionTraceStore';
import { ControlPlaneService } from '../controlPlaneService';

export class KnowledgeMirrorService {
  private static syncedHashes: Set<string> = new Set();

  private static get apiKey(): string | undefined {
    return process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  }

  private static get databaseId(): string | undefined {
    return process.env.NOTION_DATABASE_ID;
  }

  /**
   * Computes deterministic SHA-256 content hash for idempotency.
   */
  public static computeContentHash(
    sourceType: string,
    sourceId: string,
    commitSha: string,
    canonicalContent: string
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${sourceType}:${sourceId}:${commitSha}:${canonicalContent}`)
      .digest('hex');
  }

  /**
   * Sanitizes and transforms a KnowledgeRecord into a safe 0-PII KnowledgeMirrorDTO.
   */
  public static toSanitizedDTO(record: KnowledgeRecord): KnowledgeMirrorDTO {
    const sanitizedTitle = sanitizeText(record.title);
    const sanitizedSummary = sanitizeText(record.summary);
    const sanitizedCommit = sanitizeText(record.sourceCommitSha || 'd9f8ca0bb65ab211968a1c9ddb1c52eff4ce13b8');
    const sanitizedBranch = sanitizeText(record.sourceBranch || 'main');
    const sanitizedAuditPath = sanitizeText(record.relatedAuditPath || '');

    return {
      recordId: record.id,
      title: sanitizedTitle,
      type: record.type,
      projectArea: record.projectArea,
      status: record.status,
      confidence: Math.min(1.0, Math.max(0.0, record.confidence)),
      verified: record.type === 'AI_RECOMMENDATION' ? false : record.verified,
      severity: record.severity,
      source: record.source,
      sourceCommitSha: sanitizedCommit,
      sourceBranch: sanitizedBranch,
      relatedAuditPath: sanitizedAuditPath,
      timestamp: record.timestamp,
      contentHash: record.contentHash,
      sanitizedSummary,
    };
  }

  /**
   * Aggregates KnowledgeRecords from AuditRegistry, OrionTraces, and ControlPlane Actions.
   */
  public static async collectKnowledgeRecords(): Promise<KnowledgeRecord[]> {
    const records: KnowledgeRecord[] = [];

    // 1. Audits & Audit Findings from AuditRegistry
    try {
      const { records: audits } = AuditRegistryEngine.loadRegistry();
      for (const audit of audits) {
        const pathOrName = audit.filename || audit.id;
        const hash = this.computeContentHash('AUDIT', pathOrName, audit.sourceSha || 'd9f8ca0', audit.title);
        const p0 = audit.metrics?.p0Count || 0;
        const p1 = audit.metrics?.p1Count || 0;
        const p2 = audit.metrics?.p2Count || 0;

        records.push({
          id: `audit-${pathOrName.replace(/[^a-zA-Z0-9]/g, '-')}`,
          title: audit.title,
          type: 'VERIFIED_FACT',
          projectArea: 'AUDIT_CENTER',
          status: 'VERIFIED',
          confidence: 1.0,
          verified: true,
          severity: p0 > 0 ? 'P0' : p1 > 0 ? 'P1' : p2 > 0 ? 'P2' : 'NONE',
          source: 'SYSTEM',
          sourceCommitSha: (audit.sourceSha || 'd9f8ca0').slice(0, 8),
          sourceBranch: 'main',
          relatedAuditPath: pathOrName,
          timestamp: audit.date || new Date().toISOString(),
          contentHash: hash,
          summary: `Audit ${audit.title} s ${p0} P0, ${p1} P1 chybami. Status: ${audit.status}`,
        });

        for (const finding of audit.findings || []) {
          const findingHash = this.computeContentHash('FINDING', finding.id, audit.sourceSha || 'd9f8ca0', finding.description || finding.title);
          records.push({
            id: `finding-${finding.id}`,
            title: `[${finding.severity}] ${finding.code || 'FINDING'}: ${(finding.description || finding.title || '').slice(0, 60)}`,
            type: 'AUDIT_FINDING',
            projectArea: 'AUDIT_CENTER',
            status: finding.status === 'FIXED' || finding.status === 'VERIFIED' ? 'RESOLVED' : 'ACTIVE',
            confidence: 1.0,
            verified: true,
            severity: finding.severity,
            source: 'SYSTEM',
            sourceCommitSha: (audit.sourceSha || 'd9f8ca0').slice(0, 8),
            sourceBranch: 'main',
            relatedAuditPath: pathOrName,
            timestamp: audit.date || new Date().toISOString(),
            contentHash: findingHash,
            summary: finding.description || finding.title || '',
          });
        }
      }
    } catch (err) {
      console.warn('[KnowledgeMirrorService] Failed to load audits for collection:', err);
    }

    // 2. Orion Traces (AI Recommendations & Traces)
    try {
      const traces = OrionTraceStore.getRecentTraces();
      for (const trace of traces) {
        const traceHash = this.computeContentHash('ORION_TRACE', trace.id, 'd9f8ca0', trace.recommendationSummary || trace.scope);
        records.push({
          id: `orion-${trace.id}`,
          title: `Orion AI Analysis: ${trace.scope}`,
          type: 'AI_RECOMMENDATION',
          projectArea: 'ORION',
          status: trace.status === 'COMPLETED' ? 'ACTIVE' : 'PENDING_APPROVAL',
          confidence: 0.85,
          verified: false, // AI_RECOMMENDATION is never auto-verified
          severity: 'NONE',
          source: 'ORION',
          sourceCommitSha: 'd9f8ca0',
          sourceBranch: 'main',
          timestamp: trace.timestamp,
          contentHash: traceHash,
          summary: trace.recommendationSummary || 'Bez souhrnu',
        });
      }
    } catch (err) {
      console.warn('[KnowledgeMirrorService] Failed to load Orion traces for collection:', err);
    }

    // 3. Control Plane Actions (Drafts & Executed Actions)
    try {
      const actions = ControlPlaneService.getAllActions();
      for (const action of actions) {
        const actionTitle = action.intent || action.request || `Akce ${action.id}`;
        const actionHash = this.computeContentHash('CONTROL_PLANE', action.id, 'd9f8ca0', actionTitle);
        const isExecuted = action.status === 'COMPLETED' || action.status === 'APPROVED' || action.status === 'MERGED' || action.status === 'DEPLOYED';
        const type: KnowledgeType = isExecuted ? 'EXECUTED_ACTION' : 'DRAFT_ACTION';
        const formattedTimestamp = typeof action.createdAt === 'string' ? action.createdAt : action.createdAt ? new Date(action.createdAt).toISOString() : new Date().toISOString();

        records.push({
          id: `cp-${action.id}`,
          title: actionTitle,
          type,
          projectArea: 'CONTROL_PLANE',
          status: isExecuted ? 'RESOLVED' : action.status === 'WAITING_APPROVAL' ? 'PENDING_APPROVAL' : 'ACTIVE',
          confidence: 1.0,
          verified: isExecuted,
          severity: action.riskLevel === 'CRITICAL' ? 'P0' : action.riskLevel === 'HIGH' ? 'P1' : 'NONE',
          source: 'SYSTEM',
          sourceCommitSha: 'd9f8ca0',
          sourceBranch: 'main',
          timestamp: formattedTimestamp,
          contentHash: actionHash,
          summary: action.request || action.intent || actionTitle,
          verificationEvidence: action.changeReference || undefined,
        });
      }
    } catch (err) {
      console.warn('[KnowledgeMirrorService] Failed to load Control Plane actions for collection:', err);
    }

    return records;
  }

  /**
   * Idempotent Sync pipeline pushing DTOs to Notion API safely and non-blockingly.
   */
  public static async syncToNotion(options: KnowledgeSyncOptions = { scope: 'ALL', forceResync: false }): Promise<KnowledgeMirrorSyncResult> {
    const hasKey = Boolean(this.apiKey);
    const hasDb = Boolean(this.databaseId);

    const records = await this.collectKnowledgeRecords();
    let syncedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    if (!hasKey || !hasDb) {
      return {
        success: true,
        totalProcessed: records.length,
        syncedCount: 0,
        skippedCount: records.length,
        failedCount: 0,
        message: 'Notion API klíč nebo ID databáze není nastaveno. Sync přeskočen (lokální izolovaný režim).',
        timestamp: new Date().toISOString(),
      };
    }

    for (const record of records) {
      const dto = this.toSanitizedDTO(record);

      // Check idempotency
      if (!options.forceResync && this.syncedHashes.has(dto.contentHash)) {
        skippedCount++;
        continue;
      }

      try {
        const payload = {
          parent: { database_id: this.databaseId },
          properties: {
            'Record ID': {
              title: [{ text: { content: dto.recordId } }],
            },
            'Title': {
              rich_text: [{ text: { content: dto.title } }],
            },
            'Type': {
              select: { name: dto.type },
            },
            'Project Area': {
              select: { name: dto.projectArea },
            },
            'Status': {
              select: { name: dto.status },
            },
            'Severity': {
              select: { name: dto.severity },
            },
            'Verified': {
              checkbox: dto.verified,
            },
            'Confidence': {
              number: dto.confidence,
            },
            'Source Commit': {
              rich_text: [{ text: { content: dto.sourceCommitSha } }],
            },
            'Content Hash': {
              rich_text: [{ text: { content: dto.contentHash } }],
            },
            'Timestamp': {
              date: { start: dto.timestamp },
            },
          },
          children: [
            {
              object: 'block',
              type: 'heading_3',
              heading_3: {
                rich_text: [{ text: { content: `${dto.type} Summary` } }],
              },
            },
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [{ text: { content: dto.sanitizedSummary } }],
              },
            },
          ],
        };

        const response = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          syncedCount++;
          this.syncedHashes.add(dto.contentHash);
        } else {
          failedCount++;
          const errText = await response.text();
          console.warn(`[KnowledgeMirrorService] Notion API error for ${dto.recordId}:`, errText);
        }
      } catch (err: any) {
        failedCount++;
        console.warn(`[KnowledgeMirrorService] Failed to sync ${dto.recordId} to Notion:`, err?.message);
      }
    }

    return {
      success: failedCount === 0,
      totalProcessed: records.length,
      syncedCount,
      skippedCount,
      failedCount,
      message: `Sync dokončen. Zpracováno: ${records.length}, Odesláno: ${syncedCount}, Přeskočeno (idempotentní): ${skippedCount}, Selhalo: ${failedCount}`,
      timestamp: new Date().toISOString(),
    };
  }
}
