import mongoose, { Document, Schema } from 'mongoose';

// ─── Feedback interface ────────────────────────────────────────────────────────

export interface IFeedback extends Document {
  name: string;
  email: string;
  subject?: string;
  message: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Feedback schema ───────────────────────────────────────────────────────────

const FeedbackSchema = new Schema<IFeedback>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
  {
    timestamps: true,
    collection: 'feedback',
  }
);

// Indexes for better query performance
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ email: 1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
