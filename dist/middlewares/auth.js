import { getAuth } from '../lib/auth.js';
export const requireAuth = async (req, res, next) => {
    try {
        const auth = getAuth();
        const session = await auth.api.getSession({
            headers: req.headers,
        });
        if (!session) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized - Please sign in to continue',
            });
            return;
        }
        // Attach user to request
        req.user = session.user;
        req.userId = session.user.id; // Add userId for compatibility
        req.session = session;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            status: 'error',
            message: 'Authentication failed',
        });
    }
};
