import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectDB = async (): Promise<Db> => {
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
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};

function getDatabaseName(uri: string): string {
  try {
    const url = new URL(uri);
    const pathname = url.pathname;
    return pathname.replace(/^\//, '') || 'ai-project';
  } catch {
    return 'ai-project';
  }
}

export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.');
  }
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
};
