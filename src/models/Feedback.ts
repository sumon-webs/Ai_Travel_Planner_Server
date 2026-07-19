// ─── Feedback interface ────────────────────────────────────────────────────────

export interface IFeedback {
  _id?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}
