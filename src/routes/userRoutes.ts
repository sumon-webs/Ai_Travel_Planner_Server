import { Router, Request, Response, NextFunction } from 'express';
import { getAuth } from '../lib/auth.js';
import { getDb } from '../config/db.js';

const router = Router();

// Extend Express Request type to include user and session
interface AuthenticatedRequest extends Request {
  user?: any;
  session?: any;
}

// Middleware to check authentication
const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('[AUTH MIDDLEWARE] Session user:', JSON.stringify(session.user));
    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, image } = req.body;
    const userId = req.user?.id;

    console.log('[PROFILE UPDATE] User ID from session:', userId);
    console.log('[PROFILE UPDATE] User object:', JSON.stringify(req.user));

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Name must be less than 100 characters' });
    }

    if (image && typeof image !== 'string') {
      return res.status(400).json({ error: 'Image must be a string' });
    }

    const db = getDb();
    const userCollection = db.collection('user');

    // Update user in MongoDB - try both 'id' and '_id' fields
    const updateData: any = { name: name.trim() };
    if (image) {
      updateData.image = image;
    }

    // First try with 'id' field
    let result = await userCollection.updateOne(
      { id: userId },
      { $set: updateData }
    );

    console.log('[PROFILE UPDATE] Update result with id field:', result);

    // If no match, try with '_id' field
    if (result.matchedCount === 0) {
      console.log('[PROFILE UPDATE] No match with id field, trying _id field');
      result = await userCollection.updateOne(
        { _id: userId },
        { $set: updateData }
      );
      console.log('[PROFILE UPDATE] Update result with _id field:', result);
    }

    if (result.matchedCount === 0) {
      console.error('[PROFILE UPDATE] User not found with id or _id:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch updated user - try both fields
    let updatedUser = await userCollection.findOne({ id: userId });
    if (!updatedUser) {
      updatedUser = await userCollection.findOne({ _id: userId });
    }

    res.json({
      success: true,
      data: {
        id: updatedUser?.id || updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        image: updatedUser?.image,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
