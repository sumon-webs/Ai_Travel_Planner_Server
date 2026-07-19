import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

// Native MongoDB client for Better Auth adapter
// (separate from Mongoose, but connects to the same database)
const mongoClient = new MongoClient(
  process.env.MONGO_URI || 'mongodb://localhost:27017/ai-project'
);

const db = mongoClient.db("ai-project");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/auth',

  secret: process.env.BETTER_AUTH_SECRET,

  database: mongodbAdapter(db),

  trustedOrigins: [
    process.env.CLIENT_URL || 'http://localhost:3000',
  ],

  advanced: {
    useSecureCookies: true,
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,

  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});

export type Auth = typeof auth;
