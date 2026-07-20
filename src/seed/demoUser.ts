import { getDb } from '../config/db.js';
import { getAuth } from '../lib/auth.js';

const DEMO_USER = {
  email: 'demo@aitravel.com',
  password: 'Demo123@',
  name: 'Demo User',
};

export const seedDemoUser = async () => {
  try {
    const db = getDb();

    // Delete existing demo user if it exists (to ensure proper format)
    const existingUser = await db.collection('user').findOne({ email: DEMO_USER.email });
    
    if (existingUser) {
      console.log('Deleting existing demo user to recreate with proper format:', DEMO_USER.email);
      await db.collection('user').deleteOne({ email: DEMO_USER.email });
      await db.collection('account').deleteMany({ accountId: DEMO_USER.email });
    }

    // Use Better Auth's internal API to create the user
    const auth = getAuth();
    
    // Call the signUpEmail method with the correct structure
    await auth.api.signUpEmail({
      body: {
        email: DEMO_USER.email,
        password: DEMO_USER.password,
        name: DEMO_USER.name,
      },
    } as any);

    console.log('Demo user created successfully:', DEMO_USER.email);
  } catch (error) {
    console.error('Error seeding demo user:', error);
    // Don't throw - allow server to start even if seeding fails
  }
};
