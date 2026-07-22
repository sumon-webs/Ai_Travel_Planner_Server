import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeAuth } from './lib/auth.js';
import tripRoutes from './routes/tripRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import userRoutes from './routes/userRoutes.js';


const app: Application = express();

// Trust proxy - required for production deployment behind reverse proxy (Render)
app.set('trust proxy', true);

// CORS — must be before all handlers
const allowedOrigins = [
  'http://localhost:3000',
  'https://ai-travel-planner-client-psi.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('[CORS] Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming cookies for debugging OAuth state
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.includes('/auth/')) {
    console.log('[REQUEST COOKIES] Path:', req.path);
    console.log('[REQUEST COOKIES] Cookie header:', req.headers.cookie);
    console.log('[REQUEST COOKIES] All cookies:', req.headers.cookie?.split(';').map(c => c.trim()));
  }
  next();
});

// Health check endpoint (for verification purposes)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// ── Better Auth Routes ────────────────────────────────────────────────────────
// Auth routes will be mounted after initialization in server.ts

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/users', userRoutes);


// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

export { app, initializeAuth };
