// Supported item types that can be favorited
export type FavoriteItemType = 'trip' | 'place' | 'activity';

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

export interface IFavorite {
  _id?: string;
  // Owner — Better Auth user ID
  userId: string;
  // ID of the favorited item (ObjectId string for trips, external ID for places)
  itemId: string;
  itemType: FavoriteItemType;
  metadata: IFavoriteMetadata;
  createdAt: Date;
}
