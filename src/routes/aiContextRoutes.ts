import { Router, Request, Response } from 'express';
import { AiContextService } from '../services/aiContextService';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

function getBaseUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'dev3.tatovacesta.cz';
  return `${protocol}://${host}`;
}

router.get('/llms.txt', async (req: Request, res: Response) => {
  try {
    const baseUrl = getBaseUrl(req);
    const md = await AiContextService.generateLlmsTxt(baseUrl);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(md);
  } catch (err: any) {
    console.error('Error generating llms.txt:', err);
    return res.status(500).send('# Error\n\nChyba při generování llms.txt');
  }
});

router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const baseUrl = getBaseUrl(req);
    const xml = await AiContextService.generateSitemapXml(baseUrl);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(xml);
  } catch (err: any) {
    console.error('Error generating sitemap.xml:', err);
    return res.status(500).send('<?xml version="1.0"?><error>Chyba při generování sitemap</error>');
  }
});

router.get('/robots.txt', (req: Request, res: Response) => {
  try {
    const baseUrl = getBaseUrl(req);
    const txt = AiContextService.generateRobotsTxt(baseUrl);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(txt);
  } catch (err: any) {
    console.error('Error generating robots.txt:', err);
    return res.status(500).send('User-agent: *\nDisallow: /');
  }
});

router.get('/api/ai-context/status', async (req: Request, res: Response) => {
  try {
    const baseUrl = getBaseUrl(req);
    const status = await AiContextService.getStatus(baseUrl);
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Chyba při načítání stavu AI Context' });
  }
});

router.post('/api/admin/ai-context/refresh', requireAuth as any, requireRole('ADMIN') as any, async (req: Request, res: Response) => {
  try {
    await AiContextService.getIndex(true);
    const baseUrl = getBaseUrl(req);
    const status = await AiContextService.getStatus(baseUrl);
    return res.json({ success: true, message: 'AI Context index byl úspěšně obnoven.', status });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Chyba při obnově indexu' });
  }
});

export default router;
