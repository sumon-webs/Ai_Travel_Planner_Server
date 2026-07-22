import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getDb } from '../config/db.js';
let authInstance = null;
// Custom fetch with logging and timeout handling
const customFetch = async (url, options) => {
    console.log('[BETTER AUTH FETCH] URL:', url);
    console.log('[BETTER AUTH FETCH] Method:', options?.method);
    console.log('[BETTER AUTH FETCH] Headers:', options?.headers);
    const startTime = Date.now();
    try {
        const response = await fetch(url, {
            ...options,
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        const duration = Date.now() - startTime;
        console.log('[BETTER AUTH FETCH] Status:', response.status);
        console.log('[BETTER AUTH FETCH] Duration:', duration, 'ms');
        // Log response body for debugging
        const responseClone = response.clone();
        try {
            const responseText = await responseClone.text();
            console.log('[BETTER AUTH FETCH] Response body:', responseText.substring(0, 500));
        }
        catch (e) {
            console.log('[BETTER AUTH FETCH] Could not read response body');
        }
        return response;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error('[BETTER AUTH FETCH] Error after', duration, 'ms:', error.message);
        console.error('[BETTER AUTH FETCH] Error type:', error.name);
        console.error('[BETTER AUTH FETCH] Error cause:', error.cause);
        throw error;
    }
};
export const initializeAuth = () => {
    if (authInstance) {
        return authInstance;
    }
    const db = getDb();
    const isProduction = process.env.NODE_ENV === 'production';
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    const allowedOrigins = [
        'http://localhost:3000',
        clientURL,
    ].filter(Boolean);
    console.log('[BETTER AUTH INIT] baseURL:', process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/auth');
    console.log('[BETTER AUTH INIT] trustedOrigins:', allowedOrigins);
    console.log('[BETTER AUTH INIT] NODE_ENV:', process.env.NODE_ENV);
    authInstance = betterAuth({
        baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/auth',
        secret: process.env.BETTER_AUTH_SECRET,
        database: mongodbAdapter(db),
        trustedOrigins: allowedOrigins,
        // Use custom fetch for debugging
        fetchOptions: {
            fetch: customFetch,
        },
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
            crossSubDomainCookies: {
                enabled: true,
            },
            cookies: {
                sessionToken: {
                    name: 'better-auth.session_token',
                    attributes: {
                        sameSite: isProduction ? 'none' : 'lax',
                        secure: isProduction,
                    },
                },
            },
        },
        account: {
            accountLinking: {
                enabled: true,
                trustedProviders: ['google', 'email-password'],
                allowDifferentEmails: false,
            },
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
