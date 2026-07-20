import { Router } from 'express';
import {
  getChatHistory,
  sendMessage,
  clearChatHistory,
} from '../controllers/chatController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/**
 * GET    /api/chats/:tripId         — get chat conversation history (protected)
 * POST   /api/chats/:tripId/message — send a message to the assistant (protected)
 * DELETE /api/chats/:tripId         — clear conversation history (protected)
 */
router.get('/:tripId', requireAuth, getChatHistory);
router.post('/:tripId/message', requireAuth, sendMessage);
router.delete('/:tripId', requireAuth, clearChatHistory);

export default router;
