import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDestinationsCollection, getTripsCollection, getProfilesCollection } from '../config/collections.js';

/**
 * Create a new destination. (Auth required)
 */
export const addDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized — userId missing' });
      return;
    }

    const {
      name, country, city, shortDescription, description,
      price, durationDays, category, bestSeason, rating, coverImage, galleryImages,
    } = req.body;

    if (!name || !country || !city || !shortDescription || !description ||
        price === undefined || durationDays === undefined || !category ||
        !bestSeason || rating === undefined || !coverImage) {
      res.status(400).json({ message: 'All required fields must be provided.' });
      return;
    }

    const destinationData = {
      name, country, city, shortDescription, description,
      price: Number(price), durationDays: Number(durationDays),
      category, bestSeason, rating: Number(rating),
      coverImage, galleryImages: galleryImages || [], userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = getDestinationsCollection();
    const result = await collection.insertOne(destinationData);
    
    const destination = { ...destinationData, _id: result.insertedId.toString() };
    res.status(201).json({ message: 'Destination created successfully', data: destination });
  } catch (error) {
    console.error('Create destination error:', error);
    res.status(500).json({ message: 'Failed to create destination', error: error instanceof Error ? error.message : error });
  }
};

/**
 * Fetch ALL destinations. (Public)
 */
export const getDestinations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const collection = getDestinationsCollection();
    const destinations = await collection.find().sort({ createdAt: -1 }).toArray();
    res.json({ data: destinations });
  } catch (error) {
    console.error('Fetch destinations error:', error);
    res.status(500).json({ message: 'Failed to fetch destinations', error: error instanceof Error ? error.message : error });
  }
};

/**
 * Fetch a single destination by ID. (Public)
 */
export const getDestinationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const collection = getDestinationsCollection();
    const destination = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!destination) {
      res.status(404).json({ message: 'Destination not found' });
      return;
    }
    res.json({ data: destination });
  } catch (error) {
    console.error('Fetch destination by id error:', error);
    res.status(500).json({ message: 'Failed to fetch destination', error: error instanceof Error ? error.message : error });
  }
};

/**
 * Fetch only the authenticated user's destinations. (Auth required)
 */
export const getMyDestinations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const collection = getDestinationsCollection();
    const destinations = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
    res.json({ data: destinations });
  } catch (error) {
    console.error('Fetch my destinations error:', error);
    res.status(500).json({ message: 'Failed to fetch your destinations', error: error instanceof Error ? error.message : error });
  }
};

/**
 * Delete a destination by ID. (Auth required, owner only)
 */
export const deleteDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const collection = getDestinationsCollection();
    const destination = await collection.findOneAndDelete({ 
      _id: new ObjectId(req.params.id), 
      userId 
    });
    if (!destination) {
      res.status(404).json({ message: 'Destination not found or you are not the owner.' });
      return;
    }
    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    console.error('Delete destination error:', error);
    res.status(500).json({ message: 'Failed to delete destination', error: error instanceof Error ? error.message : error });
  }
};

/**
 * Fetch statistics for travel planner dashboard. (Public)
 */
export const getDestinationStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tripsCollection = getTripsCollection();
    const destinationsCollection = getDestinationsCollection();
    const profilesCollection = getProfilesCollection();
    
    const [tripsCount, destinationsCount, usersCount] = await Promise.all([
      tripsCollection.countDocuments(),
      destinationsCollection.countDocuments(),
      profilesCollection.countDocuments(),
    ]);
    
    // Unique countries from destinations
    const uniqueCountries = await destinationsCollection.distinct('country');

    res.json({
      data: {
        tripsPlanned: tripsCount,
        destinations: destinationsCount,
        happyTravelers: usersCount,
        countries: uniqueCountries.length,
      }
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch travel statistics',
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Fetch trending destinations (sorted by rating or featured). (Public)
 */
export const getTrendingDestinations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '6' } = req.query;
    const limitNum = Math.min(10, Math.max(1, parseInt(limit as string, 10)));

    const collection = getDestinationsCollection();
    const destinations = await collection
      .find()
      .sort({ rating: -1, createdAt: -1 })
      .limit(limitNum)
      .project({
        name: 1,
        country: 1,
        city: 1,
        shortDescription: 1,
        price: 1,
        durationDays: 1,
        rating: 1,
        coverImage: 1,
      })
      .toArray();

    res.json({ data: destinations });
  } catch (error) {
    console.error('Fetch trending destinations error:', error);
    res.status(500).json({
      message: 'Failed to fetch trending destinations',
      error: error instanceof Error ? error.message : error,
    });
  }
};

