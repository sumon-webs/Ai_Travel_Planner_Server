import { Router } from 'express';
import {
  getMyTrips,
  getPublicTrips,
  addTrip,
  getTripById,
  updateTrip,
  deleteTrip,
} from '../controllers/tripController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Public endpoint for latest public trips
router.get('/public', getPublicTrips);

/**
 * GET  /api/trips        — list all trips (protected)
 * POST /api/trips        — create a new trip (protected)
 */
router.get('/', requireAuth, getMyTrips);
router.post('/', requireAuth, addTrip);

/**
 * GET    /api/trips/:id  — fetch a single trip by ID (public)
 * PUT    /api/trips/:id  — update a trip (protected)
 * DELETE /api/trips/:id  — permanently delete a trip (protected)
 */
router.get('/:id', getTripById);
router.put('/:id', requireAuth, updateTrip);
router.delete('/:id', requireAuth, deleteTrip);

export default router;
