import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeMirrorService } from '../src/services/audit/knowledgeMirrorService';
import { KnowledgeRecord, KnowledgeSyncOptionsSchema } from '../src/services/audit/knowledgeTypes';

describe('Phase 6D: Knowledge, Governance & Notion Mirror Engine', () => {
  beforeEach(() => {
    delete process.env.NOTION_API_KEY;
    delete process.env.NOTION_TOKEN;
    delete process.env.NOTION_DATABASE_ID;
  });

  it('computes deterministic SHA-256 content hashes for idempotency', () => {
    const hash1 = KnowledgeMirrorService.computeContentHash('AUDIT', 'audit-1', 'sha123', 'Content A');
    const hash2 = KnowledgeMirrorService.computeContentHash('AUDIT', 'audit-1', 'sha123', 'Content A');
    const hash3 = KnowledgeMirrorService.computeContentHash('AUDIT', 'audit-1', 'sha123', 'Content B');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it('enforces trust level boundary: AI_RECOMMENDATION is never auto-verified', () => {
    const rawRecord: KnowledgeRecord = {
      id: 'rec-1',
      title: 'AI Suggestion for Security',
      type: 'AI_RECOMMENDATION',
      projectArea: 'SECURITY',
      status: 'ACTIVE',
      confidence: 0.95,
      verified: true, // Attempted unverified promotion
      severity: 'P1',
      source: 'ORION',
      sourceCommitSha: 'd9f8ca0',
      timestamp: new Date().toISOString(),
      contentHash: 'hash123',
      summary: 'Recommendation to update policy',
    };

    const dto = KnowledgeMirrorService.toSanitizedDTO(rawRecord);
    expect(dto.verified).toBe(false); // Forced false for AI_RECOMMENDATION
    expect(dto.type).toBe('AI_RECOMMENDATION');
  });

  it('sanitizes 0-PII data in titles, summaries, and commits', () => {
    const recordWithPii: KnowledgeRecord = {
      id: 'audit-pii',
      title: 'Audit user jan.novak@email.cz with token eyJhbGciOiJIUzI1NiJ9',
      type: 'VERIFIED_FACT',
      projectArea: 'AUDIT_CENTER',
      status: 'VERIFIED',
      confidence: 1.0,
      verified: true,
      severity: 'NONE',
      source: 'SYSTEM',
      sourceCommitSha: 'abcdef12',
      timestamp: new Date().toISOString(),
      contentHash: 'hash456',
      summary: 'Secret key sk_live_9999999999999 in code',
    };

    const dto = KnowledgeMirrorService.toSanitizedDTO(recordWithPii);
    expect(dto.title).not.toContain('jan.novak@email.cz');
    expect(dto.sanitizedSummary).not.toContain('sk_live_9999999999999');
  });

  it('executes fail-safe non-blocking sync when Notion credentials are missing', async () => {
    const result = await KnowledgeMirrorService.syncToNotion({ scope: 'ALL', forceResync: false });
    expect(result.success).toBe(true);
    expect(result.skippedCount).toBeGreaterThanOrEqual(0);
    expect(result.message).toContain('lokální izolovaný režim');
  });

  it('validates sync options with Zod schema', () => {
    const valid = KnowledgeSyncOptionsSchema.parse({ scope: 'AUDITS', forceResync: true });
    expect(valid.scope).toBe('AUDITS');
    expect(valid.forceResync).toBe(true);

    const defaultParsed = KnowledgeSyncOptionsSchema.parse({});
    expect(defaultParsed.scope).toBe('ALL');
    expect(defaultParsed.forceResync).toBe(false);

    expect(() => KnowledgeSyncOptionsSchema.parse({ scope: 'INVALID_SCOPE' })).toThrow();
  });
});
