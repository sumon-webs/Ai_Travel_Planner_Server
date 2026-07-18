import mongoose, { Document, Schema } from 'mongoose';

// ─── Sub-document interfaces ───────────────────────────────────────────────────

export interface IEstimatedBudgetBreakdown {
  accommodation?: string;
  food?: string;
  activities?: string;
  transport?: string;
  miscellaneous?: string;
}

export interface IEstimatedBudget {
  total?: string;
  perDay?: string;
  perPersonPerDay?: string;
  breakdown?: IEstimatedBudgetBreakdown;
}

export interface IBestTime {
  recommended?: string;
  reason?: string;
  avoid?: string;
}

export interface ITransportation {
  arrival?: string;
  localTransit?: string;
  departure?: string;
  tips?: string;
}

export interface ILocalFood {
  name: string;
  description?: string;
  where?: string;
  estimatedCostPerPerson?: string;
}

export interface IAccommodation {
  name?: string;
  type?: string;
  estimatedCostPerNight?: string;
  area?: string;
}

export interface IActivity {
  timeSlot?: string;
  title: string;
  description?: string;
  transport?: string;
  estimatedCost?: string;
  foodHighlight?: string;
}

export interface IItineraryDay {
  day: number;
  date?: string;
  title: string;
  description?: string;
  accommodation?: IAccommodation;
  activities: IActivity[];
  dailyCostEstimate?: string;
  notes?: string;
}

// ─── Top-level Trip interface ──────────────────────────────────────────────────

export interface ITrip extends Document {
  title: string;
  destination: any;           // string or location object from user input
  summary?: string;
  durationDays?: number;
  travelers?: number;
  travelStyle?: string;
  interests?: string[];
  estimatedBudget?: IEstimatedBudget;
  bestTime?: IBestTime;
  transportation?: ITransportation;
  localFoods?: ILocalFood[];
  packingTips?: string[];
  itinerary: IItineraryDay[];
  createdBy?: string;
  userId?: string;

  // User input fields retained for context
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  currency?: string;
  status?: string;
  coverImage?: string;
  tags?: string[];
  aiGenerated?: boolean;
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-document schemas ──────────────────────────────────────────────────────

const EstimatedBudgetBreakdownSchema = new Schema<IEstimatedBudgetBreakdown>(
  {
    accommodation: { type: String, default: '' },
    food:          { type: String, default: '' },
    activities:    { type: String, default: '' },
    transport:     { type: String, default: '' },
    miscellaneous: { type: String, default: '' },
  },
  { _id: false }
);

const EstimatedBudgetSchema = new Schema<IEstimatedBudget>(
  {
    total:           { type: String, default: '' },
    perDay:          { type: String, default: '' },
    perPersonPerDay: { type: String, default: '' },
    breakdown:       { type: EstimatedBudgetBreakdownSchema, default: () => ({}) },
  },
  { _id: false }
);

const BestTimeSchema = new Schema<IBestTime>(
  {
    recommended: { type: String, default: '' },
    reason:      { type: String, default: '' },
    avoid:       { type: String, default: '' },
  },
  { _id: false }
);

const TransportationSchema = new Schema<ITransportation>(
  {
    arrival:     { type: String, default: '' },
    localTransit:{ type: String, default: '' },
    departure:   { type: String, default: '' },
    tips:        { type: String, default: '' },
  },
  { _id: false }
);

const LocalFoodSchema = new Schema<ILocalFood>(
  {
    name:                   { type: String, required: true, trim: true },
    description:            { type: String, default: '' },
    where:                  { type: String, default: '' },
    estimatedCostPerPerson: { type: String, default: '' },
  },
  { _id: false }
);

const AccommodationSchema = new Schema<IAccommodation>(
  {
    name:                  { type: String, default: '' },
    type:                  { type: String, default: '' },
    estimatedCostPerNight: { type: String, default: '' },
    area:                  { type: String, default: '' },
  },
  { _id: false }
);

const ActivitySchema = new Schema<IActivity>(
  {
    timeSlot:      { type: String, default: '' },
    title:         { type: String, required: true, trim: true },
    description:   { type: String, default: '' },
    transport:     { type: String, default: '' },
    estimatedCost: { type: String, default: '' },
    foodHighlight: { type: String, default: '' },
  },
  { _id: false }
);

const ItineraryDaySchema = new Schema<IItineraryDay>(
  {
    day:               { type: Number, required: true, min: 1 },
    date:              { type: String, default: '' },
    title:             { type: String, required: true, trim: true },
    description:       { type: String, default: '' },
    accommodation:     { type: AccommodationSchema, default: () => ({}) },
    activities:        { type: [ActivitySchema], default: [] },
    dailyCostEstimate: { type: String, default: '' },
    notes:             { type: String, default: '' },
  },
  { _id: false }
);

// ─── Main Trip schema ──────────────────────────────────────────────────────────

const TripSchema = new Schema<ITrip>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    destination: {
      type: Schema.Types.Mixed, // Supports both String and location object
      required: true,
    },
    summary:     { type: String, default: '' },
    durationDays:{ type: Number },
    travelers:   { type: Number, default: 1 },
    travelStyle: { type: String, default: '' },
    interests:   { type: [String], default: [] },

    estimatedBudget: { type: EstimatedBudgetSchema, default: () => ({}) },
    bestTime:        { type: BestTimeSchema,        default: () => ({}) },
    transportation:  { type: TransportationSchema,  default: () => ({}) },
    localFoods:      { type: [LocalFoodSchema],     default: [] },
    packingTips:     { type: [String],              default: [] },
    itinerary:       { type: [ItineraryDaySchema],  default: [] },

    createdBy: { type: String, index: true },
    userId:    { type: String, index: true },

    // User input fields
    startDate: { type: Date },
    endDate:   { type: Date },
    budget:    { type: Number },
    currency:  { type: String, default: 'USD', uppercase: true, trim: true },
    status:    { type: String, default: 'planned' },
    coverImage:{ type: String, default: null },
    tags:      { type: [String], default: [] },
    aiGenerated:{ type: Boolean, default: true },
    isPublic:  { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'trips',
  }
);

// Compound indexes
TripSchema.index({ createdBy: 1, createdAt: -1 });
TripSchema.index({ userId: 1, createdAt: -1 });

export const Trip = mongoose.model<ITrip>('Trip', TripSchema);
