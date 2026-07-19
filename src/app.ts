import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import tripRoutes from './routes/tripRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';


const app: Application = express();

// CORS — must be before all handlers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Better Auth handler — must be mounted BEFORE express.json()
// so Better Auth can parse its own request body
app.all('/api/auth/*', toNodeHandler(auth));

// Body parsing middleware (after Better Auth)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (for verification purposes)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/feedback', feedbackRoutes);


// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

export default app;
