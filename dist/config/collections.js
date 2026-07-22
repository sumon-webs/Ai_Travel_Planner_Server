import { getDb } from './db.js';
// Collection names
export const COLLECTIONS = {
    TRIPS: 'trips',
    FEEDBACK: 'feedback',
    CHAT_HISTORIES: 'chat_histories',
    FAVORITES: 'favorites',
};
// Get typed collection accessors
export const getTripsCollection = () => {
    return getDb().collection(COLLECTIONS.TRIPS);
};
export const getFeedbackCollection = () => {
    return getDb().collection(COLLECTIONS.FEEDBACK);
};
export const getChatHistoriesCollection = () => {
    return getDb().collection(COLLECTIONS.CHAT_HISTORIES);
};
export const getFavoritesCollection = () => {
    return getDb().collection(COLLECTIONS.FAVORITES);
};
// Initialize indexes for collections
export const initializeIndexes = async () => {
    const db = getDb();
    // Trips indexes
    await db.collection(COLLECTIONS.TRIPS).createIndex({ createdBy: 1, createdAt: -1 });
    await db.collection(COLLECTIONS.TRIPS).createIndex({ userId: 1, createdAt: -1 });
    await db.collection(COLLECTIONS.TRIPS).createIndex({ isPublic: 1, createdAt: -1 });
    // Feedback indexes
    await db.collection(COLLECTIONS.FEEDBACK).createIndex({ createdAt: -1 });
    await db.collection(COLLECTIONS.FEEDBACK).createIndex({ email: 1 });
    // Chat histories indexes
    await db.collection(COLLECTIONS.CHAT_HISTORIES).createIndex({ userId: 1, createdAt: -1 });
    await db.collection(COLLECTIONS.CHAT_HISTORIES).createIndex({ userId: 1, tripId: 1 });
    // Favorites indexes
    await db.collection(COLLECTIONS.FAVORITES).createIndex({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });
    await db.collection(COLLECTIONS.FAVORITES).createIndex({ userId: 1, createdAt: -1 });
    console.log('Database indexes initialized');
};
