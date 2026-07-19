// Travel preferences embedded in the user profile
export interface ITravelPreferences {
  budget: 'budget' | 'mid-range' | 'luxury';
  travelStyle: ('adventure' | 'cultural' | 'relaxation' | 'food' | 'nature' | 'urban')[];
  accommodation: ('hotel' | 'hostel' | 'airbnb' | 'resort' | 'camping')[];
  preferredClimate: ('tropical' | 'cold' | 'dry' | 'temperate')[];
}

export interface IUser {
  _id?: string;
  // Links to the Better Auth user record (stored in the `user` collection by better-auth)
  authUserId: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  preferences: ITravelPreferences;
  tripCount: number;
  createdAt: Date;
  updatedAt: Date;
}
