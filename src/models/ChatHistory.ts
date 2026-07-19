export type MessageRole = 'user' | 'assistant' | 'system';

export interface IChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  // Optional: token count for tracking usage
  tokens?: number;
}

export interface IChatHistory {
  _id?: string;
  // Owner — Better Auth user ID
  userId: string;
  // Optional link to a Trip this chat was about
  tripId?: string;
  // Short title (can be auto-generated from the first user message)
  title: string;
  messages: IChatMessage[];
  // AI model identifier, e.g. "gemini-1.5-pro", "gpt-4o"
  aiModel: string;
  // Total token usage for billing / analytics
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}
