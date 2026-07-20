import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '../config/db.js';

let authInstance: any = null;

export const initializeAuth = () => {
  if (authInstance) {
    return authInstance;
  }

  const db = getDb();
  const isProduction = process.env.NODE_ENV === 'production';

  authInstance = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/auth',
    secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db),
    trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5,
      },
    },
    advanced: {
      useSecureCookies: isProduction,
      cookiePrefix: 'better-auth',
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
    },
  });

  return authInstance;
};

export const getAuth = () => {
  if (!authInstance) {
    throw new Error('Auth not initialized. Call initializeAuth() first.');
  }
  return authInstance;
};
