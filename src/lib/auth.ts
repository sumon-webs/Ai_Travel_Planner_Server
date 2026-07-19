import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '../config/db.js';

// Initialize Better Auth with the database from native MongoDB driver
// This must be called after the database is connected
let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = () => {
  if (!authInstance) {
    console.log('Initializing Better Auth...');
    const db = getDb();
    console.log('Database connected, creating auth instance...');
    
    const authConfig: any = {
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/auth',
      secret: process.env.BETTER_AUTH_SECRET,
      database: mongodbAdapter(db),
      trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
      advanced: {
        useSecureCookies: process.env.NODE_ENV === 'production',
        cookiePrefix: 'better-auth',
        crossSubDomainCookies: {
          enabled: false,
        },
      },
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        },
      },
    };
    
    authInstance = betterAuth(authConfig);
    console.log('Better Auth initialized successfully');
  }
  return authInstance;
};

export type Auth = ReturnType<typeof betterAuth>;
