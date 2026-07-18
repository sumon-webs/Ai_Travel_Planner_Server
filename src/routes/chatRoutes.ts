import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import {
  getChatHistory,
  sendMessage,
  clearChatHistory,
} from '../controllers/chatController';

const router = Router();

// Ensure all chat assistant endpoints are authenticated
router.use(requireAuth);

/**
 * GET    /api/chats/:tripId         — get chat conversation history
 * POST   /api/chats/:tripId/message — send a message to the assistant (streaming response)
 * DELETE /api/chats/:tripId         — clear conversation history
 */
router.get('/:tripId', getChatHistory);
router.post('/:tripId/message', sendMessage);
router.delete('/:tripId', clearChatHistory);

export default router;
