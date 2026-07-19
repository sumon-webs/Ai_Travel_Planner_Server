import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { generateTrip } from '../controllers/aiController.js';

const router = Router();

// Protect AI generation endpoint using requireAuth middleware
router.post('/generate-trip', requireAuth, generateTrip);

export default router;
