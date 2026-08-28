import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { AuditDocumentItem, AuditShareItem, AuditCenterStats, AuditCategoryType, AuditStatusType } from '../types';

const ROOT_DIR = process.cwd();

// Disallowed path patterns to prevent directory traversal or reading non-audit files
const ALLOWED_DIRS = ['audits', 'docs/audit', 'docs', '.'];
const IGNORED_DIRS = ['node_modules', 'dist', '.git', '.next', 'coverage', 'build', 'public'];

interface ScanOptions {
  forceResync?: boolean;
}

export class AuditCenterService {
  /**
   * Safely checks if a filepath is within workspace and refers to a valid .md file.
   */
  private static validatePath(filePath: string): string {
    const absolutePath = path.resolve(ROOT_DIR, filePath);
    if (!absolutePath.startsWith(ROOT_DIR)) {
      throw new Error('Bezpečnostní chyba: Pokus o přístup mimo kořenový adresář repozitáře.');
    }
    if (!filePath.toLowerCase().endsWith('.md')) {
      throw new Error('Bezpečnostní chyba: Auditní dokument musí být typu Markdown (.md).');
    }
    return absolutePath;
  }

  /**
   * Recursively discovers all audit markdown files in audits/ and docs/audit/
   */
  public static discoverAuditFiles(): string[] {
    const foundFiles: string[] = [];

    const scanDirectory = (dirRelative: string) => {
      const fullDir = path.resolve(ROOT_DIR, dirRelative);
      if (!fs.existsSync(fullDir)) return;

      const entries = fs.readdirSync(fullDir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_DIRS.includes(entry.name)) continue;

        const relativeEntryPath = path.join(dirRelative, entry.name).replace(/\\/g, '/');
        if (entry.isDirectory()) {
          scanDirectory(relativeEntryPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
          // Check if file is an audit report (either in audits/ / docs/audit/ or contains 'AUDIT' in filename/path)
          const isAuditPath =
            relativeEntryPath.startsWith('audits/') ||
            relativeEntryPath.startsWith('docs/audit/') ||
            entry.name.toUpperCase().includes('AUDIT');

          if (isAuditPath) {
            foundFiles.push(relativeEntryPath);
          }
        }
      }
    };

    scanDirectory('audits');
    scanDirectory('docs/audit');
    scanDirectory('docs');

    // Deduplicate relative paths
    return Array.from(new Set(foundFiles));
  }

