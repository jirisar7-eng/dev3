import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * POST /api/system/support-interest
 * Endpoint pro přijetí formuláře podpory a zájmu o členství
 */
router.post('/support-interest', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, interestType, amountOrNote } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Jméno a e-mail jsou povinné údaje.' });
    }
    
    if (prisma) {
      await (prisma as any).formSubmission.create({
        data: {
          formId: 'SUPPORT_INTEREST',
          formName: 'Podpora a členství ve spolku',
          dataJson: JSON.stringify({
            name,
            email,
            phone,
            interestType,
            amountOrNote
          })
        }
      });
    } else {
      console.warn('[Support Interest] Prisma není dostupná, formulář nebyl uložen do DB:', req.body);
    }
    
    res.json({ success: true, message: 'Děkujeme za Váš zájem! Ozveme se Vám co nejdříve.' });
  } catch (error: any) {
    console.error('[Support Interest] Chyba:', error);
    res.status(500).json({ error: 'Chyba při zpracování požadavku.' });
  }
});

/**
 * POST /api/system/webhook-deploy, /api/webhook/deploy, /api/webhooks/github
 * Bezpečný Webhook endpoint pro automatické nasazení kódu z GitHubu.
 */
router.post(['/webhook-deploy', '/deploy', '/', '/github'], (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;

    const headerSecret = (req.headers['x-webhook-secret'] || req.headers['X-Webhook-Secret']) as string | undefined;
    const hubSignature = (req.headers['x-hub-signature-256'] || req.headers['X-Hub-Signature-256']) as string | undefined;

    let isAuthenticated = false;

    if (webhookSecret && webhookSecret.trim() !== '') {
      // 1. Ověření podle přímé hlavičky X-Webhook-Secret
      if (headerSecret && headerSecret === webhookSecret) {
        isAuthenticated = true;
      }

      // 2. Ověření podle HMAC SHA256 podpisu z GitHubu v hlavičce X-Hub-Signature-256
      if (!isAuthenticated && hubSignature) {
        try {
          const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          const hmac = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
          const expectedSignature = `sha256=${hmac}`;

          if (
            hubSignature.length === expectedSignature.length &&
            crypto.timingSafeEqual(Buffer.from(hubSignature), Buffer.from(expectedSignature))
          ) {
            isAuthenticated = true;
          }
        } catch (err) {
          console.error('[Webhook Deploy] Chyba při ověřování HMAC podpisu:', err);
        }
      }
    }

    if (!isAuthenticated) {
      console.warn('[Webhook Deploy] Odmítnut neautorizovaný požadavek (neplatný klíč nebo podpis).');
      return res.status(401).json({
        error: '401 Unauthorized',
        message: 'Neplatný nebo chybějící autentizační klíč/podpis.',
      });
    }

    // Zpracování ping události z GitHubu
    const githubEvent = (req.headers['x-github-event'] || req.headers['X-Github-Event']) as string | undefined;
    if (githubEvent === 'ping') {
      return res.json({
        success: true,
        message: 'Webhook ping přijat v pořádku.',
      });
    }

    // Ignorovat push události do jiných větví než main
    if (req.body && req.body.ref && req.body.ref !== 'refs/heads/main') {
      return res.json({
        success: true,
        message: `Ignorována push událost pro větev ${req.body.ref}. Očekávána větev refs/heads/main.`,
      });
    }

    // 1. Zaloguj událost a zablokuj automatické DB mutace/redeploy během P0 containmentu
    console.log('[Webhook Deploy] Přijat požadavek na automatický redeploy. Automatické změny schématu a restarty jsou během P0 containmentu deaktivovány.');

    return res.status(503).json({
      success: false,
      error: '503 Service Unavailable',
      message: 'Automatický redeploy a databázové mutace přes legacy webhook jsou během P0 containmentu deaktivovány. Nasazení a migrace musí probíhat přes řízený CD/deployment pipeline.',
    });
  } catch (err: any) {
    console.error('[Webhook Deploy CATCH]:', err);
    return res.status(500).json({
      error: '500 Internal Server Error',
      message: 'Chyba při zpracování webhooku.',
    });
  }
});

export default router;
