import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '../config/db.js';

// Initialize Better Auth with the database from native MongoDB driver
// This must be called after the database is connected
let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = () => {
  if (!authInstance) {
    console.log('Initializing Better Auth...');
    console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
    console.log('CLIENT_URL:', process.env.CLIENT_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const db = getDb();
    console.log('Database connected, creating auth instance...');
    
    // In production with cross-origin deployment (Vercel + Render), 
    // we need SameSite: 'none' for cookies to work across domains
    const isProduction = process.env.NODE_ENV === 'production';
    const isCrossOrigin = process.env.CLIENT_URL && process.env.BETTER_AUTH_URL && 
      new URL(process.env.CLIENT_URL).hostname !== new URL(process.env.BETTER_AUTH_URL).hostname;
    
    const authConfig: any = {
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/auth',
      secret: process.env.BETTER_AUTH_SECRET,
      database: mongodbAdapter(db),
      trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
      advanced: {
        useSecureCookies: isProduction,
        cookiePrefix: 'better-auth',
        crossSubDomainCookies: {
          enabled: false,
        },
        cookies: {
          // For cross-origin deployment (Vercel + Render), use 'none' with Secure
          // For same-origin (localhost), use 'lax'
          sameSite: (isProduction && isCrossOrigin) ? 'none' : 'lax',
          // Explicitly set path to root for all requests
          path: '/',
          // For cross-origin, ensure domain is not set (browser handles it)
          // For same-origin, also don't set domain
          domain: undefined,
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
    
    console.log('Auth config:', {
      baseURL: authConfig.baseURL,
      trustedOrigins: authConfig.trustedOrigins,
      useSecureCookies: authConfig.advanced.useSecureCookies,
      sameSite: authConfig.advanced.cookies.sameSite,
      isProduction,
      isCrossOrigin,
    });
    
    authInstance = betterAuth(authConfig);
    console.log('Better Auth initialized successfully');
  }
  return authInstance;
};

export type Auth = ReturnType<typeof betterAuth>;
