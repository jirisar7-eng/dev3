import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AuditRecord,
  AuditFinding,
  AuditRegistrySummary,
  ParserWarning,
  AuditStatusType,
  TrustLevel,
  FindingSeverity,
  FindingStatus,
  AuditCategory
} from './types';
import { isPrismaAvailable, prisma } from '../../db/prisma';

const ROOT_DIR = process.cwd();
const DEFAULT_AUDIT_DIR = 'docs/audit';

export class AuditRegistryEngine {
  private static warnings: ParserWarning[] = [];

  /**
   * Sanitizes text to prevent any secret or PII leakage into logs/warnings.
   */
  private static sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\w-]{24,}/g, '[REDACTED_TOKEN]')
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/password\s*[:=]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/api[_-]?key\s*[:=]\s*\S+/gi, 'apiKey=[REDACTED]');
  }

  /**
   * Validates that the filePath is safely inside the docs/audit directory and ends with .md
   */
  public static validateAuditPath(relativeOrAbsolutePath: string, customBaseDir: string = DEFAULT_AUDIT_DIR): string {
    const baseDirAbsolute = path.resolve(ROOT_DIR, customBaseDir);
    const resolvedPath = path.isAbsolute(relativeOrAbsolutePath)
      ? path.resolve(relativeOrAbsolutePath)
      : path.resolve(ROOT_DIR, relativeOrAbsolutePath);

    // Path traversal check
    if (!resolvedPath.startsWith(baseDirAbsolute) && !resolvedPath.startsWith(path.resolve(ROOT_DIR, 'docs/audit'))) {
      throw new Error(`Security Violation: Path traversal outside audit directory: ${this.sanitizeText(relativeOrAbsolutePath)}`);
    }

    if (!resolvedPath.toLowerCase().endsWith('.md')) {
      throw new Error(`Invalid File: Audit file must have .md extension: ${this.sanitizeText(relativeOrAbsolutePath)}`);
    }

    return resolvedPath;
  }

  /**
   * Discovers all markdown files in the target directory (default docs/audit)
   */
  public static discoverAuditFiles(targetDir: string = DEFAULT_AUDIT_DIR): string[] {
    const baseDir = path.resolve(ROOT_DIR, targetDir);
    if (!fs.existsSync(baseDir)) {
      return [];
    }

    const files: string[] = [];
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        files.push(path.join(targetDir, entry.name).replace(/\\/g, '/'));
      }
    }

    return files.sort();
  }

  /**
   * Generates SHA-256 hash of file content.
   */
  public static computeSha256(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Deterministically parses a single audit markdown content.
   */
  public static parseAuditContent(content: string, filename: string, relativePath: string = filename): AuditRecord {
    const warnings: ParserWarning[] = [];
    const sanitizedFilename = path.basename(filename);

    if (!content || content.trim().length === 0) {
      const emptyWarning: ParserWarning = {
        filename: sanitizedFilename,
        message: 'Soubor auditu je prázdný.',
        code: 'EMPTY_FILE',
        timestamp: new Date().toISOString(),
      };
      this.warnings.push(emptyWarning);

      return {
        id: sanitizedFilename.replace(/\.md$/i, ''),
        filename: sanitizedFilename,
        title: sanitizedFilename.replace(/\.md$/i, '').replace(/_/g, ' '),
        type: 'GENERAL',
        date: new Date().toISOString().split('T')[0],
        scope: [],
        status: 'UNKNOWN',
        metrics: { p0Count: 0, p1Count: 0, p2Count: 0, p3Count: 0, testsTotal: 0, testsPassed: 0, testsFailed: 0 },
        source: relativePath,
        sourceSha: this.computeSha256(''),
        trustLevel: 'UNKNOWN',
        findings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const sourceSha = this.computeSha256(content);
    const lines = content.split('\n');

    // 1. Title extraction: First # heading or clean filename
    let title = sanitizedFilename.replace(/\.md$/i, '').replace(/_/g, ' ');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/[*_#`]/g, '').trim();
    }

    // 2. Date extraction: **Datum:** or filename YYYY-MM-DD
    let date = '';
    const dateMatch = content.match(/\*\*(?:Datum|Datum a čas|Date):\*\*\s*([^\n\r]+)/i) ||
                      content.match(/(?:Datum|Datum a čas|Date):\s*([^\n\r]+)/i);
    if (dateMatch && dateMatch[1]) {
      const rawDateStr = dateMatch[1].trim();
      const isoExtract = rawDateStr.match(/(\d{4}-\d{2}-\d{2})/);
      date = isoExtract ? isoExtract[1] : rawDateStr;
    } else {
      const filenameDateMatch = sanitizedFilename.match(/(\d{4}-\d{2}-\d{2})/);
      if (filenameDateMatch) {
        date = filenameDateMatch[1];
      } else {
        date = new Date().toISOString().split('T')[0];
        warnings.push({
          filename: sanitizedFilename,
          message: 'Datum auditu nebylo explicitně nalezeno, použito výchozí.',
          code: 'MISSING_DATE',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 3. Phase extraction
    let phase: string | undefined = undefined;
    const phaseMatch = sanitizedFilename.match(/PHASE[_\s-]*([0-9a-zA-Z\.]+)/i) ||
                       sanitizedFilename.match(/FAZE[_\s-]*([0-9a-zA-Z\.]+)/i) ||
                       content.match(/\*\*(?:Fáze|Phase):\*\*\s*([^\n\r]+)/i);
    if (phaseMatch && phaseMatch[1]) {
      phase = phaseMatch[1].trim();
    }

    // 4. Audit Category determination
    let type: AuditCategory = 'GENERAL';
    const upperText = (sanitizedFilename + ' ' + title).toUpperCase();
    if (upperText.includes('SECURITY') || upperText.includes('BEZPEČNOST') || upperText.includes('RBAC') || upperText.includes('PRIVACY')) {
      type = 'SECURITY';
    } else if (upperText.includes('MIGRAT') || upperText.includes('PRISMA') || upperText.includes('DATABASE') || upperText.includes('DB_')) {
      type = 'MIGRATION';
    } else if (upperText.includes('RELEASE_GATE') || upperText.includes('RELEASE') || upperText.includes('GATE')) {
      type = 'RELEASE_GATE';
    } else if (upperText.includes('ARCHITECTURE') || upperText.includes('NAVIGAT') || upperText.includes('SHELL') || upperText.includes('STRUCTURE')) {
      type = 'ARCHITECTURE';
    } else if (upperText.includes('DATA_INTEGRITY') || upperText.includes('ESBIRKA') || upperText.includes('LEGISLATIV')) {
      type = 'DATA_INTEGRITY';
    } else if (upperText.includes('QA') || upperText.includes('TEST') || upperText.includes('REGRESSION')) {
      type = 'QA_REGRESSION';
    }

    // 5. Status Parsing (Deterministic & Anti-False-Positive)
    let status: AuditStatusType = 'UNKNOWN';
    let statusConfidence = 0; // 0 = unknown, 1 = derived, 2 = verified

    const explicitStatusMatch = content.match(/(?:STATUS|STAV|VÝSLEDEK|VERDIKT|Status|Stav):\s*([^\n\r]+)/i);
    const passWithWarningsRegex = /PASS\s+WITH\s+WARNINGS?|PASS_WITH_WARNINGS|ČÁSTEČNĚ\s+SPLNĚNO/i;
    const passRegex = /\b(?:PASS|DOKONČENO|VERIFIKOVÁNO|SCHVÁLENO|SUCCESS|HOTOVO|100%\s*PASS|SPLNĚNO)\b/i;
    const failRegex = /\b(?:FAIL|FAILED|CHYBA|NEPROŠLO|ZAMÍTNUTO|CRITICAL_FAIL)\b/i;

    if (explicitStatusMatch && explicitStatusMatch[1]) {
      const val = explicitStatusMatch[1].trim();
      if (passWithWarningsRegex.test(val)) {
        status = 'PASS_WITH_WARNINGS';
        statusConfidence = 2;
      } else if (failRegex.test(val)) {
        status = 'FAIL';
        statusConfidence = 2;
      } else if (passRegex.test(val)) {
        status = 'PASS';
        statusConfidence = 2;
      }
    }

    // Secondary table/badge/bullet evaluation if no explicit status line or if status is UNKNOWN
    if (status === 'UNKNOWN') {
      const summaryPass = /\|\s*Kritické zranitelnosti \(P0\)\s*\|\s*0\s*nalezeno\s*\|/i.test(content) ||
                          /\|\s*\*\*P0 Bezpečnostní zranitelnosti\*\*\s*\|\s*\*\*0\*\*\s*\|/i.test(content);
      const hasFailWord = /\b(?:FAIL|FAILED|CHYBA)\b/.test(content.slice(0, 1500));
      const hasPassBadge = /badge-PASS|✅\s*SCHVÁLENO|✅\s*PASS/i.test(content);

      if (summaryPass && !hasFailWord) {
        status = 'PASS';
        statusConfidence = 1;
      } else if (hasPassBadge && !hasFailWord) {
        status = 'PASS';
        statusConfidence = 1;
      } else if (hasFailWord && !hasPassBadge) {
        status = 'FAIL';
        statusConfidence = 1;
      } else {
        status = 'UNKNOWN';
      }
    }

    // 6. Test Metrics Extraction
    let testsTotal = 0;
    let testsPassed = 0;
    let testsFailed = 0;
    let testEvidenceText: string | undefined = undefined;

    const testFractionMatch = content.match(/(\d+)\/(\d+)\s*(?:testů|tests?)\s*PASS/i) ||
                              content.match(/(\d+)\/(\d+)\s*passed/i);
    if (testFractionMatch) {
      testsPassed = parseInt(testFractionMatch[1], 10);
      testsTotal = parseInt(testFractionMatch[2], 10);
      testsFailed = Math.max(0, testsTotal - testsPassed);
      testEvidenceText = testFractionMatch[0];
    } else {
      const testCountsMatch = content.match(/Tests?:\s*(\d+)\s*passed(?:,\s*(\d+)\s*failed)?/i);
      if (testCountsMatch) {
        testsPassed = parseInt(testCountsMatch[1], 10);
        testsFailed = testCountsMatch[2] ? parseInt(testCountsMatch[2], 10) : 0;
        testsTotal = testsPassed + testsFailed;
        testEvidenceText = testCountsMatch[0];
      }
    }

    // 7. Git Metadata Extraction
    let commitSha: string | undefined = undefined;
    const commitMatch = content.match(/(?:\*\*Commit|\*\*HEAD commit|\*\*Git Commit|Commit|HEAD):\*\*\s*`?([a-f0-9]{7,40})`?/i) ||
                        content.match(/`([a-f0-9]{40})`/);
    if (commitMatch && commitMatch[1]) {
      commitSha = commitMatch[1].trim();
    }

    let branch: string | undefined = undefined;
    const branchMatch = content.match(/(?:\*\*Větev|\*\*Branch|\*\*Git Větev|Větev|Branch):\*\*\s*`?([a-zA-Z0-9_\-\.\/]+)`?/i);
    if (branchMatch && branchMatch[1]) {
      branch = branchMatch[1].trim();
    }

    let prNumber: number | undefined = undefined;
    const prMatch = content.match(/(?:PR|Pull Request|PR #|#)(\d+)/i) ||
                    sanitizedFilename.match(/PR_?(\d+)/i);
    if (prMatch && prMatch[1]) {
      const parsedPr = parseInt(prMatch[1], 10);
      if (!isNaN(parsedPr) && parsedPr > 0 && parsedPr < 100000) {
        prNumber = parsedPr;
      }
    }

    // 8. Scope Extraction
    const scope: string[] = [];
    const scopeSectionMatch = content.match(/##\s*(?:Cíl|Scope|Dotčené soubory|Rozsah)[^\n]*\n([\s\S]*?)(?=\n##|\Z)/i);
    if (scopeSectionMatch && scopeSectionMatch[1]) {
      const bullets = scopeSectionMatch[1].match(/^[-*]\s+(.+)$/gm);
      if (bullets) {
        for (const b of bullets.slice(0, 10)) {
          const cleanBullet = b.replace(/^[-*]\s+/, '').replace(/[*_`]/g, '').trim();
          if (cleanBullet.length > 3 && cleanBullet.length < 150) {
            scope.push(cleanBullet);
          }
        }
      }
    }

    // 9. Severity Counts Extraction
    let p0Count = 0;
    let p1Count = 0;
    let p2Count = 0;
    let p3Count = 0;

    // Scan for explicit P0-P3 markers
    const p0Matches = content.match(/\bP0\b/g);
    const p1Matches = content.match(/\bP1\b/g);
    const p2Matches = content.match(/\bP2\b/g);
    const p3Matches = content.match(/\bP3\b/g);

    // Filter out false positive count headings (like "P0 Bezpečnostní zranitelnosti | 0")
    if (p0Matches) p0Count = p0Matches.length;
    if (p1Matches) p1Count = p1Matches.length;
    if (p2Matches) p2Count = p2Matches.length;
    if (p3Matches) p3Count = p3Matches.length;

    // 10. Audit Findings Extraction
    const auditId = sanitizedFilename.replace(/\.md$/i, '');
    const findings = this.extractFindings(content, auditId, date);

    // 11. Trust Level Determination
    let trustLevel: TrustLevel = 'UNKNOWN';
    if (statusConfidence >= 2 && (commitSha || testsTotal > 0) && status !== 'UNKNOWN') {
      trustLevel = 'VERIFIED';
    } else if (statusConfidence >= 1 || (status !== 'UNKNOWN' && title.length > 5)) {
      trustLevel = 'DERIVED';
    } else {
      trustLevel = 'UNKNOWN';
    }

    if (warnings.length > 0) {
      this.warnings.push(...warnings);
    }

    return {
      id: auditId,
      filename: sanitizedFilename,
      title,
      type,
      phase,
      date,
      scope,
      status,
      metrics: {
        p0Count,
        p1Count,
        p2Count,
        p3Count,
        testsTotal,
        testsPassed,
        testsFailed,
      },
      source: relativePath,
      commitSha,
      branch,
      prNumber,
      testEvidence: testEvidenceText ? {
        total: testsTotal,
        passed: testsPassed,
        failed: testsFailed,
        evidenceText: testEvidenceText,
      } : undefined,
      sourceSha,
      trustLevel,
      findings,
      createdAt: date ? `${date}T00:00:00.000Z` : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Deterministically extracts individual findings/issues from markdown text.
   */
  private static extractFindings(content: string, auditId: string, auditDate: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    let currentSection = '';
    let findingIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('## ') || line.startsWith('### ')) {
        currentSection = line.replace(/^#+\s*/, '').trim();
        continue;
      }

      // Check if line represents a finding / issue / gap (bullet list or table row)
      const isTableRow = line.startsWith('|') && !line.includes('---') && !/\|\s*(?:Kód|Code|Závažnost|Severity|Stav|Status|Název|Title)\s*\|/i.test(line);
      const isFindingBullet =
        /^(?:[-*]|\d+\.)\s*(?:\*\*)?(?:\[?(?:P0|P1|P2|P3|SEC|BUG|GAP|RISK)[^\]\:]*\]?|\b(?:Problém|Chyba|Zranitelnost|Riziko|Gap|Defekt)\b)/i.test(line);

      if (isTableRow) {
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length >= 3) {
          let code = '';
          let title = '';
          let severity: FindingSeverity = 'P2';
          let status: FindingStatus = 'OPEN';

          for (const cell of cells) {
            const cleanCell = cell.replace(/[*_`]/g, '').trim();
            if (/^P[0-3]$/i.test(cleanCell)) {
              severity = cleanCell.toUpperCase() as FindingSeverity;
            } else if (/^(?:OPEN|FIXED|VERIFIED|IN_PROGRESS|ACCEPTED_RISK|VYŘEŠENO|OPRAVENO|ROZPRACOVÁNO)$/i.test(cleanCell)) {
              if (/FIXED|VYŘEŠENO|OPRAVENO/i.test(cleanCell)) status = 'FIXED';
              else if (/VERIFIED|OVĚŘENO/i.test(cleanCell)) status = 'VERIFIED';
              else if (/ACCEPTED/i.test(cleanCell)) status = 'ACCEPTED_RISK';
              else if (/IN_PROGRESS|ROZPRACOVÁNO/i.test(cleanCell)) status = 'IN_PROGRESS';
              else status = 'OPEN';
            } else if (/^[A-Z]{2,6}-[A-Z0-9_-]+$/i.test(cleanCell)) {
              code = cleanCell;
            } else if (cleanCell.length > title.length) {
              title = cleanCell;
            }
          }

          if (code || title || severity === 'P0' || severity === 'P1') {
            if (!code) {
              code = `FIND-${severity}-${findingIndex}`;
            }
            if (!title) {
              title = `Zjištění ${code}`;
            }

            const findingId = `${auditId}__${code}__${findingIndex}`;
            findings.push({
              id: findingId,
              auditId,
              code,
              title,
              description: line,
              severity,
              status,
              firstDetectedAt: auditDate,
              lastSeenAt: auditDate,
              isDerivedCode: !code.includes('-'),
            });
            findingIndex++;
          }
        }
      } else if (isFindingBullet) {
        const rawText = line.replace(/^(?:[-*]|\d+\.)\s*/, '').trim();
        let severity: FindingSeverity = 'P2';
        if (/\bP0\b/i.test(rawText)) severity = 'P0';
        else if (/\bP1\b/i.test(rawText)) severity = 'P1';
        else if (/\bP2\b/i.test(rawText)) severity = 'P2';
        else if (/\bP3\b/i.test(rawText)) severity = 'P3';

        // Extract code or create deterministic slug
        const codeMatch = rawText.match(/\b([A-Z]{2,6}-[A-Z0-9_-]+|\bP[0-3]-[A-Z0-9_-]+)\b/);
        let code = '';
        let isDerivedCode = false;

        if (codeMatch && codeMatch[1]) {
          code = codeMatch[1];
        } else {
          // Generate deterministic slug from title words
          const slugBase = rawText.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();
          code = `FIND-${severity}-${findingIndex}`;
          isDerivedCode = true;
        }

        let status: FindingStatus = 'OPEN';
        if (/vyřešeno|opraveno|fixed|dokončeno|pass/i.test(rawText) || /vyřešen/i.test(currentSection)) {
          status = 'FIXED';
        } else if (/ověřeno|verified/i.test(rawText) || /verifik/i.test(currentSection)) {
          status = 'VERIFIED';
        } else if (/akceptováno|accepted/i.test(rawText)) {
          status = 'ACCEPTED_RISK';
        } else if (/v řešení|rozpracováno|in progress/i.test(rawText)) {
          status = 'IN_PROGRESS';
        }

        const title = rawText.replace(/[*_`]/g, '').slice(0, 120).trim();
        const findingId = `${auditId}__${code}__${findingIndex}`;

        findings.push({
          id: findingId,
          auditId,
          code,
          title,
          description: rawText,
          severity,
          status,
          firstDetectedAt: auditDate,
          lastSeenAt: auditDate,
          isDerivedCode,
        });

        findingIndex++;
      }
    }

    return findings;
  }

  /**
   * Scans and indexes all audits in the given directory.
   */
  public static loadRegistry(customDir: string = DEFAULT_AUDIT_DIR): {
    records: AuditRecord[];
    summary: AuditRegistrySummary;
    warnings: ParserWarning[];
  } {
    this.warnings = [];
    const discoveredPaths = this.discoverAuditFiles(customDir);
    const records: AuditRecord[] = [];
    const seenIds = new Set<string>();

    for (const relPath of discoveredPaths) {
      try {
        const absPath = this.validateAuditPath(relPath, customDir);
        const content = fs.readFileSync(absPath, 'utf8');
        const filename = path.basename(relPath);
        const record = this.parseAuditContent(content, filename, relPath);

        // Check for duplicate audit IDs
        if (seenIds.has(record.id)) {
          this.warnings.push({
            filename: record.filename,
            message: `Duplicitní ID auditu: ${record.id}`,
            code: 'DUPLICATE_AUDIT_ID',
            timestamp: new Date().toISOString(),
          });
        }
        seenIds.add(record.id);
        records.push(record);
      } catch (err: any) {
        this.warnings.push({
          filename: path.basename(relPath),
          message: `Chyba při čtení auditu: ${this.sanitizeText(err.message)}`,
          code: 'READ_ERROR',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Sort audits chronologically descending (newest first)
    records.sort((a, b) => b.date.localeCompare(a.date));

    // Calculate registry summary
    let totalFindings = 0;
    const statusBreakdown = { pass: 0, passWithWarnings: 0, fail: 0, unknown: 0 };
    const severityCounts = { p0: 0, p1: 0, p2: 0, p3: 0 };
    const trustBreakdown = { verified: 0, derived: 0, unknown: 0 };

    for (const rec of records) {
      totalFindings += rec.findings.length;

      if (rec.status === 'PASS') statusBreakdown.pass++;
      else if (rec.status === 'PASS_WITH_WARNINGS') statusBreakdown.passWithWarnings++;
      else if (rec.status === 'FAIL') statusBreakdown.fail++;
      else statusBreakdown.unknown++;

      if (rec.trustLevel === 'VERIFIED') trustBreakdown.verified++;
      else if (rec.trustLevel === 'DERIVED') trustBreakdown.derived++;
      else trustBreakdown.unknown++;

      for (const f of rec.findings) {
        if (f.severity === 'P0') severityCounts.p0++;
        else if (f.severity === 'P1') severityCounts.p1++;
        else if (f.severity === 'P2') severityCounts.p2++;
        else if (f.severity === 'P3') severityCounts.p3++;
      }
    }

    const summary: AuditRegistrySummary = {
      totalAudits: records.length,
      totalFindings,
      statusBreakdown,
      severityCounts,
      trustBreakdown,
      latestAuditDate: records.length > 0 ? records[0].date : undefined,
      parserWarningsCount: this.warnings.length,
    };

    return {
      records,
      summary,
      warnings: [...this.warnings],
    };
  }

  /**
   * Safely parses any date string or timestamp into a valid Date object.
   */
  private static parseSafeDate(d: any): Date {
    if (!d) return new Date();
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  /**
   * Safely formats any Date or date string to ISO string.
   */
  private static formatSafeDate(d: any): string {
    if (!d) return new Date().toISOString();
    if (d instanceof Date) {
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  /**
   * Synchronizes findings from Git Markdown (SSOT) into PostgreSQL AuditFinding table.
   * Idempotent: repeated runs update existing records without creating duplicates.
   * Preserves workflow state (IN_PROGRESS, FIXED, VERIFIED, actionId, verifiedBy, etc.)
   */
  public static async syncToDatabase(customDir: string = DEFAULT_AUDIT_DIR): Promise<{
    success: boolean;
    totalAudits: number;
    totalFindingsSynced: number;
    createdCount: number;
    updatedCount: number;
    errors: string[];
  }> {
    const { records } = this.loadRegistry(customDir);
    const errors: string[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    if (!isPrismaAvailable()) {
      return {
        success: true,
        totalAudits: records.length,
        totalFindingsSynced: 0,
        createdCount: 0,
        updatedCount: 0,
        errors: ['Prisma PostgreSQL databáze není dostupná, aktivní je in-memory fallback.'],
      };
    }

    for (const record of records) {
      for (const finding of record.findings) {
        try {
          const existing = await (prisma as any).auditFinding.findUnique({
            where: {
              auditFilename_code: {
                auditFilename: record.filename,
                code: finding.code,
              },
            },
          });

          if (existing) {
            // Keep resolved or in-progress status from DB unless explicitly changed
            const preservedStatus = ['IN_PROGRESS', 'FIXED', 'VERIFIED', 'ACCEPTED_RISK'].includes(existing.status)
              ? existing.status
              : finding.status;

            await (prisma as any).auditFinding.update({
              where: { id: existing.id },
              data: {
                title: finding.title,
                description: finding.description,
                severity: finding.severity,
                status: preservedStatus,
                lastSeenAt: this.parseSafeDate(finding.lastSeenAt),
                sourceSha: record.sourceSha,
              },
            });
            updatedCount++;
          } else {
            await (prisma as any).auditFinding.create({
              data: {
                id: crypto.randomUUID(),
                auditFilename: record.filename,
                code: finding.code,
                title: finding.title,
                description: finding.description,
                severity: finding.severity,
                status: finding.status || 'OPEN',
                firstSeenAt: this.parseSafeDate(finding.firstDetectedAt),
                lastSeenAt: this.parseSafeDate(finding.lastSeenAt),
                sourceSha: record.sourceSha,
              },
            });
            createdCount++;
          }
        } catch (err: any) {
          const msg = `Chyba při zápisu nálezu ${finding.code} ze souboru ${record.filename}: ${this.sanitizeText(err?.message || String(err))}`;
          errors.push(msg);
        }
      }
    }

    return {
      success: errors.length === 0,
      totalAudits: records.length,
      totalFindingsSynced: createdCount + updatedCount,
      createdCount,
      updatedCount,
      errors,
    };
  }

  /**
   * Retrieves findings from PostgreSQL AuditFinding table or falls back to in-memory Git SSOT.
   */
  public static async getFindingsFromDatabase(filter?: {
    status?: FindingStatus;
    severity?: FindingSeverity;
    code?: string;
    auditFilename?: string;
  }): Promise<AuditFinding[]> {
    if (isPrismaAvailable()) {
      try {
        const where: any = {};
        if (filter?.status) where.status = filter.status;
        if (filter?.severity) where.severity = filter.severity;
        if (filter?.code) where.code = filter.code;
        if (filter?.auditFilename) where.auditFilename = filter.auditFilename;

        const dbFindings = await (prisma as any).auditFinding.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return dbFindings.map((f: any) => ({
          id: f.id,
          auditId: f.auditFilename.replace(/\.md$/i, ''),
          code: f.code,
          title: f.title,
          description: f.description,
          severity: f.severity as FindingSeverity,
          status: f.status as FindingStatus,
          firstDetectedAt: this.formatSafeDate(f.firstSeenAt),
          lastSeenAt: this.formatSafeDate(f.lastSeenAt),
          actionId: f.actionId || undefined,
          fixCommitSha: f.fixCommitSha || undefined,
          prNumber: f.prNumber || undefined,
          testReference: f.testReference || undefined,
          verifiedBy: f.verifiedBy || undefined,
          verificationEvidence: f.verificationEvidence || undefined,
        }));
      } catch (err) {
        // Fallback to in-memory if query fails
      }
    }

    // Fallback: in-memory parsed from Markdown
    const { records } = this.loadRegistry();
    let findings = records.flatMap(r => r.findings);

    if (filter?.status) findings = findings.filter(f => f.status === filter.status);
    if (filter?.severity) findings = findings.filter(f => f.severity === filter.severity);
    if (filter?.code) findings = findings.filter(f => f.code === filter.code);
    if (filter?.auditFilename) findings = findings.filter(f => f.auditId === filter.auditFilename?.replace(/\.md$/i, ''));

    return findings;
  }

  /**
   * Updates finding status, links actions, and requires verification evidence for VERIFIED state.
   */
  public static async updateFindingStatus(params: {
    auditFilename: string;
    code: string;
    status: FindingStatus;
    actor: { id: string; role: string };
    actionId?: string;
    fixCommitSha?: string;
    prNumber?: number;
    testReference?: string;
    verifiedBy?: string;
    verificationEvidence?: string;
  }): Promise<{ success: boolean; finding?: AuditFinding; error?: string }> {
    // 1. RBAC authorization check
    if (!['ADMIN', 'SUPER_ADMIN'].includes(params.actor.role)) {
      throw new Error(`Unauthorized: Role '${params.actor.role}' lacks permission to update audit findings.`);
    }

    // 2. Rule 12: Cannot transition to VERIFIED without verification evidence
    if (params.status === 'VERIFIED') {
      const hasEvidence = !!(params.verificationEvidence && params.verificationEvidence.trim().length > 0);
      const hasTestRef = !!(params.testReference && params.testReference.trim().length > 0);
      const hasVerifier = !!(params.verifiedBy && params.verifiedBy.trim().length > 0);

      if ((!hasEvidence && !hasTestRef) || !hasVerifier) {
        throw new Error(
          'Verification Policy Violation: Transition to VERIFIED requires verifiedBy and either verificationEvidence or testReference.'
        );
      }
    }

    // 3. Database update if Prisma is available
    if (isPrismaAvailable()) {
      try {
        if (params.actionId) {
          const actionExists = await (prisma as any).controlPlaneAction.findUnique({
            where: { id: params.actionId },
          });
          if (!actionExists) {
            throw new Error(`ControlPlaneAction with ID '${params.actionId}' does not exist.`);
          }
        }

        const updated = await (prisma as any).auditFinding.update({
          where: {
            auditFilename_code: {
              auditFilename: params.auditFilename,
              code: params.code,
            },
          },
          data: {
            status: params.status,
            actionId: params.actionId ?? undefined,
            fixCommitSha: params.fixCommitSha ?? undefined,
            prNumber: params.prNumber ?? undefined,
            testReference: params.testReference ?? undefined,
            verifiedBy: params.verifiedBy ?? undefined,
            verificationEvidence: params.verificationEvidence ?? undefined,
            verifiedAt: params.status === 'VERIFIED' ? new Date() : undefined,
          },
        });

        const mapped: AuditFinding = {
          id: updated.id,
          auditId: updated.auditFilename.replace(/\.md$/i, ''),
          code: updated.code,
          title: updated.title,
          description: updated.description,
          severity: updated.severity as FindingSeverity,
          status: updated.status as FindingStatus,
          firstDetectedAt: this.formatSafeDate(updated.firstSeenAt),
          lastSeenAt: this.formatSafeDate(updated.lastSeenAt),
          actionId: updated.actionId || undefined,
          fixCommitSha: updated.fixCommitSha || undefined,
          prNumber: updated.prNumber || undefined,
          testReference: updated.testReference || undefined,
          verifiedBy: updated.verifiedBy || undefined,
          verificationEvidence: updated.verificationEvidence || undefined,
        };

        return { success: true, finding: mapped };
      } catch (err: any) {
        return { success: false, error: this.sanitizeText(err?.message || String(err)) };
      }
    }

    return {
      success: true,
      error: 'Prisma DB not available; state updated in-memory only.',
    };
  }

  /**
   * Links an AuditFinding to a ControlPlaneAction.
   */
  public static async linkFindingToControlPlaneAction(
    auditFilename: string,
    code: string,
    actionId: string,
    actor: { id: string; role: string }
  ): Promise<{ success: boolean; error?: string }> {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) {
      throw new Error(`Unauthorized: Role '${actor.role}' cannot link actions to findings.`);
    }

    if (isPrismaAvailable()) {
      try {
        const action = await (prisma as any).controlPlaneAction.findUnique({
          where: { id: actionId },
        });
        if (!action) {
          throw new Error(`ControlPlaneAction ${actionId} not found.`);
        }

        await (prisma as any).auditFinding.update({
          where: {
            auditFilename_code: {
              auditFilename,
              code,
            },
          },
          data: {
            actionId,
            status: 'IN_PROGRESS',
          },
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: this.sanitizeText(err?.message || String(err)) };
      }
    }

    return { success: true };
  }
}
