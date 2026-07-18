import mongoose, { Document, Schema } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  // Optional: token count for tracking usage
  tokens?: number;
}

export interface IChatHistory extends Document {
  // Owner — Better Auth user ID
  userId: string;
  // Optional link to a Trip this chat was about
  tripId?: mongoose.Types.ObjectId;
  // Short title (can be auto-generated from the first user message)
  title: string;
  messages: IChatMessage[];
  // AI model identifier, e.g. "gemini-1.5-pro", "gpt-4o" (named aiModel to avoid clash with Mongoose's Document.model)
  aiModel: string;
  // Total token usage for billing / analytics
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system'],
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    tokens: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: 'New Chat',
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
    aiModel: {
      type: String,
      required: true,
      trim: true,
      default: 'gemini-1.5-pro',
    },
    totalTokens: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'chat_histories',
  }
);

// Fetch all chats for a user, newest first
ChatHistorySchema.index({ userId: 1, createdAt: -1 });

// Fetch chats linked to a specific trip
ChatHistorySchema.index({ userId: 1, tripId: 1 });

export const ChatHistory = mongoose.model<IChatHistory>(
  'ChatHistory',
  ChatHistorySchema
);
