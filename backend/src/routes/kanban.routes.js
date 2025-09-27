import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listStages, upsertStages, listLeads, moveLead } from '../controllers/kanbanController.js';

const router = Router();
router.use(authenticate);

router.get('/stages', asyncHandler(listStages));
router.post('/stages', asyncHandler(upsertStages));
router.get('/leads', asyncHandler(listLeads));
router.patch('/leads/:id/move', asyncHandler(moveLead));

export default router;