  /**
   * Parses Markdown metadata, title, category, status, summary, and Git info.
   */
  public static parseAuditFile(relativeFilePath: string): {
    title: string;
    category: AuditCategoryType;
    status: AuditStatusType;
    summary: string;
    auditDate: string;
    author: string;
    sourceSha: string;
    commitSha: string;
    branch: string;
    content: string;
  } {
    const absolutePath = this.validatePath(relativeFilePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');

    // Generate content hash
    const sourceSha = crypto.createHash('sha256').update(content).digest('hex');

    // Git metadata extraction with safe fallback
    let commitSha = '';
    let author = '';
    let branch = 'main';

    try {
      const gitLog = execFileSync('git', ['log', '-1', '--format=%H|%an|%cd', '--', relativeFilePath], {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      if (gitLog) {
        const parts = gitLog.split('|');
        commitSha = parts[0] || '';
        author = parts[1] || '';
      }

      branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || 'main';
    } catch {
      // Git command failed or non-git environment
    }

    // Title extraction: First # heading or clean filename
    let title = '';
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch && headingMatch[1]) {
      title = headingMatch[1].replace(/[*_#`]/g, '').trim();
    } else {
      const baseName = path.basename(relativeFilePath, '.md');
      title = baseName.replace(/_/g, ' ').replace(/-/g, ' ');
    }

    // Date extraction: **Datum:** ... or filename date (YYYY-MM-DD)
    let auditDate = '';
    const dateMatch = content.match(/\*\*Datum:\*\*\s*(.+)/i) || content.match(/Datum:\s*(.+)/i);
    if (dateMatch && dateMatch[1]) {
      auditDate = dateMatch[1].trim();
    } else {
      const filenameDateMatch = relativeFilePath.match(/(\d{4}-\d{2}-\d{2})/);
      if (filenameDateMatch) {
        auditDate = filenameDateMatch[1];
      } else {
        auditDate = new Date().toISOString().split('T')[0];
      }
    }

    // Author extraction
    if (!author) {
      const authorMatch = content.match(/\*\*Autor:\*\*\s*(.+)/i) || content.match(/Autor:\s*(.+)/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1].trim();
      } else {
        author = 'Dev3 Architekt & QA';
      }
    }

    // Category auto-detection
    const category = this.detectCategory(relativeFilePath, content);

    // Status auto-detection
    const status = this.detectStatus(content);

    // Summary extraction: Executive summary or first paragraph after heading
    const summary = this.extractSummary(content);

    return {
      title,
      category,
      status,
      summary,
      auditDate,
      author,
      sourceSha,
      commitSha,
      branch,
      content,
    };
  }

  /**
   * Category detection based on file path and content keywords
   */
  private static detectCategory(filePath: string, content: string): AuditCategoryType {
    const upperPath = filePath.toUpperCase();
    const upperContent = content.toUpperCase();

    if (
      upperPath.includes('SECURITY') ||
      upperContent.includes('SECURITY') ||
      upperContent.includes('BEZPEČNOST') ||
      upperContent.includes('HARDENING')
    ) {
      return 'SECURITY';
    }
    if (
      upperPath.includes('REGISTRY') ||
      upperPath.includes('SOUDY') ||
      upperPath.includes('OSPOD') ||
      upperContent.includes('REGISTR SUBJEKTŮ')
    ) {
      return 'REGISTRY';
    }
    if (upperPath.includes('CONTENT') || upperContent.includes('OBSAH') || upperContent.includes('GUIDE')) {
      return 'CONTENT';
    }
    if (upperPath.includes('CMS') || upperContent.includes('PUCK')) {
      return 'CMS';
    }
    if (
      upperPath.includes('ARCHITECTURE') ||
      upperContent.includes('ARCHITEKTURA') ||
      upperContent.includes('INFRASTRUKTURA')
    ) {
      return 'ARCHITECTURE';
    }
    if (upperPath.includes('DATA') || upperContent.includes('POSTGRESQL') || upperContent.includes('PRISMA')) {
      return 'DATA';
    }
    if (upperPath.includes('QA') || upperContent.includes('TESTING') || upperContent.includes('E2E')) {
      return 'QA';
    }
    if (upperPath.includes('PERFORMANCE') || upperContent.includes('VÝKON')) {
      return 'PERFORMANCE';
    }
    if (upperPath.includes('LEGAL') || upperContent.includes('E-SBÍRKA') || upperContent.includes('LEGISLATIVA')) {
      return 'LEGAL';
    }
    if (upperPath.includes('RESEARCH') || upperContent.includes('VÝZKUM')) {
      return 'RESEARCH';
    }

    return 'OTHER';
  }

  /**
   * Status detection from content. Defaults to UNKNOWN if status is not explicitly stated.
   */
  private static detectStatus(content: string): AuditStatusType {
    const upperContent = content.toUpperCase();

    // Check for explicit status markers or test results
    if (
      upperContent.includes('STAV: PASS') ||
      upperContent.includes('VÝSLEDEK: PASS') ||
      upperContent.includes('STATUS: PASS') ||
      upperContent.includes('BUILD: PASS') ||
      upperContent.includes('TESTS: PASS') ||
      upperContent.includes('VŠECHNY TESTY PROŠLY') ||
      upperContent.includes('100% PASS')
    ) {
      return 'PASS';
    }

    if (
      upperContent.includes('STAV: FAIL') ||
      upperContent.includes('VÝSLEDEK: FAIL') ||
      upperContent.includes('STATUS: FAIL') ||
      upperContent.includes('CRITICAL_FAILURE') ||
      upperContent.includes('STOP. NECOMMITUJ')
    ) {
      return 'FAIL';
    }

    if (
      upperContent.includes('STAV: WARNING') ||
      upperContent.includes('VÝSLEDEK: WARNING') ||
      upperContent.includes('STATUS: WARNING') ||
      upperContent.includes('OTEVŘENÁ RIZIKA') ||
      upperContent.includes('RATING: MEDIUM') ||
      upperContent.includes('UPOZORNĚNÍ')
    ) {
      return 'WARNING';
    }

    if (upperContent.includes('STAV: INFO') || upperContent.includes('INFORMAČNÍ REPORT')) {
      return 'INFO';
    }

    // Default status when no explicit result tag is declared in document
    return 'UNKNOWN';
  }

  /**
   * Extracts a concise summary paragraph from the document
   */
  private static extractSummary(content: string): string {
    const lines = content.split('\n');
    const filteredLines = lines.filter((l) => {
      const trimmed = l.trim();
      return (
        trimmed.length > 0 &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('---') &&
        !trimmed.startsWith('**Datum:') &&
        !trimmed.startsWith('**Autor:') &&
        !trimmed.startsWith('**Oblast:')
      );
    });

    if (filteredLines.length > 0) {
      const firstChunk = filteredLines.slice(0, 3).join(' ');
      const cleanText = firstChunk.replace(/[*_#`]/g, '').trim();
      return cleanText.length > 280 ? cleanText.slice(0, 280) + '...' : cleanText;
    }

    return 'Auditní zpráva systému Táta má právo (dev3).';
  }

  /**
   * Scans filesystem and synchronizes audit records with DB / dbStore
   */
  public static async syncAudits(options: ScanOptions = {}): Promise<{
    syncedCount: number;
    stats: AuditCenterStats;
  }> {
    const discoveredFiles = this.discoverAuditFiles();
    let syncedCount = 0;
    const now = new Date().toISOString();

    for (const filePath of discoveredFiles) {
      try {
        const parsed = this.parseAuditFile(filePath);

        if (isPrismaAvailable() && prisma) {
          await prisma.auditDocument.upsert({
            where: { sourcePath: filePath },
            create: {
              sourcePath: filePath,
              title: parsed.title,
              category: parsed.category,
              status: parsed.status,
              summary: parsed.summary,
              content: parsed.content,
              auditDate: parsed.auditDate,
              author: parsed.author,
              sourceSha: parsed.sourceSha,
              commitSha: parsed.commitSha,
              branch: parsed.branch,
              sourceUrl: `/api/admin/audits/file?path=${encodeURIComponent(filePath)}`,
              lastSyncedAt: new Date(),
            },
            update: {
              title: parsed.title,
              category: parsed.category,
              status: parsed.status,
              summary: parsed.summary,
              content: parsed.content,
              auditDate: parsed.auditDate,
              author: parsed.author,
              sourceSha: parsed.sourceSha,
              commitSha: parsed.commitSha,
              branch: parsed.branch,
              lastSyncedAt: new Date(),
            },
          });
        } else {
          // Fallback to dbStore
          const existingIndex = dbStore.auditDocuments.findIndex((doc) => doc.sourcePath === filePath);
          const docRecord: AuditDocumentItem = {
            id: existingIndex >= 0 ? dbStore.auditDocuments[existingIndex].id : 'doc-' + crypto.randomUUID(),
            sourcePath: filePath,
            title: parsed.title,
            category: parsed.category,
            status: parsed.status,
            summary: parsed.summary,
            content: parsed.content,
            auditDate: parsed.auditDate,
            author: parsed.author,
            sourceSha: parsed.sourceSha,
            commitSha: parsed.commitSha,
            branch: parsed.branch,
            sourceUrl: `/api/admin/audits/file?path=${encodeURIComponent(filePath)}`,
            discoveredAt: existingIndex >= 0 ? dbStore.auditDocuments[existingIndex].discoveredAt : now,
            lastSyncedAt: now,
            createdAt: existingIndex >= 0 ? dbStore.auditDocuments[existingIndex].createdAt : now,
            updatedAt: now,
          };

          if (existingIndex >= 0) {
            dbStore.auditDocuments[existingIndex] = docRecord;
          } else {
            dbStore.auditDocuments.push(docRecord);
          }
        }
        syncedCount++;
      } catch (err) {
        console.error(`[AuditCenter] Chyba při synchronizaci souboru ${filePath}:`, err);
      }
    }

    const stats = await this.getStats();
    return { syncedCount, stats };
  }

  /**
   * Retrieves summary statistics
   */
  public static async getStats(): Promise<AuditCenterStats> {
    let docs: AuditDocumentItem[] = [];

    if (isPrismaAvailable() && prisma) {
      try {
        const prismaDocs = await prisma.auditDocument.findMany();
        docs = prismaDocs as any[];
      } catch {
        docs = dbStore.auditDocuments;
      }
    } else {
      docs = dbStore.auditDocuments;
    }

    const total = docs.length;
    const passCount = docs.filter((d) => d.status === 'PASS').length;
    const warningCount = docs.filter((d) => d.status === 'WARNING').length;
    const failCount = docs.filter((d) => d.status === 'FAIL').length;
    const unknownCount = docs.filter((d) => d.status === 'UNKNOWN' || d.status === 'INFO').length;

    const lastSynced = docs.reduce((latest, d) => {
      const syncDate = d.lastSyncedAt || d.updatedAt || '';
      return syncDate > latest ? syncDate : latest;
    }, '');

    return {
      total,
      passCount,
      warningCount,
      failCount,
      unknownCount,
      lastSyncedAt: lastSynced || new Date().toISOString(),
    };
  }

  /**
   * Queries list of audit documents with filtering and search
   */
  public static async getAudits(params: {
    category?: string;
    status?: string;
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'title';
  }): Promise<{ documents: AuditDocumentItem[]; stats: AuditCenterStats }> {
    // Perform auto-sync if store is currently empty
    const currentStats = await this.getStats();
    if (currentStats.total === 0) {
      await this.syncAudits();
    }

    let docs: AuditDocumentItem[] = [];

    if (isPrismaAvailable() && prisma) {
      try {
        const whereClause: any = {};

        if (params.category && params.category !== 'ALL') {
          whereClause.category = params.category;
        }

        if (params.status && params.status !== 'ALL') {
          whereClause.status = params.status;
        }

        if (params.search && params.search.trim()) {
          const query = params.search.trim();
          whereClause.OR = [
            { title: { contains: query, mode: 'insensitive' } },
            { sourcePath: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
            { author: { contains: query, mode: 'insensitive' } },
          ];
        }

        const dbDocs = await prisma.auditDocument.findMany({
          where: whereClause,
          include: { shares: true },
          orderBy:
            params.sortBy === 'oldest'
              ? { createdAt: 'asc' }
              : params.sortBy === 'title'
              ? { title: 'asc' }
              : { createdAt: 'desc' },
        });

        docs = dbDocs as any[];
      } catch (err) {
        console.warn('[AuditCenter] Prisma query failed, falling back to dbStore:', err);
        docs = this.filterDbStoreAudits(params);
      }
    } else {
      docs = this.filterDbStoreAudits(params);
    }

    const stats = await this.getStats();
    return { documents: docs, stats };
  }

  /**
   * Helper filter for in-memory dbStore
   */
  private static filterDbStoreAudits(params: {
    category?: string;
    status?: string;
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'title';
  }): AuditDocumentItem[] {
    let result = [...dbStore.auditDocuments];

    if (params.category && params.category !== 'ALL') {
      result = result.filter((d) => d.category === params.category);
    }

    if (params.status && params.status !== 'ALL') {
      result = result.filter((d) => d.status === params.status);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.sourcePath.toLowerCase().includes(q) ||
          (d.summary && d.summary.toLowerCase().includes(q)) ||
          (d.author && d.author.toLowerCase().includes(q))
      );
    }

    if (params.sortBy === 'oldest') {
      result.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    } else if (params.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    return result;
  }

  /**
   * Gets a single audit document by ID or relative sourcePath, loading raw Markdown content from filesystem safely.
   */
  public static async getAuditById(idOrPath: string): Promise<AuditDocumentItem & { content: string }> {
    let doc: AuditDocumentItem | null = null;

    if (isPrismaAvailable() && prisma) {
      try {
        const found = await prisma.auditDocument.findFirst({
          where: {
            OR: [{ id: idOrPath }, { sourcePath: idOrPath }],
          },
          include: { shares: true },
        });
        if (found) doc = found as any;
      } catch {
        // Fallback
      }
    }

    if (!doc) {
      const foundInStore = dbStore.auditDocuments.find((d) => d.id === idOrPath || d.sourcePath === idOrPath);
      if (foundInStore) doc = foundInStore;
    }

    if (!doc) {
      // Try to parse file directly if it exists on disk
      if (fs.existsSync(path.resolve(ROOT_DIR, idOrPath))) {
        const parsed = this.parseAuditFile(idOrPath);
        doc = {
          id: 'doc-' + crypto.randomUUID(),
          sourcePath: idOrPath,
          title: parsed.title,
          category: parsed.category,
          status: parsed.status,
          summary: parsed.summary,
          auditDate: parsed.auditDate,
          author: parsed.author,
          sourceSha: parsed.sourceSha,
          commitSha: parsed.commitSha,
          branch: parsed.branch,
          discoveredAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    if (!doc) {
      throw new Error('Auditní dokument nebyl nalezen.');
    }

    // Prefer content from DB if it exists (survives container restart)
    if (doc.content) {
      return doc as AuditDocumentItem & { content: string };
    }

    // Safely read filesystem content fallback (for old documents or dynamically generated ones not yet pushed to DB)
    const absolutePath = this.validatePath(doc.sourcePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Soubor auditního reportu na cestě ${doc.sourcePath} neexistuje (a nenalezen ani v databázi).`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    return {
      ...doc,
      content,
    };
  }

  /**
   * Generates a cryptographic share link token for an audit document
   */
  public static async createShareLink(
    auditId: string,
    options: { accessMode?: string; expiresDays?: number; createdBy?: string }
  ): Promise<{ rawToken: string; shareUrl: string; shareRecord: AuditShareItem }> {
    // Verify audit exists
    const audit = await this.getAuditById(auditId);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const now = new Date();
    let expiresAt: Date | null = null;
    if (options.expiresDays && options.expiresDays > 0) {
      expiresAt = new Date(now.getTime() + options.expiresDays * 24 * 60 * 60 * 1000);
    }

    const shareUrl = `/audit/share/${rawToken}`;

    if (isPrismaAvailable() && prisma) {
      const share = await prisma.auditShare.create({
        data: {
          auditId: audit.id,
          tokenHash,
          rawToken,
          accessMode: options.accessMode || 'SHARED_LINK',
          createdBy: options.createdBy || 'system',
          expiresAt,
        },
      });

      return {
        rawToken,
        shareUrl,
        shareRecord: {
          id: share.id,
          auditId: share.auditId,
          tokenHash: share.tokenHash,
          rawToken: share.rawToken || undefined,
          shareUrl,
          accessMode: share.accessMode,
          createdBy: share.createdBy || undefined,
          expiresAt: share.expiresAt ? share.expiresAt.toISOString() : null,
          revokedAt: share.revokedAt ? share.revokedAt.toISOString() : null,
          createdAt: share.createdAt.toISOString(),
        },
      };
    } else {
      // Memory fallback
      const shareRecord: AuditShareItem = {
        id: 'share-' + crypto.randomUUID(),
        auditId: audit.id,
        tokenHash,
        rawToken,
        shareUrl,
        accessMode: options.accessMode || 'SHARED_LINK',
        createdBy: options.createdBy || 'system',
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        revokedAt: null,
        createdAt: now.toISOString(),
      };

      dbStore.auditShares.push(shareRecord);

      return {
        rawToken,
        shareUrl,
        shareRecord,
      };
    }
  }

  /**
   * Resolves a shared audit document using a raw token
   */
  public static async getSharedAuditByToken(rawToken: string): Promise<{
    audit: AuditDocumentItem;
    content: string;
    shareInfo: AuditShareItem;
  }> {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new Error('Neplatný bezpečnostní token.');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    let shareRecord: any = null;

    if (isPrismaAvailable() && prisma) {
      try {
        shareRecord = await prisma.auditShare.findUnique({
          where: { tokenHash },
          include: { audit: true },
        });
      } catch {
        // Fallback
      }
    }

    if (!shareRecord) {
      shareRecord = dbStore.auditShares.find((s) => s.tokenHash === tokenHash);
    }

    if (!shareRecord) {
      throw new Error('Sdílený odkaz neexistuje nebo vypršela jeho platnost.');
    }

    if (shareRecord.revokedAt) {
      throw new Error('Tento sdílený odkaz byl administrátorem zrušen.');
    }

    if (shareRecord.expiresAt) {
      const exp = new Date(shareRecord.expiresAt);
      if (exp.getTime() < Date.now()) {
        throw new Error('Platnost tohoto sdíleného odkazu již vypršela.');
      }
    }

    const auditId = shareRecord.auditId || (shareRecord.audit ? shareRecord.audit.id : '');
    const auditWithContent = await this.getAuditById(auditId);

    return {
      audit: auditWithContent,
      content: auditWithContent.content,
      shareInfo: {
        id: shareRecord.id,
        auditId: shareRecord.auditId,
        tokenHash: shareRecord.tokenHash,
        accessMode: shareRecord.accessMode,
        createdBy: shareRecord.createdBy,
        expiresAt: shareRecord.expiresAt ? new Date(shareRecord.expiresAt).toISOString() : null,
        revokedAt: shareRecord.revokedAt ? new Date(shareRecord.revokedAt).toISOString() : null,
        createdAt: new Date(shareRecord.createdAt).toISOString(),
      },
    };
  }

  /**
   * Revokes a share link token
   */
  public static async revokeShareLink(shareId: string): Promise<boolean> {
    const now = new Date();

    if (isPrismaAvailable() && prisma) {
      try {
        await prisma.auditShare.update({
          where: { id: shareId },
          data: { revokedAt: now },
        });
        return true;
      } catch {
        // Fallback
      }
    }

    const index = dbStore.auditShares.findIndex((s) => s.id === shareId);
    if (index >= 0) {
      dbStore.auditShares[index].revokedAt = now.toISOString();
      return true;
    }

    return false;
  }
}
