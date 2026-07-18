import { Request, Response } from 'express';
import { Trip } from '../models';

// ─── GET /api/trips ──────────────────────────────────────────────────────────
/**
 * Return all trips belonging to the authenticated user.
 * Supports optional query params: status, page, limit.
 */
export const getMyTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const { status, page = '1', limit = '10' } = req.query;

    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [trips, total] = await Promise.all([
      Trip.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Trip.countDocuments(filter),
    ]);

    res.json({
      data: trips,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trips', error });
  }
};

// ─── GET /api/trips/public ─────────────────────────────────────────────────────
/**
 * Return latest public trips (no authentication required).
 */
export const getPublicTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '3' } = req.query;
    const limitNum = Math.min(10, Math.max(1, parseInt(limit as string, 10)));

    const trips = await Trip.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .select('title destination durationDays travelers coverImage rating createdAt');

    res.json({ data: trips });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public trips', error });
  }
};

// ─── POST /api/trips ─────────────────────────────────────────────────────────
/**
 * Create a new trip for the authenticated user.
 */
export const addTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;

    const trip = await Trip.create({ ...req.body, userId });
    console.log(trip)
    res.status(201).json({ message: 'Trip created successfully', data: trip });
  } catch (error) {

    console.log("CREATE TRIP ERROR:", error);

    res.status(400).json({
      message: 'Failed to create trip',
      error
    });
  }
};

// ─── GET /api/trips/:id ──────────────────────────────────────────────────────
/**
 * Fetch a single trip by its ID (must belong to the authenticated user).
 */
export const getTripById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const trip = await Trip.findOne({ _id: req.params.id, userId });

    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    res.json({ data: trip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trip', error });
  }
};

// ─── PUT /api/trips/:id ──────────────────────────────────────────────────────
/**
 * Update a trip (partial or full). Only the owner can update.
 */
export const updateTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    res.json({ message: 'Trip updated successfully', data: trip });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update trip', error });
  }
};

// ─── DELETE /api/trips/:id ───────────────────────────────────────────────────
/**
 * Permanently delete a trip. Only the owner can delete.
 */
export const deleteTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;

    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId });

    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete trip', error });
  }
};
