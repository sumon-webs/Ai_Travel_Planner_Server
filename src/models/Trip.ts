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

export interface ITrip {
  _id?: string;
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
