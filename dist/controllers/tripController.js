import { ObjectId } from 'mongodb';
import { getTripsCollection } from '../config/collections.js';
// ─── GET /api/trips ──────────────────────────────────────────────────────────
/**
 * Return all trips belonging to the authenticated user.
 * Supports optional query params: status, page, limit.
 */
export const getMyTrips = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, page = '1', limit = '10' } = req.query;
        const filter = { userId };
        if (status)
            filter.status = status;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const collection = getTripsCollection();
        const [trips, total] = await Promise.all([
            collection
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .toArray(),
            collection.countDocuments(filter),
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
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch trips', error });
    }
};
// ─── GET /api/trips/public ─────────────────────────────────────────────────────
/**
 * Return latest public trips (no authentication required).
 */
export const getPublicTrips = async (req, res) => {
    try {
        const { limit = '3' } = req.query;
        const limitNum = Math.min(10, Math.max(1, parseInt(limit, 10)));
        const collection = getTripsCollection();
        const trips = await collection
            .find({ isPublic: true })
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .project({
            title: 1,
            destination: 1,
            durationDays: 1,
            travelers: 1,
            coverImage: 1,
            rating: 1,
            createdAt: 1,
        })
            .toArray();
        res.json({ data: trips });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch public trips', error });
    }
};
// ─── POST /api/trips ─────────────────────────────────────────────────────────
/**
 * Create a new trip for the authenticated user.
 */
export const addTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const { _id, ...tripDataWithoutId } = req.body;
        const tripData = {
            ...tripDataWithoutId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const collection = getTripsCollection();
        const result = await collection.insertOne(tripData);
        const trip = { ...tripData, _id: result.insertedId.toString() };
        console.log(trip);
        res.status(201).json({ message: 'Trip created successfully', data: trip });
    }
    catch (error) {
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
export const getTripById = async (req, res) => {
    try {
        const userId = req.userId;
        const collection = getTripsCollection();
        const trip = await collection.findOne({
            _id: new ObjectId(req.params.id),
            userId,
        });
        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }
        res.json({ data: trip });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch trip', error });
    }
};
// ─── PUT /api/trips/:id ──────────────────────────────────────────────────────
/**
 * Update a trip (partial or full). Only the owner can update.
 */
export const updateTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const collection = getTripsCollection();
        const updateData = {
            ...req.body,
            updatedAt: new Date(),
        };
        const trip = await collection.findOneAndUpdate({ _id: new ObjectId(req.params.id), userId }, { $set: updateData }, { returnDocument: 'after' });
        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }
        res.json({ message: 'Trip updated successfully', data: trip });
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to update trip', error });
    }
};
// ─── DELETE /api/trips/:id ───────────────────────────────────────────────────
/**
 * Permanently delete a trip. Only the owner can delete.
 */
export const deleteTrip = async (req, res) => {
    try {
        const userId = req.userId;
        const collection = getTripsCollection();
        const trip = await collection.findOneAndDelete({
            _id: new ObjectId(req.params.id),
            userId,
        });
        if (!trip) {
            res.status(404).json({ message: 'Trip not found' });
            return;
        }
        res.json({ message: 'Trip deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete trip', error });
    }
};
