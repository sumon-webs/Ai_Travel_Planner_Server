import { Collection } from 'mongodb';
import { getDb } from './db.js';

// Collection names
export const COLLECTIONS = {
  PROFILES: 'profiles',
  TRIPS: 'trips',
  DESTINATIONS: 'destinations',
  FEEDBACK: 'feedback',
  CHAT_HISTORIES: 'chat_histories',
  FAVORITES: 'favorites',
} as const;

// Get typed collection accessors
export const getProfilesCollection = (): Collection => {
  return getDb().collection(COLLECTIONS.PROFILES);
};

export const getTripsCollection = (): Collection => {
  return getDb().collection(COLLECTIONS.TRIPS);
};

export const getDestinationsCollection = (): Collection => {
  return getDb().collection(COLLECTIONS.DESTINATIONS);
};

export const getFeedbackCollection = (): Collection => {
  return getDb().collection(COLLECTIONS.FEEDBACK);
};

export const getChatHistoriesCollection = (): Collection => {
  return getDb().collection(COLLECTIONS.CHAT_HISTORIES);
};

export const getFavoritesCollection = (): Collection => {
  return getDb().collection(COLLECTIONS.FAVORITES);
};

// Initialize indexes for collections
export const initializeIndexes = async (): Promise<void> => {
  const db = getDb();

  // Profiles indexes
  await db.collection(COLLECTIONS.PROFILES).createIndex({ authUserId: 1 }, { unique: true });
  await db.collection(COLLECTIONS.PROFILES).createIndex({ email: 1 }, { unique: true });

  // Trips indexes
  await db.collection(COLLECTIONS.TRIPS).createIndex({ createdBy: 1, createdAt: -1 });
  await db.collection(COLLECTIONS.TRIPS).createIndex({ userId: 1, createdAt: -1 });
  await db.collection(COLLECTIONS.TRIPS).createIndex({ isPublic: 1, createdAt: -1 });

  // Destinations indexes
  await db.collection(COLLECTIONS.DESTINATIONS).createIndex({ userId: 1 });

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
