import express from 'express';
import cors from 'cors';
import { initializeAuth } from './lib/auth.js';
import tripRoutes from './routes/tripRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
const app = express();
// Trust proxy - required for production deployment behind reverse proxy (Render)
app.set('trust proxy', true);
// CORS — must be before all handlers
const allowedOrigins = [
    'http://localhost:3000',
    process.env.CLIENT_URL,
].filter(Boolean);
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Health check endpoint (for verification purposes)
app.get('/health', (_req, res) => {
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
app.use('/api/destinations', destinationRoutes);
app.use('/api/feedback', feedbackRoutes);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});
export { app, initializeAuth };
