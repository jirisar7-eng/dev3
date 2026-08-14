import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { CoParentController } from '../controllers/coparentController';

const router = Router();

// Apply authentication to all CoParent routes
router.use(requireAuth as any);

router.get('/space', CoParentController.getSpace);
router.get('/dashboard', CoParentController.getDashboard);
router.put('/conflict-mode', CoParentController.updateConflictMode);
router.post('/requests', CoParentController.createRequest);
router.post('/messages', CoParentController.sendMessage);
router.get('/export', CoParentController.exportAuditData);
router.post('/expenses', CoParentController.createExpense);
router.put('/expenses/status', CoParentController.updateExpenseStatus);
router.post('/agreements', CoParentController.createAgreement);

export default router;
