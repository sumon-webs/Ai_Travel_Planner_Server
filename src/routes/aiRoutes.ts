import { Router } from 'express';
import { generateTrip } from '../controllers/aiController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// AI generation endpoint (protected)
router.post('/generate-trip', requireAuth, generateTrip);

export default router;
