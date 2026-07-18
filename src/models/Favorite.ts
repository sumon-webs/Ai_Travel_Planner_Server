import mongoose, { Document, Schema } from 'mongoose';

// Supported item types that can be favorited
export type FavoriteItemType = 'trip' | 'place' | 'activity' | 'destination';

// Flexible metadata for each item type
export interface IFavoriteMetadata {
  name?: string;
  description?: string;
  image?: string;
  location?: string;
  country?: string;
  rating?: number;
  [key: string]: unknown;
}

export interface IFavorite extends Document {
  // Owner — Better Auth user ID
  userId: string;
  // ID of the favorited item (ObjectId string for trips, external ID for places)
  itemId: string;
  itemType: FavoriteItemType;
  metadata: IFavoriteMetadata;
  createdAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    itemId: {
      type: String,
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ['trip', 'place', 'activity', 'destination'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'favorites',
  }
);

// A user can only favorite the same item once
FavoriteSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

// Fetch all favorites for a user ordered by newest
FavoriteSchema.index({ userId: 1, createdAt: -1 });

export const Favorite = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
