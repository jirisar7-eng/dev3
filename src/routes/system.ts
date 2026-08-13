import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';

const router = Router();

/**
 * POST /api/system/webhook-deploy
 * Bezpečný Webhook endpoint pro automatické nasazení kódu z GitHubu.
 */
router.post('/webhook-deploy', (req: Request, res: Response) => {
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

  // 1. Zaloguj událost
  console.log('[Webhook Deploy] Přijat požadavek na automatický redeploy...');

  // 2. Spusť skript pomocí child_process.exec s požadovaným logováním výstupu
  exec('/bin/bash /var/www/tatovacesta_dev3/deploy.sh', (err, stdout, stderr) => console.log(stdout, stderr));

  // 3. Okamžitě vrať odpověď JSON
  return res.json({
    success: true,
    message: 'Deploy skript byl spuštěn na pozadí.',
  });
});

export default router;
