import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CoParentService } from '../services/coparentService';
import { JudgmentParserService } from '../services/judgmentParserService';
import { prisma, isPrismaAvailable } from '../lib/prisma';

function getDelegate(p: any, ...names: string[]) {
  if (!p) return undefined;
  for (const n of names) {
    if (p[n]) return p[n];
  }
  const lower = names[0]?.toLowerCase();
  if (lower) {
    for (const k of Object.keys(p)) {
      if (k.toLowerCase() === lower) return p[k];
    }
  }
  return undefined;
}

export class CoParentController {
  public static async getSpace(req: AuthenticatedRequest, res: Response) {
    try {
      const p = prisma;
      if (!isPrismaAvailable() || !p) {
        return res.status(500).json({ success: false, error: "Databáze se připravuje" });
      }

      const spaceDelegate = getDelegate(p, 'coParentSpace', 'coparentSpace');
      if (!spaceDelegate) {
        return res.status(500).json({ success: false, error: "Prisma model coParentSpace není dostupný" });
      }

      let space;
      try {
        space = await spaceDelegate.findFirst({
          where: {
            OR: [
              { ownerId: req.user!.id },
              { members: { some: { userId: req.user!.id } } }
            ]
          },
          include: {
            members: { include: { user: true } },
            children: true,
            documents: true
          }
        });
      } catch (dbErr: any) {
        console.error('[CoParentController.getSpace DB query error]:', dbErr);
      }

      if (!space) {
        try {
          space = await spaceDelegate.create({
            data: {
              title: `Spolurodičovský prostor`,
              conflictMode: 'COOPERATION',
              ownerId: req.user!.id,
              members: {
                create: { userId: req.user!.id, role: 'FATHER' }
              }
            },
            include: {
              members: { include: { user: true } },
              children: true,
              documents: true
            }
          });
        } catch (createErr: any) {
          console.error('[CoParentController.getSpace create error]:', createErr);
          return res.status(500).json({ success: false, message: createErr.message || "Nepodařilo se vytvořit prostor" });
        }
      }

      res.json({ success: true, space });
    } catch (err: any) {
      console.error('[CoParentController.getSpace error]:', err);
      res.status(500).json({ success: false, message: err.message || "Chyba při inicializaci prostoru" });
    }
  }

  public static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const p = prisma;
      if (!isPrismaAvailable() || !p) {
        return res.status(500).json({ success: false, error: "Databáze se připravuje" });
      }

      const spaceDelegate = getDelegate(p, 'coParentSpace', 'coparentSpace');
      if (!spaceDelegate) {
        return res.status(500).json({ success: false, error: "Prisma model coParentSpace není dostupný" });
      }

      let space;
      try {
        space = await spaceDelegate.findFirst({
          where: {
            OR: [
              { ownerId: req.user!.id },
              { members: { some: { userId: req.user!.id } } }
            ]
          }
        });
      } catch (dbErr: any) {
        console.error('[CoParentController.getDashboard DB query error]:', dbErr);
      }

      if (!space) {
        try {
          space = await spaceDelegate.create({
            data: {
              title: `Spolurodičovský prostor`,
              conflictMode: 'COOPERATION',
              ownerId: req.user!.id,
              members: {
                create: { userId: req.user!.id, role: 'FATHER' }
              }
            }
          });
        } catch (createErr: any) {
          console.error('[CoParentController.getDashboard create error]:', createErr);
          return res.status(500).json({ success: false, message: createErr.message || "Nepodařilo se vytvořit prostor" });
        }
      }

