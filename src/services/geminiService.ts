import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateContent(promptText: string): Promise<string> {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      // System instruction enforces JSON-only output at the model level
      systemInstruction: `You are a professional travel planning AI.
Return ONLY a valid JSON object.
Do not use markdown.
Do not wrap the JSON inside \`\`\`json.
Do not include explanations.
Do not include notes.
Do not include any text before or after the JSON.
The first character must be '{' and the last character must be '}'.`,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        // Force JSON MIME type — Gemini will refuse to output markdown
        responseMimeType: 'application/json',
        // Higher temperature = more creative/varied itineraries
        temperature: 0.8,
        // Nucleus sampling — keeps output diverse but coherent
        topP: 0.92,
        // Top-K for additional diversity control
        topK: 40,
        // Generous token budget for detailed multi-day itineraries
        maxOutputTokens: 8192,
      },
    });

    const responseText = result.response.text();
    if (!responseText || responseText.trim() === '') {
      throw new Error('Received empty response from Gemini API.');
    }

    // Strip any accidental markdown fences that slip through
    const cleaned = stripMarkdownFences(responseText);

    // Validate it's parseable JSON before returning
    JSON.parse(cleaned);

    return cleaned;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Error occurred while calling Gemini API');
  }
}

/**
 * Strips markdown code fences (```json ... ``` or ``` ... ```) from a string.
 * This is a safety net — with responseMimeType: 'application/json' Gemini
 * should never add fences, but this guards against edge cases.
 */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}
