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
The first character must be '{' and the last character must be '}'.
Ensure all property names are double-quoted.
Do not include trailing commas.
Ensure proper JSON syntax throughout.`,
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

    // Log the cleaned response for debugging
    console.log('[GEMINI] Cleaned response length:', cleaned.length);
    console.log('[GEMINI] First 200 chars:', cleaned.substring(0, 200));
    console.log('[GEMINI] Last 200 chars:', cleaned.substring(cleaned.length - 200));

    // Fix common JSON issues
    const fixed = fixCommonJsonIssues(cleaned);

    // Log the fixed response for debugging
    console.log('[GEMINI] Fixed response length:', fixed.length);

    // Validate it's parseable JSON before returning
    try {
      JSON.parse(fixed);
    } catch (parseError: any) {
      console.error('[GEMINI] JSON Parse Error at position:', parseError.message);
      // Show context around error position
      const errorPos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
      const startContext = Math.max(0, errorPos - 100);
      const endContext = Math.min(fixed.length, errorPos + 100);
      console.log('[GEMINI] Context around error:', fixed.substring(startContext, endContext));
      throw parseError;
    }

    return fixed;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Error occurred while calling Gemini API');
  }
}

/**
 * Strips markdown code fences (```json ... ``` or ``` ... ```) from a string.
 * Also removes any text that might appear after the JSON object.
 * This is a safety net — with responseMimeType: 'application/json' Gemini
 * should never add fences, but this guards against edge cases.
 */
function stripMarkdownFences(text: string): string {
  let cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  
  // Find the first '{' and the last '}' to extract just the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

/**
 * Fixes common JSON syntax issues that might appear in AI-generated responses.
 * This includes trailing commas, unquoted property names, and other edge cases.
 */
function fixCommonJsonIssues(text: string): string {
  let fixed = text;
  
  // Remove trailing commas before closing brackets/braces
  fixed = fixed.replace(/,\s*}/g, '}');
  fixed = fixed.replace(/,\s*]/g, ']');
  
  // Fix unquoted property names (simple identifiers only)
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Remove comments (both single-line and multi-line)
  fixed = fixed.replace(/\/\/.*$/gm, '');
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Fix missing commas between object properties
  fixed = fixed.replace(/"\s*"/g, '", "');
  fixed = fixed.replace(/}\s*{/g, '},{');
  fixed = fixed.replace(/]\s*{/g, '],{');
  fixed = fixed.replace(/}\s*\[/g, '},[');
  
  // Fix missing commas between array elements
  fixed = fixed.replace(/"\s*\]/g, '"]');
  fixed = fixed.replace(/\d\s*\]/g, ']');
  fixed = fixed.replace(/true\s*\]/g, 'true]');
  fixed = fixed.replace(/false\s*\]/g, 'false]');
  fixed = fixed.replace(/null\s*\]/g, 'null]');
  
  // Fix boolean/null values that might be quoted
  fixed = fixed.replace(/"true"/g, 'true');
  fixed = fixed.replace(/"false"/g, 'false');
  fixed = fixed.replace(/"null"/g, 'null');
  
  // Remove extra whitespace
  fixed = fixed.replace(/\s+/g, ' ');
  
  return fixed.trim();
}
