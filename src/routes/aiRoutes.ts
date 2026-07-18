import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { generateTrip } from '../controllers/aiController';

const router = Router();

// Protect AI generation endpoint using requireAuth middleware
router.post('/generate-trip', requireAuth, generateTrip);

export default router;
