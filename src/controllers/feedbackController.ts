import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getFeedbackCollection } from '../config/collections.js';

// ─── POST /api/feedback ─────────────────────────────────────────────────────────
/**
 * Create a new feedback entry.
 * Public endpoint - no authentication required.
 */
export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message, rating } = req.body;

    // Validate required fields
    if (!name || !email || !message || !rating) {
      res.status(400).json({ message: 'Name, email, message, and rating are required' });
      return;
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    const feedbackData = {
      name,
      email,
      subject,
      message,
      rating,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const collection = getFeedbackCollection();
    const result = await collection.insertOne(feedbackData);

    const feedback = { ...feedbackData, _id: result.insertedId.toString() };
    res.status(201).json({
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(400).json({
      message: 'Failed to submit feedback',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─── GET /api/feedback ──────────────────────────────────────────────────────────
/**
 * Return all feedback, sorted newest first.
 * Public endpoint - no authentication required.
 */
export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '50' } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

    const collection = getFeedbackCollection();
    const feedback = await collection
      .find()
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .toArray();

    res.json({
      data: feedback,
      count: feedback.length,
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      message: 'Failed to fetch feedback',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─── DELETE /api/feedback/:id ────────────────────────────────────────────────────
/**
 * Delete feedback.
 * Admin endpoint - requires authentication (can be added later).
 */
export const deleteFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const collection = getFeedbackCollection();
    const feedback = await collection.findOneAndDelete({ 
      _id: new ObjectId(req.params.id) 
    });

    if (!feedback) {
      res.status(404).json({ message: 'Feedback not found' });
      return;
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      message: 'Failed to delete feedback',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
