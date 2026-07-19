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

    // Verify database connection and collections
    const db = (await import('./config/db.js')).getDb();
    console.log('=== DATABASE CONNECTION VERIFICATION ===');
    console.log('Database name:', db.databaseName);
    console.log('Collections:', (await db.listCollections().toArray()).map(c => c.name));
    
    // Check session collection
    const sessionCount = await db.collection('session').countDocuments();
    console.log('Session collection count:', sessionCount);
    
    // Check user collection
    const userCount = await db.collection('user').countDocuments();
    console.log('User collection count:', userCount);
    console.log('=======================================');

    // Add Better Auth routes after database is connected
    const { getAuth } = await import('./lib/auth.js');
    const auth = getAuth();
    
    console.log('Mounting Better Auth routes at /api/auth/*');
    
    // Mount Better Auth handler at /api/auth with proper wildcard
    app.all('/api/auth/*', (req, res) => {
      console.log(`Better Auth request: ${req.method} ${req.url}`);
      console.log('Request headers:', {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        cookie: req.headers.cookie ? `Cookie present with ${req.headers.cookie.split(';').length} cookies` : 'NO COOKIE',
        cookieNames: req.headers.cookie ? req.headers.cookie.split(';').map(c => c.trim().split('=')[0]) : [],
      });
      
      // Log response for get-session specifically
      if (req.url.includes('get-session')) {
        const originalSend = res.send;
        res.send = function(data) {
          console.log('[Better Auth] GET /api/auth/get-session response:', {
            statusCode: res.statusCode,
            responseBody: data ? (typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200)) : 'empty',
            hasUser: data && typeof data === 'object' && 'user' in data
          });
          return originalSend.call(this, data);
        };
      }
      
      // Global CORS middleware in app.ts already handles CORS correctly
      // No need to duplicate CORS headers here
      
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
      console.log(`Client URL: ${process.env.CLIENT_URL}`);
      console.log(`Better Auth URL: ${process.env.BETTER_AUTH_URL}`);
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
