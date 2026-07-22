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
            console.log('[AUTH MIDDLEWARE] No session found');
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        console.log('[AUTH MIDDLEWARE] Session found');
        console.log('[AUTH MIDDLEWARE] Session user keys:', Object.keys(session.user || {}));
        console.log('[AUTH MIDDLEWARE] Session user:', JSON.stringify(session.user, null, 2));
        req.user = session.user;
        req.session = session;
        next();
    }
    catch (error) {
        console.error('[AUTH MIDDLEWARE] Authentication error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, image } = req.body;
        const userId = req.user?.id;
        console.log('[PROFILE UPDATE] === STARTING PROFILE UPDATE ===');
        console.log('[PROFILE UPDATE] Request body:', { name, image });
        console.log('[PROFILE UPDATE] User ID from session:', userId);
        console.log('[PROFILE UPDATE] User object from middleware:', JSON.stringify(req.user, null, 2));
        console.log('[PROFILE UPDATE] User object keys:', Object.keys(req.user || {}));
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
        console.log('[PROFILE UPDATE] Collection name:', userCollection.collectionName);
        // First, let's see what users exist in the database
        const allUsers = await userCollection.find({}).limit(5).toArray();
        console.log('[PROFILE UPDATE] Sample users in database:', allUsers.map(u => ({
            _id: u._id,
            id: u.id,
            email: u.email,
            name: u.name
        })));
        // Try to find the user with different identifiers
        console.log('[PROFILE UPDATE] Attempting to find user with id:', userId);
        const userById = await userCollection.findOne({ id: userId });
        console.log('[PROFILE UPDATE] User found by id:', userById ? 'YES' : 'NO');
        console.log('[PROFILE UPDATE] Attempting to find user with _id:', userId);
        const userByMongoId = await userCollection.findOne({ _id: userId });
        console.log('[PROFILE UPDATE] User found by _id:', userByMongoId ? 'YES' : 'NO');
        // Also try to find by email if available
        if (req.user?.email) {
            console.log('[PROFILE UPDATE] Attempting to find user by email:', req.user.email);
            const userByEmail = await userCollection.findOne({ email: req.user.email });
            console.log('[PROFILE UPDATE] User found by email:', userByEmail ? 'YES' : 'NO');
            if (userByEmail) {
                console.log('[PROFILE UPDATE] User by email details:', {
                    _id: userByEmail._id,
                    id: userByEmail.id,
                    email: userByEmail.email,
                    name: userByEmail.name
                });
            }
        }
        // Update user in MongoDB - try both 'id' and '_id' fields
        const updateData = { name: name.trim() };
        if (image) {
            updateData.image = image;
        }
        console.log('[PROFILE UPDATE] Update data:', updateData);
        // First try with 'id' field
        let result = await userCollection.updateOne({ id: userId }, { $set: updateData });
        console.log('[PROFILE UPDATE] Update result with id field:', result);
        // If no match, try with '_id' field
        if (result.matchedCount === 0) {
            console.log('[PROFILE UPDATE] No match with id field, trying _id field');
            result = await userCollection.updateOne({ _id: userId }, { $set: updateData });
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
        console.log('[PROFILE UPDATE] Updated user:', updatedUser);
        res.json({
            success: true,
            data: {
                id: updatedUser?.id || updatedUser?._id,
                name: updatedUser?.name,
                email: updatedUser?.email,
                image: updatedUser?.image,
            },
        });
    }
    catch (error) {
        console.error('[PROFILE UPDATE] Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
export default router;
