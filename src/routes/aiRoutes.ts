import { Router } from 'express';
import { generateTrip } from '../controllers/aiController.js';

const router = Router();

// AI generation endpoint (no authentication required)
router.post('/generate-trip', generateTrip);

export default router;
