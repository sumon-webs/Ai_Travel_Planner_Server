import { Router } from 'express';
import { getAuth } from '../lib/auth.js';
import { getDb } from '../config/db.js';
const router = Router();
// Middleware to check authentication
const authenticate = async (req, res, next) => {
    try {
        const auth = getAuth();
        const session = await auth.api.getSession({
            headers: req.headers,
        });
        if (!session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        req.user = session.user;
        req.session = session;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, image } = req.body;
        const userId = req.user?.id;
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
        // Update user in MongoDB
        const updateData = { name: name.trim() };
        if (image) {
            updateData.image = image;
        }
        const result = await userCollection.updateOne({ id: userId }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Fetch updated user
        const updatedUser = await userCollection.findOne({ id: userId });
        res.json({
            success: true,
            data: {
                id: updatedUser?.id,
                name: updatedUser?.name,
                email: updatedUser?.email,
                image: updatedUser?.image,
            },
        });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
export default router;
