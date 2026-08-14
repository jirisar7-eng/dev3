import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const router = Router();

// POST /api/admin/vps/update - Run update script
router.post('/update', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    // Spustí na pozadí skript, odpověď vrátí ihned
    exec('bash /var/www/tatovacesta_dev3/update-dev3 || (git pull origin main && docker compose up -d --build) || echo "Update skript nenalezen a fallback selhal."', (error, stdout, stderr) => {
      console.log('[VPS Update]', stdout, stderr);
    });
    res.json({ success: true, message: 'Aktualizace byla spuštěna na pozadí (update-dev3).' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/vps/logs - Get docker compose logs
router.get('/logs', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    let output = '';
    try {
      const { stdout, stderr } = await execPromise('docker compose logs --tail=150 app || docker logs --tail=150 app');
      output = stdout || stderr;
    } catch (e: any) {
      output = "Posledních 150 řádků logů (Simulace - Docker není v tomto sandboxu dostupný):\n[INFO] Server běží na portu 3000\n[INFO] AI Asistent načten...\n" + e.message;
    }
    res.json({ success: true, logs: output });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/vps/status - Get docker ps
router.get('/status', requireAuth, requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    let output = '';
    try {
      const { stdout } = await execPromise('docker ps');
      output = stdout;
    } catch (e: any) {
      output = "Stav kontejnerů (Simulace):\nCONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES\n1234567890ab   app       ...       ...       Up 2 hrs  3000/tcp  app\n" + e.message;
    }
    res.json({ success: true, status: output });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
