import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CoParentService } from '../services/coparentService';

export class CoParentController {
  public static async getSpace(req: AuthenticatedRequest, res: Response) {
    try {
      const space = await CoParentService.getOrCreateSpace(req.user!);
      res.json(space);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při načítání CoParent prostoru.' });
    }
  }

  public static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const space = await CoParentService.getOrCreateSpace(req.user!);
      const dashboard = await CoParentService.getDashboard(space.id, req.user!.id);
      res.json(dashboard);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při načítání CoParent dashboardu.' });
    }
  }

  public static async updateConflictMode(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, conflictMode } = req.body;
      if (!spaceId || !conflictMode) {
        return res.status(400).json({ error: 'Chybí spaceId nebo conflictMode.' });
      }
      const updated = await CoParentService.updateConflictMode(spaceId, conflictMode, req.user!);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při aktualizaci režimu konfliktu.' });
    }
  }

  public static async createRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, type, details } = req.body;
      if (!spaceId || !type || !details) {
        return res.status(400).json({ error: 'Chybí povinná pole (spaceId, type, details).' });
      }
      const request = await CoParentService.createRequest(spaceId, req.user!.id, type, details);
      res.status(201).json(request);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při vytváření žádosti.' });
    }
  }

  public static async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, content } = req.body;
      if (!spaceId || !content) {
        return res.status(400).json({ error: 'Chybí spaceId nebo content.' });
      }
      const message = await CoParentService.sendMessage(spaceId, req.user!.id, content);
      res.status(201).json(message);
    } catch (err: any) {
      const status = err.message?.includes('vysokého konfliktu') ? 403 : 500;
      res.status(status).json({ error: err.message || 'Chyba při odesílání zprávy.' });
    }
  }

  public static async exportAuditData(req: AuthenticatedRequest, res: Response) {
    try {
      const spaceId = req.query.spaceId as string;
      if (!spaceId) {
        return res.status(400).json({ error: 'Chybí parameter spaceId.' });
      }
      const exportData = await CoParentService.exportAuditData(spaceId, req.user!.id);
      res.json(exportData);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při exportu auditních dat.' });
    }
  }

  public static async createExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, title, amount, currency, category, receiptUrl } = req.body;
      if (!spaceId || !title || amount === undefined) {
        return res.status(400).json({ error: 'Chybí povinná pole pro výdaj.' });
      }
      const expense = await CoParentService.createExpense(spaceId, req.user!.id, {
        title,
        amount,
        currency,
        category,
        receiptUrl
      });
      res.status(201).json(expense);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při vytváření výdaje.' });
    }
  }

  public static async updateExpenseStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { expenseId, status } = req.body;
      if (!expenseId || !status) {
        return res.status(400).json({ error: 'Chybí expenseId nebo status.' });
      }
      const updated = await CoParentService.updateExpenseStatus(expenseId, req.user!.id, status);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při aktualizaci výdaje.' });
    }
  }

  public static async createAgreement(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, title, content } = req.body;
      if (!spaceId || !title || !content) {
        return res.status(400).json({ error: 'Chybí povinná pole pro dohodu.' });
      }
      const agreement = await CoParentService.createAgreement(spaceId, req.user!.id, { title, content });
      res.status(201).json(agreement);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Chyba při vytváření dohody.' });
    }
  }
}
