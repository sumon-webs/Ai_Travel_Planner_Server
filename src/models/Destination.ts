import mongoose, { Document, Schema } from 'mongoose';

export interface IDestination extends Document {
  name: string;
  country: string;
  city: string;
  shortDescription: string;
  description: string;
  price: number;
  durationDays: number;
  category: string;
  bestSeason: string;
  rating: number;
  coverImage: string;
  galleryImages: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<IDestination>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    bestSeason: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    coverImage: {
      type: String,
      required: true,
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'destinations',
  }
);

export const Destination = mongoose.model<IDestination>('Destination', DestinationSchema);
