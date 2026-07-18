import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import {
  getMyTrips,
  getPublicTrips,
  addTrip,
  getTripById,
  updateTrip,
  deleteTrip,
} from '../controllers/tripController';

const router = Router();

// Public endpoint for latest public trips
router.get('/public', getPublicTrips);

// All trip routes require an authenticated session
router.use(requireAuth);

/**
 * GET  /api/trips        — list all trips for the authenticated user (filterable, paginated)
 * POST /api/trips        — create a new trip
 */
router.get('/', getMyTrips);
router.post('/', addTrip);

/**
 * GET    /api/trips/:id  — fetch a single trip by ID
 * PUT    /api/trips/:id  — update a trip (partial or full)
 * DELETE /api/trips/:id  — permanently delete a trip
 */
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);

export default router;
