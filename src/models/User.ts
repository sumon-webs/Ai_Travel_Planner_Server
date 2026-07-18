import mongoose, { Document, Schema } from 'mongoose';

// Travel preferences embedded in the user profile
export interface ITravelPreferences {
  budget: 'budget' | 'mid-range' | 'luxury';
  travelStyle: ('adventure' | 'cultural' | 'relaxation' | 'food' | 'nature' | 'urban')[];
  accommodation: ('hotel' | 'hostel' | 'airbnb' | 'resort' | 'camping')[];
  preferredClimate: ('tropical' | 'cold' | 'dry' | 'temperate')[];
}

export interface IUser extends Document {
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

const TravelPreferencesSchema = new Schema<ITravelPreferences>(
  {
    budget: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury'],
      default: 'mid-range',
    },
    travelStyle: {
      type: [String],
      enum: ['adventure', 'cultural', 'relaxation', 'food', 'nature', 'urban'],
      default: [],
    },
    accommodation: {
      type: [String],
      enum: ['hotel', 'hostel', 'airbnb', 'resort', 'camping'],
      default: [],
    },
    preferredClimate: {
      type: [String],
      enum: ['tropical', 'cold', 'dry', 'temperate'],
      default: [],
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    authUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    preferences: {
      type: TravelPreferencesSchema,
      default: () => ({}),
    },
    tripCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'profiles',
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
