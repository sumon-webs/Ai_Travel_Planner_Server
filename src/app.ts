import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import tripRoutes from './routes/tripRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';


const app: Application = express();

// Trust proxy - required for production deployment behind reverse proxy (Render)
app.set('trust proxy', true);

// CORS — must be before all handlers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing middleware
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
