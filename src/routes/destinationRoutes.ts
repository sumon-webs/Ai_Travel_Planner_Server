import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import {
  addDestination,
  getDestinations,
  getDestinationById,
  getMyDestinations,
  deleteDestination,
  getDestinationStats,
  getTrendingDestinations,
} from '../controllers/destinationController.js';

const router = Router();

/** GET /api/destinations       — All destinations (public) */
router.get('/', getDestinations);

/** GET /api/destinations/stats     — Travel statistics (public) */
router.get('/stats', getDestinationStats);

/** GET /api/destinations/trending  — Trending destinations (public) */
router.get('/trending', getTrendingDestinations);

/** GET /api/destinations/my    — Current user's destinations (auth) */
router.get('/my', requireAuth, getMyDestinations);

/** GET /api/destinations/:id   — Single destination (public) */
router.get('/:id', getDestinationById);

/** POST /api/destinations      — Create destination (auth) */
router.post('/', requireAuth, addDestination);

/** DELETE /api/destinations/:id — Delete destination (auth, owner) */
router.delete('/:id', requireAuth, deleteDestination);

export default router;
