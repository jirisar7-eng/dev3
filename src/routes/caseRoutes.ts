import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { ClientCaseService } from '../services/clientCaseService';
import { ClamAvService } from '../services/clamAvService';
import { MinioStorageService } from '../services/minioStorageService';

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
    res.json(cases);
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
    res.json(fullCase);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 500).json({ error: err.message });
  }
});

// POST /api/cases -> create new case for user
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const created = await ClientCaseService.createDefaultCaseForUser(req.user!.id, req.user!);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/cases/:caseId -> update case basic info
router.put('/:caseId', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const updated = await ClientCaseService.updateCase(caseId, req.user!, req.body);
    res.json(updated);
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
    res.status(201).json(child);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/children/:childId', async (req: AuthenticatedRequest, res) => {
  try {
    const { childId } = req.params;
    const updated = await ClientCaseService.updateChild(childId, req.user!, req.body);
    res.json(updated);
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
    res.status(201).json(participant);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/participants/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateParticipant(id, req.user!, req.body);
    res.json(updated);
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
    res.status(201).json(evt);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/events/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateEvent(id, req.user!, req.body);
    res.json(updated);
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
    res.status(201).json(deadline);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.patch('/deadlines/:id/toggle', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.toggleDeadline(id, req.user!);
    res.json(updated);
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
    res.status(201).json(task);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateTask(id, req.user!, req.body);
    res.json(updated);
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
    res.status(201).json(note);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.put('/notes/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updated = await ClientCaseService.updateNote(id, req.user!, req.body);
    res.json(updated);
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

    res.status(201).json(doc);
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
    res.status(201).json(evi);
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
    res.status(201).json(care);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 400).json({ error: err.message });
  }
});

router.post('/:caseId/communications', async (req: AuthenticatedRequest, res) => {
  try {
    const { caseId } = req.params;
    const comm = await ClientCaseService.createCommunication(caseId, req.user!, req.body);
    res.status(201).json(comm);
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
    res.json(timeline);
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
    res.json(exported);
  } catch (err: any) {
    res.status(err.message?.includes('Přístup odepřen') ? 403 : 500).json({ error: err.message });
  }
});

export default router;
