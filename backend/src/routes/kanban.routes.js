import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireRole } from '../middleware/rbac.js';
import { listStages, upsertStages, listLeads, moveLead, listEvents, addNote, addFollowup } from '../controllers/kanbanController.js';

const router = Router();
router.use(authenticate);

router.get('/stages', asyncHandler(listStages));
router.post('/stages', requireRole('admin','manager'), asyncHandler(upsertStages));
router.get('/leads', asyncHandler(listLeads));
router.patch('/leads/:id/move', asyncHandler(moveLead));
router.get('/leads/:id/events', asyncHandler(listEvents));
router.post('/leads/:id/notes', asyncHandler(addNote));
router.post('/leads/:id/followup', asyncHandler(addFollowup));

export default router;
