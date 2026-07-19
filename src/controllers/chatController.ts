import { Request, Response } from 'express';
import { Trip, ChatHistory } from '../models/index.js';
import { getGenAI } from '../services/geminiService.js';

/**
 * GET /api/chats/:tripId
 * Retrieve chat history for the specified trip.
 */
export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tripId } = req.params;
    const userId = (req as any).userId;

    if (!tripId) {
      res.status(400).json({ status: 'error', message: 'Trip ID is required.' });
      return;
    }

    const chatHistory = await ChatHistory.findOne({ userId, tripId });
    
    res.status(200).json({
      status: 'success',
      data: chatHistory || { messages: [], userId, tripId, title: 'New Chat' },
    });
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch chat history.',
    });
  }
};

/**
 * POST /api/chats/:tripId/message
 * Send a message to the travel assistant, streaming the response from Gemini and storing it.
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tripId } = req.params;
    const { content } = req.body;
    const userId = (req as any).userId;

    if (!tripId) {
      res.status(400).json({ status: 'error', message: 'Trip ID is required.' });
      return;
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      res.status(400).json({ status: 'error', message: 'Message content is required.' });
      return;
    }

    // 1. Fetch Selected Trip context
    const trip = await Trip.findOne({
      _id: tripId,
      $or: [{ createdBy: userId }, { userId: userId }]
    });

    if (!trip) {
      res.status(404).json({ status: 'error', message: 'Trip not found or unauthorized.' });
      return;
    }

    // 2. Fetch or create ChatHistory
    let chatHistory = await ChatHistory.findOne({ userId, tripId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        tripId,
        title: `Chat for ${trip.title}`,
        messages: [],
        aiModel: 'gemini-flash-lite-latest'
      });
    }

    // 3. Format message history for Gemini (roles: 'user' and 'model')
    // We map 'assistant' to 'model'
    const geminiHistory = chatHistory.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // 4. Construct detailed System Instruction containing the trip context
    const tripDest = typeof trip.destination === 'string' 
      ? trip.destination 
      : (trip.destination?.city || trip.destination?.name || 'Unknown Destination');

    const systemInstruction = `You are an expert AI Travel Assistant with deep knowledge of global destinations, local cultures, cuisines, and travel logistics. You are currently helping the user plan and refine their trip: "${trip.title}" to "${tripDest}".

━━━━━━━━━━━━━━━━━━━━━━━━
TRIP CONTEXT (use this as your source of truth):
━━━━━━━━━━━━━━━━━━━━━━━━
- Destination: ${tripDest}
- Trip Summary: ${trip.summary || 'No summary available.'}
- Budget: ${trip.estimatedBudget || (trip.budget ? `${trip.currency || 'USD'} ${trip.budget}` : 'Not specified')}
- Travel Style: ${trip.travelStyle || 'Standard'}
- Interests: ${trip.interests?.join(', ') || 'General Sightseeing'}
- Best Time to Visit: ${trip.bestTime || 'Not specified'}
- Packing Tips: ${trip.packingTips?.join(', ') || 'Not specified'}
- Full Day-by-Day Itinerary:
${JSON.stringify(trip.itinerary, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━
YOUR CAPABILITIES & BEHAVIOR RULES:
━━━━━━━━━━━━━━━━━━━━━━━━

BUDGET ADVICE:
  - When asked about reducing costs, provide specific actionable alternatives: free attractions, street food vs. restaurants, public transit vs. taxis, budget hostels vs. hotels.
  - Always include approximate cost estimates in the trip's currency.
  - Acknowledge the current budget tier (${trip.travelStyle || 'Standard'}) and suggest realistic adjustments.

LOCAL FOOD RECOMMENDATIONS:
  - Always recommend specific dishes by name (not generic terms).
  - Include where to find them (street stalls, local markets, specific neighborhoods).
  - Mention approximate cost per person.
  - Highlight dishes unique to ${tripDest} that travelers often miss.

TRANSPORTATION GUIDANCE:
  - Recommend specific local transit options (metro lines, bus routes, ferry services, tuk-tuks, bike rentals).
  - Mention transit apps, travel cards, or passes that save money.
  - Provide approximate journey times and costs between key locations.
  - Note any transport tips unique to ${tripDest} (e.g., negotiating fares, peak hours to avoid).

ITINERARY MODIFICATIONS:
  - When asked to replace or add activities, ensure NO duplicates with existing itinerary days.
  - Suggest alternatives that match the user's interests: ${trip.interests?.join(', ') || 'general sightseeing'}.
  - Keep suggestions realistic for the remaining budget and travel style.

BEST VISITING TIME:
  - If asked, provide specific months, weather conditions, local festivals, and crowd levels.
  - Mention any special events in ${tripDest} the user might want to align with.

ACCOMMODATION ALTERNATIVES:
  - When suggesting hotels/hostels, match the travel style (${trip.travelStyle || 'Standard'}) and provide 2–3 specific options with estimated nightly rates.
  - Include the neighborhood and why it's a good base for this itinerary.

GENERAL BEHAVIOR:
  - Only discuss topics relevant to this trip and destination. Politely redirect off-topic questions.
  - Format all responses in clean, readable Markdown with headers, bullet points, and emoji where appropriate.
  - Be warm, encouraging, and conversational — like a knowledgeable friend who has been to ${tripDest} many times.
  - If a question is ambiguous, ask one clarifying question before answering.`;

    // 5. Initialize Gemini Generative Model with system instructions
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      systemInstruction,
    });

    // 6. Start the chat with historical messages
    const chat = model.startChat({
      history: geminiHistory,
    });

    // 7. Configure SSE streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Encoding', 'none');

    // 8. Stream the message generation
    const resultStream = await chat.sendMessageStream(content);
    let assistantResponse = '';

    for await (const chunk of resultStream.stream) {
      const text = chunk.text();
      assistantResponse += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    // 9. Save new messages to MongoDB
    chatHistory.messages.push({
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    });
    chatHistory.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date()
    });
    
    // Save updated history
    await chatHistory.save();

    // 10. Send end marker and close connection
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in travel chat assistant:', error);
    // If headers have not been sent yet, we can send JSON error. Otherwise, write SSE error.
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Error communicating with AI Travel Assistant.',
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error occurred' })}\n\n`);
      res.end();
    }
  }
};

/**
 * DELETE /api/chats/:tripId
 * Reset or clear the conversation history for the specified trip.
 */
export const clearChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tripId } = req.params;
    const userId = (req as any).userId;

    if (!tripId) {
      res.status(400).json({ status: 'error', message: 'Trip ID is required.' });
      return;
    }

    await ChatHistory.deleteOne({ userId, tripId });

    res.status(200).json({
      status: 'success',
      message: 'Chat history cleared successfully.',
    });
  } catch (error: any) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to clear chat history.',
    });
  }
};
