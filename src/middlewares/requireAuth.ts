import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

// Extend Express Request to carry the authenticated session
export interface AuthenticatedRequest extends Request {
  session: {
    userId: string;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
    };
  };
}

/**
 * Middleware that verifies the Better Auth session cookie/token.
 * Attaches `req.session` with the user details on success.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized — please sign in to continue.',
      });
      return;
    }

    // Attach session to request
    (req as AuthenticatedRequest).session = {
      userId: session.user.id,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    };
    (req as any).userId = session.user.id;

    next();
  } catch (error) {
    next(error);
  }
};
