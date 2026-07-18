import { Request, Response } from 'express';
import { Destination, User, Trip } from '../models';

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

    const destination = await Destination.create({
      name, country, city, shortDescription, description,
      price: Number(price), durationDays: Number(durationDays),
      category, bestSeason, rating: Number(rating),
      coverImage, galleryImages: galleryImages || [], userId,
    });

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
    const destinations = await Destination.find().sort({ createdAt: -1 });
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
    const destination = await Destination.findById(req.params.id);
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
    const destinations = await Destination.find({ userId }).sort({ createdAt: -1 });
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
    const destination = await Destination.findOneAndDelete({ _id: req.params.id, userId });
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
    const activeTripsCount = await Trip.countDocuments();
    const destinationsCount = await Destination.countDocuments();
    const usersCount = await User.countDocuments();
    
    // Unique countries from destinations
    const uniqueCountries = await Destination.distinct('country');

    res.json({
      data: {
        tripsPlanned: activeTripsCount + 51240,
        destinations: destinationsCount + 120,
        happyTravelers: usersCount + 18500,
        countries: uniqueCountries.length + 35,
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

