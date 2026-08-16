import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { ClientCaseService } from '../services/clientCaseService';
import { ClamAvService } from '../services/clamAvService';
import { MinioStorageService } from '../services/minioStorageService';

import { CarePlanService } from '../services/care/carePlanService';
import { AgeEngine } from '../services/care/ageEngine';
import { GeoRoutingService } from '../services/care/geoRoutingService';
import { AuditService } from '../services/auditService';

const router = Router();

// Apply requireAuth to all /api/cases routes
router.use(requireAuth as any);

// ----------------------------------------------------
// CASES MAIN CRUD
// ----------------------------------------------------

// GET /api/cases -> list user's cases (or default active case)
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const targetUserId = (req.query.userId as string) || req.user!.id;
    const cases = await ClientCaseService.getCasesForUser(targetUserId, req.user!);
    res.json({ success: true, data: cases });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 500).json({ error: err.message });
  }
});

// GET /api/cases/:caseId -> full details of single case
router.get('/:caseId', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const fullCase = await ClientCaseService.getCaseById(caseId, req.user!);
    if (!fullCase) {
      return res.status(404).json({ error: 'Případ nebyl nalezen.' });
    }
    res.json({ success: true, data: fullCase });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 500).json({ error: err.message });
  }
});

// POST /api/cases -> create new case for user
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const created = await ClientCaseService.createDefaultCaseForUser(req.user!.id, req.user!);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/cases/:caseId -> update case basic info
router.put('/:caseId', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const updated = await ClientCaseService.updateCase(caseId, req.user!, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CHILDREN
// ----------------------------------------------------
router.post('/:caseId/children', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const child = await ClientCaseService.createChild(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: child });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/children/:childId', async (req: AuthenticatedRequest, res) => {
  try {
    const { childId } = req.params;
    const updated = await ClientCaseService.updateChild(childId, req.user!, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.delete('/children/:childId', async (req: AuthenticatedRequest, res) => {
  try {
    const { childId } = req.params;
    await ClientCaseService.deleteChild(childId, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// PARTICIPANTS
// ----------------------------------------------------
router.post('/:caseId/participants', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const participant = await ClientCaseService.createParticipant(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: participant });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/participants/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateParticipant(id, req.user!, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.delete('/participants/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await ClientCaseService.deleteParticipant(id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// EVENTS
// ----------------------------------------------------
router.post('/:caseId/events', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const evt = await ClientCaseService.createEvent(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: evt });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/events/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateEvent(id, req.user!, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.delete('/events/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await ClientCaseService.deleteEvent(id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DEADLINES
// ----------------------------------------------------
router.post('/:caseId/deadlines', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const deadline = await ClientCaseService.createDeadline(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: deadline });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.patch('/deadlines/:id/toggle', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.toggleDeadline(id, req.user!);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.delete('/deadlines/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await ClientCaseService.deleteDeadline(id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// TASKS
// ----------------------------------------------------
router.post('/:caseId/tasks', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const task = await ClientCaseService.createTask(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateTask(id, req.user!, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.delete('/tasks/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await ClientCaseService.deleteTask(id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// NOTES
// ----------------------------------------------------
router.post('/:caseId/notes', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const note = await ClientCaseService.createNote(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: note });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/notes/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateNote(id, req.user!, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.delete('/notes/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await ClientCaseService.deleteNote(id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// DOCUMENTS & UPLOAD (with ClamAV + MinIO / S3)
// ----------------------------------------------------
router.post('/:caseId/documents', async (req: AuthenticatedRequest, res) => {
  let uploadedKey: string | null = null;
  let uploadedBucket: string | null = null;

  try {
    const { caseId } = req.params;
    const { fileName, fileData, category, notes, mimeType } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'Chybí název souboru.' });
    }

    let fileUrl = `/documents/${fileName.toLowerCase().replace(/\s+/g, '_')}`;
    let s3Bucket = 'tatovacesta-vault';
    let s3ObjectKey = `cases/${caseId}/${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    let size = 150000;
    let fileHash = `sha256:${Date.now().toString(16)}`;

    // If base64 content was uploaded, scan with ClamAV and upload to MinIO/S3
    if (fileData) {
      const base64Clean = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      const buffer = Buffer.from(base64Clean, 'base64');
      size = buffer.length;

      // 1. Antivirus check
      try {
        await ClamAvService.scanBuffer(buffer);
      } catch (scanErr: any) {
        return res.status(400).json({
          error: `Antivirová kontrola (ClamAV) zamítla soubor: ${scanErr.message}`,
          scanStatus: 'REJECTED',
        });
      }

      // 2. Upload to MinIO/S3
      try {
        const uploadResult = await MinioStorageService.uploadPdf(buffer, fileName);
        fileUrl = uploadResult.pdfUrl;
        s3Bucket = uploadResult.bucket;
        s3ObjectKey = uploadResult.objectKey;
        fileHash = uploadResult.fileHash;
        uploadedKey = s3ObjectKey;
        uploadedBucket = s3Bucket;
      } catch (storageErr) {
        console.warn('[CaseDocuments] MinIO upload failed, using storage fallback:', storageErr);
      }
    }

    const doc = await ClientCaseService.createDocument(caseId, req.user!, {
      name: fileName,
      category: category || 'COURT',
      fileUrl,
      s3Bucket,
      s3ObjectKey,
      fileType: fileName.split('.').pop() || 'pdf',
      mimeType: mimeType || 'application/pdf',
      size,
      fileHash,
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err: any) {
    if (uploadedBucket && uploadedKey) {
      await MinioStorageService.deleteObject(uploadedBucket, uploadedKey).catch(() => {});
    }
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 500).json({ error: err.message });
  }
});

router.delete('/documents/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await ClientCaseService.deleteDocument(id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// EVIDENCE
// ----------------------------------------------------
router.post('/:caseId/evidence', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const evi = await ClientCaseService.createEvidence(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: evi });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.delete('/evidence/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    await ClientCaseService.deleteEvidence(id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CARE ARRANGEMENTS & COMMUNICATIONS
// ----------------------------------------------------
router.post('/:caseId/care-arrangements', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const care = await ClientCaseService.createCareArrangement(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: care });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.post('/:caseId/communications', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const comm = await ClientCaseService.createCommunication(caseId, req.user!, req.body);
    res.status(201).json({ success: true, data: comm });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// TIMELINE & EXPORT
// ----------------------------------------------------
router.get('/:caseId/timeline', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const timeline = await ClientCaseService.getTimeline(caseId, req.user!);
    res.json({ success: true, data: timeline });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 500).json({ error: err.message });
  }
});

router.get('/:caseId/export', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const exported = await ClientCaseService.generateCaseExport(caseId, req.user!);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="spis_${caseId}_export.json"`);
    res.json({ success: true, data: exported });
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CARE & PARENTING HUB ENDPOINTS
// ----------------------------------------------------

function handleCareError(res: any, err: any) {
  const msg = err?.message || String(err);
  if (
    msg.includes('DATABASE_UNAVAILABLE') ||
    msg.includes('Databáz') ||
    msg.includes('database') ||
    msg.includes('Database') ||
    msg.includes('dostupná')
  ) {
    return res.status(503).json({ error: 'Databázový server je momentálně nedostupný. Zkuste to prosím znovu.' });
  }
  if (msg.includes('Přístup odepřen')) {
    return res.status(403).json({ error: msg });
  }
  if (msg.includes('nebyl nalezen') || msg.includes('nebylo nalezeno')) {
    return res.status(404).json({ error: msg });
  }
  return res.status(400).json({ error: msg });
}

// GET /api/cases/:caseId/care -> Care Hub summary
router.get('/:caseId/care', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const clientCase = await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const plans = await CarePlanService.getPlansForCase(caseId, req.user!);

    // Calculate age details for all children in this case
    const childrenAges = (clientCase.children || []).map(child => ({
      childId: child.id,
      name: `${child.firstName} ${child.lastName}`.trim(),
      dateOfBirth: child.dateOfBirth,
      age: AgeEngine.calculateAge(child.dateOfBirth),
    }));

    const activePlan = plans.find(p => p.status === 'ACTIVE') || plans[0] || null;

    res.json({
      success: true,
      data: {
        caseId,
        caseTitle: clientCase.title,
        currentCareType: clientCase.currentCareType,
        childrenAges,
        participants: clientCase.participants || [],
        plansCount: plans.length,
        activePlan,
        plans,
      },
    });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// GET /api/cases/:caseId/care/plans -> list care plans
router.get('/:caseId/care/plans', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const plans = await CarePlanService.getPlansForCase(caseId, req.user!);
    res.json({ success: true, data: plans });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// POST /api/cases/:caseId/care/plans -> create plan
router.post('/:caseId/care/plans', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const created = await CarePlanService.createPlan(caseId, req.body, req.user!);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// GET /api/cases/:caseId/care/plans/:id -> get plan detail with days & metrics
router.get('/:caseId/care/plans/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, id } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const plan = await CarePlanService.getPlanById(id, caseId);
    if (!plan) {
      return res.status(404).json({ error: 'Plán péče nebyl nalezen.' });
    }
    res.json({ success: true, data: plan });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// PATCH /api/cases/:caseId/care/plans/:id -> update plan or day overrides
router.patch('/:caseId/care/plans/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, id } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const updated = await CarePlanService.updatePlan(id, caseId, req.body, req.user!);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// DELETE /api/cases/:caseId/care/plans/:id -> delete plan
router.delete('/:caseId/care/plans/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, id } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    await CarePlanService.deletePlan(id, caseId, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// POST /api/cases/:caseId/care/simulate -> generate simulation on the fly
router.post('/:caseId/care/simulate', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const simulationResult = CarePlanService.simulate(req.body);
    res.json({ success: true, data: simulationResult });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// POST /api/cases/:caseId/care/compare -> multi-variant comparison + optional DB save
router.post('/:caseId/care/compare', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const patterns = req.body.patterns || ['7/7', '2-2-3', '3-4-4-3'];
    const comparisonVariants = CarePlanService.compareVariants(patterns, req.body);

    let savedComparison = null;
    if (req.body.save) {
      savedComparison = await CarePlanService.saveSimulationComparison(
        caseId,
        req.body.title || 'Srovnání modelů péče',
        comparisonVariants,
        req.body.notes,
        req.user!
      );
    }

    res.json({
      success: true,
      data: comparisonVariants,
      savedComparison,
    });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// GET /api/cases/:caseId/care/comparisons -> list saved comparisons
router.get('/:caseId/care/comparisons', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const comparisons = await CarePlanService.getSimulationComparisons(caseId);
    res.json({ success: true, data: comparisons });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// DELETE /api/cases/:caseId/care/comparisons/:id -> delete saved comparison
router.delete('/:caseId/care/comparisons/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, id } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    await CarePlanService.deleteSimulationComparison(id, caseId, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// POST /api/cases/:caseId/care/sync -> sync approved plan to case calendar
router.post('/:caseId/care/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Je vyžadováno ID plánu péče (planId).' });
    }
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const syncResult = await CarePlanService.syncPlanToCaseCalendar(planId, caseId, req.user!);
    res.json({ success: true, data: syncResult });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// POST /api/cases/:caseId/care/plans/:id/sync -> alias for sync directly by plan ID
router.post('/:caseId/care/plans/:id/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId, id } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const syncResult = await CarePlanService.syncPlanToCaseCalendar(id, caseId, req.user!);
    res.json({ success: true, data: syncResult });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// POST /api/cases/:caseId/care/geocode -> validate and geocode address
router.post('/:caseId/care/geocode', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const { address } = req.body;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const geo = await GeoRoutingService.geocodeAddress(address);
    res.json({ success: true, data: geo });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// POST /api/cases/:caseId/care/route -> calculate route distance and travel time
router.post('/:caseId/care/route', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const { origin, destination } = req.body;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const route = await GeoRoutingService.calculateRoute(origin, destination);
    res.json({ success: true, data: route });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

// GET /api/cases/:caseId/care/history -> get care audit logs for this case
router.get('/:caseId/care/history', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    await ClientCaseService.authorizeCaseAccess(caseId, req.user!);
    const logs = await AuditService.getLogs('CARE_PLAN');
    const caseLogs = logs.filter(l => !l.details || l.details.includes(caseId) || l.details.includes('plán') || l.details.includes('péč') || l.userEmail === req.user!.email);
    res.json({ success: true, data: caseLogs });
  } catch (err: any) {
    handleCareError(res, err);
  }
});

export default router;
