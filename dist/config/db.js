import { MongoClient } from 'mongodb';
let client = null;
let db = null;
export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI environment variable is required');
        }
        if (client && db) {
            return db;
        }
        client = new MongoClient(mongoUri);
        await client.connect();
        // Extract database name from connection string or use default
        const dbName = getDatabaseName(mongoUri);
        db = client.db(dbName);
        console.log(`MongoDB Connected: ${dbName}`);
        return db;
    }
    catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};
function getDatabaseName(uri) {
    try {
        const url = new URL(uri);
        const pathname = url.pathname;
        return pathname.replace(/^\//, '') || 'ai-project';
    }
    catch {
        return 'ai-project';
    }
}
export const getDb = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return db;
};
export const closeDb = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB connection closed');
    }
};
