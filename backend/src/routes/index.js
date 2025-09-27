import { Router } from 'express';
import authRoutes from './auth.routes.js';
import contactRoutes from './contact.routes.js';
import kanbanRoutes from './kanban.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/kanban', kanbanRoutes);

export default router;
