import { Router } from 'express';
import { createFeedback, getAllFeedback, deleteFeedback, } from '../controllers/feedbackController.js';
const router = Router();
/**
 * Public endpoints (no authentication required)
 * POST /api/feedback        — create new feedback
 * GET  /api/feedback        — get all feedback
 */
router.post('/', createFeedback);
router.get('/', getAllFeedback);
/**
 * Admin endpoint (authentication can be added later with middleware)
 * DELETE /api/feedback/:id  — delete feedback
 */
router.delete('/:id', deleteFeedback);
export default router;
