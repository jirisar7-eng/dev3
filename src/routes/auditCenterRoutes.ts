import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditCenterService } from '../services/auditCenterService';
import { AuditService } from '../services/auditService';
import { AuditRegistryEngine } from '../services/audit/auditRegistryEngine';
import { RegressionEngine } from '../services/audit/regressionEngine';
import { ReleaseGateService } from '../services/audit/releaseGateService';

const router = Router();

/**
 * GET /api/admin/audits/release-gate (or /api/admin/audit-center/release-gate)
 * Evaluates Release Gate verdict and Project Health pillars with server-side authority.
 */
router.get('/release-gate', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customEvidence = req.query.evidence ? JSON.parse(req.query.evidence as string) : undefined;
    const result = await ReleaseGateService.evaluateReleaseGate(customEvidence);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při vyhodnocování Release Gate.',
    });
  }
});

/**
 * GET /api/admin/audits/findings (or /api/admin/audit-center/findings)
 * Returns normalized Audit Registry summary, findings, regressions, severity counts, and parser warnings.
 */
router.get('/findings', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { records, summary, warnings } = AuditRegistryEngine.loadRegistry();
    const regressions = RegressionEngine.analyzeAuditTimeline(records);

    // Extract all findings across all audits
    const allFindings = records.flatMap(r => r.findings);

    res.json({
      success: true,
      data: {
        registrySummary: summary,
        findings: allFindings,
        regressions,
        severityCounts: summary.severityCounts,
        parserWarnings: warnings,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání auditních zjištění a registru.',
    });
  }
});

/**
 * GET /api/admin/audits
 * Lists indexed audit documents with filtering and search.
 */
router.get('/', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, status, search, sortBy } = req.query;

    const result = await AuditCenterService.getAudits({
      category: category as string,
      status: status as string,
      search: search as string,
      sortBy: sortBy as any,
    });

    res.json({
      success: true,
      data: result.documents,
      stats: result.stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání seznamu auditních zpráv.',
    });
  }
});

/**
 * GET /api/admin/audits/stats
 * Gets summary statistics.
 */
router.get('/stats', requireAuth as any, requireRole('ADMIN') as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await AuditCenterService.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při zjišťování statistik auditů.',
    });
  }
});

/**
 * POST /api/admin/audits/sync
 * Triggers re-synchronization of audit documents from filesystem.
 */
router.post('/sync', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const syncResult = await AuditCenterService.syncAudits({ forceResync: true });

    // Record system audit log
    await AuditService.recordLog(
      'SYNC_AUDITS',
      'AUDIT_CENTER',
      `Prováděna manuální re-synchronizace auditních zpráv administrátorem ${req.user?.email || 'admin'}. Synchronizováno ${syncResult.syncedCount} dokumentů.`,
      req.user,
      req.ip
    );

    res.json({
      success: true,
      message: `Úspěšně synchronizováno ${syncResult.syncedCount} auditních dokumentů z repozitáře.`,
      stats: syncResult.stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při synchronizaci auditních dokumentů.',
    });
  }
});

/**
 * GET /api/admin/audits/:id
 * Fetches single audit document detail with raw markdown content.
 */
router.get('/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const audit = await AuditCenterService.getAuditById(id);

    res.json({
      success: true,
      audit,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Auditní dokument nebyl nalezen.',
    });
  }
});

/**
 * GET /api/admin/audits/:id/download
 * Downloads raw Markdown file attachment.
 */
router.get('/:id/download', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const audit = await AuditCenterService.getAuditById(id);

    // Record audit log for file export
    await AuditService.recordLog(
      'DOWNLOAD_AUDIT_MD',
      'AUDIT_CENTER',
      `Stážen Markdown auditního reportu '${audit.title}' (${audit.sourcePath}) uživatelem ${req.user?.email || 'admin'}.`,
      req.user,
      req.ip
    );

    const filename = audit.sourcePath.split('/').pop() || 'audit_report.md';
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(audit.content);
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Chyba při stahování souboru auditu.',
    });
  }
});

/**
 * GET /api/admin/audits/:id/pdf
 * Generates print/PDF HTML view with print stylesheet.
 */