      const dashboard = await CoParentService.getDashboard(space.id, req.user!.id);
      res.json({ success: true, ...dashboard });
    } catch (err: any) {
      console.error('[CoParentController.getDashboard error]:', err);
      res.status(500).json({ success: false, message: err.message || "Chyba při načítání dashboardu" });
    }
  }

  public static async updateConflictMode(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, conflictMode } = req.body;
      if (!spaceId || !conflictMode) {
        return res.status(400).json({ success: false, message: 'Chybí spaceId nebo conflictMode.' });
      }
      const updated = await CoParentService.updateConflictMode(spaceId, conflictMode, req.user!);
      res.json({ success: true, ...updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Chyba při aktualizaci režimu konfliktu.' });
    }
  }

  public static async createRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, type, details } = req.body;
      if (!spaceId || !type || !details) {
        return res.status(400).json({ success: false, message: 'Chybí povinná pole (spaceId, type, details).' });
      }
      const request = await CoParentService.createRequest(spaceId, req.user!.id, type, details);
      res.status(201).json({ success: true, request });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Chyba při vytváření žádosti.' });
    }
  }

  public static async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, content } = req.body;
      if (!spaceId || !content) {
        return res.status(400).json({ success: false, message: 'Chybí spaceId nebo content.' });
      }
      const message = await CoParentService.sendMessage(spaceId, req.user!.id, content);
      res.status(201).json({ success: true, message });
    } catch (err: any) {
      const status = err.message?.includes('vysokého konfliktu') ? 403 : 500;
      res.status(status).json({ success: false, message: err.message || 'Chyba při odesílání zprávy.' });
    }
  }

  public static async exportAuditData(req: AuthenticatedRequest, res: Response) {
    try {
      const spaceId = req.query.spaceId as string;
      if (!spaceId) {
        return res.status(400).json({ success: false, message: 'Chybí parameter spaceId.' });
      }
      const exportData = await CoParentService.exportAuditData(spaceId, req.user!.id);
      res.json({ success: true, ...exportData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Chyba při exportu auditních dat.' });
    }
  }

  public static async createExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, title, amount, currency, category, receiptUrl } = req.body;
      if (!spaceId || !title || amount === undefined) {
        return res.status(400).json({ success: false, message: 'Chybí povinná pole pro výdaj.' });
      }
      const expense = await CoParentService.createExpense(spaceId, req.user!.id, {
        title,
        amount,
        currency,
        category,
        receiptUrl
      });
      res.status(201).json({ success: true, expense });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Chyba při vytváření výdaje.' });
    }
  }

  public static async updateExpenseStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { expenseId, status } = req.body;
      if (!expenseId || !status) {
        return res.status(400).json({ success: false, message: 'Chybí expenseId nebo status.' });
      }
      const updated = await CoParentService.updateExpenseStatus(expenseId, req.user!.id, status);
      res.json({ success: true, ...updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Chyba při aktualizaci výdaje.' });
    }
  }

  public static async createAgreement(req: AuthenticatedRequest, res: Response) {
    try {
      const { spaceId, title, content } = req.body;
      if (!spaceId || !title || !content) {
        return res.status(400).json({ success: false, message: 'Chybí povinná pole pro dohodu.' });
      }
      const agreement = await CoParentService.createAgreement(spaceId, req.user!.id, { title, content });
      res.status(201).json({ success: true, agreement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Chyba při vytváření dohody.' });
    }
  }

  public static async createInvite(req: AuthenticatedRequest, res: Response) {
    try {
      let { spaceId, email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Chybí e-mail pro pozvání.' });
      }

      if (!spaceId) {
        const p = prisma;
        if (!isPrismaAvailable() || !p) {
          return res.status(500).json({ success: false, message: "Databáze není dostupná." });
        }
        const spaceDelegate = getDelegate(p, 'coParentSpace', 'coparentSpace');
        if (!spaceDelegate) {
          return res.status(500).json({ success: false, message: "Model coParentSpace není dostupný" });
        }

        let space;
        try {
          space = await spaceDelegate.findFirst({
            where: {
              members: { some: { userId: req.user!.id } }
            }
          });
        } catch (dbErr: any) {
          console.error('[CoParentController.createInvite findFirst error]:', dbErr);
        }

        if (!space) {
          try {
            space = await spaceDelegate.create({
              data: {
                title: `Spolurodičovský prostor`,
                conflictMode: 'COOPERATION',
                ownerId: req.user!.id,
                members: {
                  create: { userId: req.user!.id, role: 'FATHER' }
                }
              }
            });
          } catch (createErr: any) {
            console.error('[CoParentController.createInvite create space error]:', createErr);
            return res.status(500).json({ success: false, message: createErr.message || 'Chyba při vytváření prostoru.' });
          }
        }
        spaceId = space.id;
      }

      const invite = await CoParentService.createInvite(spaceId, req.user!.id, email);
      res.status(201).json({ success: true, code: invite.code, invite });
    } catch (err: any) {
      console.error('[CoParentController.createInvite error]:', err);
      res.status(500).json({ success: false, message: err.message || 'Chyba při vytváření pozvánky.' });
    }
  }

  public static async acceptInvite(req: AuthenticatedRequest, res: Response) {
    try {
      const { code, role } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Chybí kód pozvánky.' });
      }
      const result = await CoParentService.acceptInvite(code, req.user!, role);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Chyba při přijímání pozvánky.' });
    }
  }

  public static async getMembers(req: AuthenticatedRequest, res: Response) {
    try {
      const spaceId = req.query.spaceId as string;
      if (!spaceId) {
        return res.status(400).json({ success: false, message: 'Chybí parameter spaceId.' });
      }
      const members = await CoParentService.getMembers(spaceId);
      res.json({ success: true, members });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Chyba při načítání členů.' });
    }
  }

  public static async parseJudgment(req: AuthenticatedRequest, res: Response) {
    try {
      const { text } = req.body;
      const file = req.file;

      if (!text && !file) {
        return res.status(400).json({
          success: false,
          code: 'EMPTY_INPUT',
          error: "Musíte nahrát soubor rozsudku nebo vložit text.",
          message: "Musíte nahrát soubor rozsudku nebo vložit text."
        });
      }

      const extracted = await JudgmentParserService.parseJudgmentFile(file, text);
      res.json({ success: true, ...extracted });
    } catch (err: any) {
      console.error('[CoParentController.parseJudgment error]:', err?.message || err);
      const statusCode = err?.statusCode || 400;
      const userMessage = err?.userMessage || err?.message || "Chyba při zpracování rozsudku.";
      const code = err?.code || 'INTERNAL_ERROR';
      res.status(statusCode).json({
        success: false,
        code,
        error: userMessage,
        message: userMessage
      });
    }
  }

  public static async applyJudgmentSetup(req: AuthenticatedRequest, res: Response) {
    try {
      let { spaceId, extractedData } = req.body;
      if (!extractedData) {
        return res.status(400).json({ success: false, message: 'Chybí extractedData.' });
      }

      if (!spaceId) {
        const p = prisma;
        if (!isPrismaAvailable() || !p) {
          return res.status(500).json({ success: false, message: "Databáze není dostupná." });
        }
        const spaceDelegate = getDelegate(p, 'coParentSpace', 'coparentSpace');
        if (!spaceDelegate) {
          return res.status(500).json({ success: false, message: "Model coParentSpace není dostupný" });
        }

        let space;
        try {
          space = await spaceDelegate.findFirst({
            where: {
              members: { some: { userId: req.user!.id } }
            }
          });
        } catch (dbErr: any) {
          console.error('[CoParentController.applyJudgmentSetup findFirst error]:', dbErr);
        }

        if (!space) {
          try {
            space = await spaceDelegate.create({
              data: {
                title: `Spolurodičovský prostor`,
                conflictMode: 'COOPERATION',
                ownerId: req.user!.id,
                members: {
                  create: { userId: req.user!.id, role: 'FATHER' }
                }
              }
            });
          } catch (createErr: any) {
            console.error('[CoParentController.applyJudgmentSetup create space error]:', createErr);
            return res.status(500).json({ success: false, message: createErr.message || 'Chyba při vytváření prostoru.' });
          }
        }
        spaceId = space.id;
      }

      const result = await CoParentService.applyJudgmentSetup(spaceId, req.user!.id, extractedData);
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('[CoParentController.applyJudgmentSetup error]:', err);
      res.status(500).json({ success: false, message: err.message || 'Chyba při aplikaci rozsudku do CoParent Hubu.' });
    }
  }
}
