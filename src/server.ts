import dotenv from 'dotenv';
// Load environment variables as early as possible
dotenv.config();

import app from "./app.js";
import { connectDB, closeDb } from "./config/db.js";
import { initializeIndexes } from "./config/collections.js";
import { toNodeHandler } from 'better-auth/node';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();
    
    // Initialize database indexes
    await initializeIndexes();

    // Add Better Auth routes after database is connected
    const { getAuth } = await import('./lib/auth.js');
    const auth = getAuth();
    
    console.log('Mounting Better Auth routes at /api/auth/*');
    
    // Mount Better Auth handler at /api/auth with proper wildcard
    app.all('/api/auth/*', (req, res) => {
      console.log(`Better Auth request: ${req.method} ${req.url}`);
      console.log('Request headers:', req.headers);
      
      // Add CORS headers manually for Better Auth routes
      const origin = process.env.CLIENT_URL || 'http://localhost:3000';
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        console.log('OPTIONS request - sending 200');
        res.sendStatus(200);
        return;
      }
      
      toNodeHandler(auth)(req, res);
    });

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error stack:', (error as Error).stack);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await closeDb();
  process.exit(0);
});

startServer();
