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
    
    // Extract the backend domain for cookie setting
    const backendDomain = process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL).hostname : undefined;
    
    console.log('Cookie configuration:', {
      isProduction,
      isCrossOrigin,
      backendDomain,
      clientDomain: process.env.CLIENT_URL ? new URL(process.env.CLIENT_URL).hostname : undefined,
    });
    
    const authConfig: any = {
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/auth',
      secret: process.env.BETTER_AUTH_SECRET,
      database: mongodbAdapter(db),
      trustedOrigins: [process.env.CLIENT_URL || 'http://localhost:3000'],
      session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
        updateAge: 60 * 60 * 24, // 1 day in seconds - update session every day
        cookieCache: {
          enabled: true,
          maxAge: 5, // Cache session for 5 seconds
        },
      },
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
          // For cross-origin, set domain to backend domain so browser knows which domain the cookie belongs to
          // For same-origin (localhost), don't set domain
          domain: (isProduction && isCrossOrigin) ? backendDomain : undefined,
          // Add cookie hooks for debugging
          setCookie: (cookie: any) => {
            console.log('[Better Auth] Setting cookie:', {
              name: cookie.name,
              value: cookie.value ? cookie.value.substring(0, 20) + '...' : 'empty',
              attributes: {
                httpOnly: cookie.attributes?.httpOnly,
                secure: cookie.attributes?.secure,
                sameSite: cookie.attributes?.sameSite,
                path: cookie.attributes?.path,
                domain: cookie.attributes?.domain,
                maxAge: cookie.attributes?.maxAge,
                expires: cookie.attributes?.expires,
              },
            });
          },
          deleteCookie: (cookie: any) => {
            console.log('[Better Auth] Deleting cookie:', {
              name: cookie.name,
            });
          },
        },
        // Add database hooks for debugging session lifecycle
        databaseHooks: {
          user: {
            create: {
              before: async (user: any) => {
                console.log('[Better Auth] Creating user:', { email: user.email, id: user.id });
                return user;
              },
              after: async (user: any) => {
                console.log('[Better Auth] User created successfully:', { id: user.id, email: user.email });
              },
            },
          },
          account: {
            create: {
              before: async (account: any) => {
                console.log('[Better Auth] Creating account:', { 
                  userId: account.userId, 
                  provider: account.provider,
                  providerAccountId: account.providerAccountId 
                });
                return account;
              },
              after: async (account: any) => {
                console.log('[Better Auth] Account created successfully:', { 
                  accountId: account.id,
                  userId: account.userId,
                  provider: account.provider 
                });
              },
            },
          },
          session: {
            create: {
              before: async (session: any) => {
                console.log('[Better Auth] Creating session:', { userId: session.userId, sessionId: session.id });
                return session;
              },
              after: async (session: any) => {
                console.log('[Better Auth] Session created successfully:', { 
                  sessionId: session.id, 
                  userId: session.userId,
                  expiresAt: session.expiresAt,
                  token: session.token ? session.token.substring(0, 20) + '...' : 'none'
                });
                
                // Verify session was actually inserted into MongoDB
                const db = getDb();
                const insertedSession = await db.collection('session').findOne({ _id: session.id });
                console.log('[Better Auth] Session verification in MongoDB:', {
                  found: !!insertedSession,
                  sessionId: insertedSession?._id,
                  userId: insertedSession?.userId,
                  expiresAt: insertedSession?.expiresAt
                });
              },
            },
            get: {
              before: async (session: any) => {
                console.log('[Better Auth] Retrieving session:', { sessionId: session?.id || session });
                return session;
              },
              after: async (session: any) => {
                console.log('[Better Auth] Session retrieved:', { 
                  sessionId: session?.id, 
                  userId: session?.userId,
                  found: !!session,
                  expired: session?.expiresAt ? new Date(session.expiresAt) < new Date() : 'unknown'
                });
                
                if (!session) {
                  console.log('[Better Auth] Session lookup returned null - investigating...');
                  const db = getDb();
                  const allSessions = await db.collection('session').find({}).limit(5).toArray();
                  console.log('[Better Auth] Sample sessions in database:', allSessions.map(s => ({
                    _id: s._id,
                    userId: s.userId,
                    expiresAt: s.expiresAt
                  })));
                }
              },
            },
            delete: {
              before: async (session: any) => {
                console.log('[Better Auth] Deleting session:', { sessionId: session?.id || session });
                return session;
              },
              after: async (session: any) => {
                console.log('[Better Auth] Session deleted successfully:', { sessionId: session?.id });
              },
            },
          },
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
