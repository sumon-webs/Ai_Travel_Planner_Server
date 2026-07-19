export interface IDestination {
  _id?: string;
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
