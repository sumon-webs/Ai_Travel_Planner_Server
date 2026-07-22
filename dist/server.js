import dotenv from 'dotenv';
// Load environment variables as early as possible
dotenv.config();
import { app, initializeAuth } from "./app.js";
import { toNodeHandler } from 'better-auth/node';
import { connectDB, closeDb } from "./config/db.js";
import { initializeIndexes } from "./config/collections.js";
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
        console.log('=======================================');
        // Initialize Better Auth after database is connected
        const auth = initializeAuth();
        console.log('Better Auth initialized successfully');
        // Mount Better Auth routes
        app.all('/api/auth/*', toNodeHandler(auth));
        // Start listening
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        console.error('Error stack:', error.stack);
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
