import { Router } from 'express';
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  contactsWithBirthdayToday,
} from '../controllers/contactController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(listContacts));
router.get('/birthdays/today', asyncHandler(contactsWithBirthdayToday));
router.get('/:id', asyncHandler(getContact));
router.post('/', asyncHandler(createContact));
router.put('/:id', asyncHandler(updateContact));
router.delete('/:id', asyncHandler(deleteContact));

export default router;