router.get('/:id/pdf', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const audit = await AuditCenterService.getAuditById(id);

    // Record audit log for export
    await AuditService.recordLog(
      'EXPORT_AUDIT_PDF',
      'AUDIT_CENTER',
      `Vygenerován Tisk/PDF náhled auditního reportu '${audit.title}' uživatelem ${req.user?.email || 'admin'}.`,
      req.user,
      req.ip
    );

    // Simple HTML escaping helper for plain server HTML rendering
    const escapeHtml = (unsafe: string) =>
      unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const htmlContent = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Audit Report: ${escapeHtml(audit.title)}</title>
  <style>
    @media print {
      body { font-size: 11pt; line-height: 1.5; color: #000; background: #fff; margin: 0; padding: 20mm; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #f8fafc; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; }
    .badge-PASS { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-WARNING { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-FAIL { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-UNKNOWN { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 13px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
    .meta-item strong { color: #0f172a; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .btn-print { background: #0f172a; color: #fff; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; max-width: 900px; margin: 0 auto 10px;">
    <button class="btn-print" onclick="window.print()">🖨️ Vytisknout / Uložit jako PDF</button>
  </div>
  <div class="container">
    <div class="header">
      <span class="badge badge-${escapeHtml(audit.status)}">STAV: ${escapeHtml(audit.status)}</span>
      <h1 style="margin: 0 0 10px; color: #0f172a;">${escapeHtml(audit.title)}</h1>
      <p style="color: #64748b; margin: 0; font-size: 14px;">Projekt Táta má právo (dev3) – Centrální Audit Center</p>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><strong>Datum auditu:</strong> ${escapeHtml(audit.auditDate || 'Neuvedeno')}</div>
      <div class="meta-item"><strong>Kategorie:</strong> ${escapeHtml(audit.category)}</div>
      <div class="meta-item"><strong>Autor:</strong> ${escapeHtml(audit.author || 'Neuvedeno')}</div>
      <div class="meta-item"><strong>Zdrojový soubor:</strong> <code>${escapeHtml(audit.sourcePath)}</code></div>
      <div class="meta-item"><strong>Git Commit:</strong> <code>${escapeHtml(audit.commitSha ? audit.commitSha.slice(0, 8) : 'N/A')}</code></div>
      <div class="meta-item"><strong>Git Větev:</strong> <code>${escapeHtml(audit.branch || 'main')}</code></div>
    </div>

    <div style="white-space: pre-wrap; font-family: monospace; line-height: 1.6; background: #fafafa; padding: 20px; border-radius: 8px; border: 1px solid #eaeaea;">${escapeHtml(audit.content)}</div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message || 'Chyba při generování PDF náhledu auditu.',
    });
  }
});

/**
 * POST /api/admin/audits/:id/share
 * Generates a share token link.
 */
router.post('/:id/share', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { accessMode, expiresDays } = req.body;

    const shareResult = await AuditCenterService.createShareLink(id, {
      accessMode,
      expiresDays: expiresDays ? parseInt(expiresDays, 10) : undefined,
      createdBy: req.user?.email || 'admin',
    });

    // Record audit log
    await AuditService.recordLog(
      'CREATE_AUDIT_SHARE',
      'AUDIT_CENTER',
      `Vytvořen sdílený odkaz pro audit '${id}' uživatelem ${req.user?.email || 'admin'}.`,
      req.user,
      req.ip
    );

    res.json({
      success: true,
      shareUrl: shareResult.shareUrl,
      rawToken: shareResult.rawToken,
      shareRecord: shareResult.shareRecord,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při vytváření sdíleného odkazu.',
    });
  }
});

/**
 * DELETE /api/admin/audits/shares/:shareId
 * Revokes a share token link.
 */
router.delete('/shares/:shareId', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shareId } = req.params;
    const revoked = await AuditCenterService.revokeShareLink(shareId);

    if (!revoked) {
      return res.status(404).json({
        success: false,
        error: 'Sdílený odkaz nebyl nalezen.',
      });
    }

    // Record audit log
    await AuditService.recordLog(
      'REVOKE_AUDIT_SHARE',
      'AUDIT_CENTER',
      `Zrušen sdílený odkaz '${shareId}' uživatelem ${req.user?.email || 'admin'}.`,
      req.user,
      req.ip
    );

    res.json({
      success: true,
      message: 'Sdílený odkaz byl úspěšně zrušen.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při rušení sdíleného odkazu.',
    });
  }
});

export default router;

/**
 * PUBLIC ROUTE (No Auth Required)
 * GET /api/audit/share/:token
 * Access shared audit document via secure token.
 */
export const publicAuditShareRouter = Router();

publicAuditShareRouter.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await AuditCenterService.getSharedAuditByToken(token);

    // Record audit log for public view
    await AuditService.recordLog(
      'VIEW_SHARED_AUDIT',
      'AUDIT_CENTER',
      `Zobrazen sdílený audit '${result.audit.title}' přes veřejný token.`,
      undefined,
      req.ip
    );

    res.json({
      success: true,
      audit: result.audit,
      content: result.content,
      shareInfo: result.shareInfo,
    });
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: error.message || 'Sdílený odkaz je neplatný, zrušen nebo vypršela jeho platnost.',
    });
  }
});
