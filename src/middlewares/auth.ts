import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../lib/auth.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized - Please sign in to continue',
      });
      return;
    }

    // Attach user to request
    (req as any).user = session.user;
    (req as any).userId = session.user.id; // Add userId for compatibility
    (req as any).session = session;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

