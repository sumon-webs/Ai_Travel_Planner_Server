import { Request, Response } from 'express';
import { generateTripPrompt } from '../prompts/tripPrompt';
import { generateContent } from '../services/geminiService';
import { Trip } from '../models';

export const generateTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { destination, startDate, endDate, budget, travelers, travelStyle, interests } = req.body;
    const userId = (req as any).userId || (req as any).session?.userId;

    // ───────────────────── Input Validation ─────────────────────
    if (!destination || typeof destination !== 'string' || destination.trim() === '') {
      res.status(400).json({ status: 'error', message: 'Destination is required and must be a valid string.' });
      return;
    }

    if (!startDate || isNaN(Date.parse(startDate))) {
      res.status(400).json({ status: 'error', message: 'Start date is required and must be a valid date.' });
      return;
    }

    if (!endDate || isNaN(Date.parse(endDate))) {
      res.status(400).json({ status: 'error', message: 'End date is required and must be a valid date.' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      res.status(400).json({ status: 'error', message: 'End date must be on or after start date.' });
      return;
    }

    const parsedBudget = Number(budget);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      res.status(400).json({ status: 'error', message: 'Budget is required and must be a positive number.' });
      return;
    }

    const parsedTravelers = Number(travelers);
    if (isNaN(parsedTravelers) || parsedTravelers <= 0 || !Number.isInteger(parsedTravelers)) {
      res.status(400).json({ status: 'error', message: 'Travelers count is required and must be a positive integer.' });
      return;
    }

    if (!travelStyle || typeof travelStyle !== 'string' || travelStyle.trim() === '') {
      res.status(400).json({ status: 'error', message: 'Travel style is required.' });
      return;
    }

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      res.status(400).json({ status: 'error', message: 'Interests are required and must be a non-empty array.' });
      return;
    }

    // Generate dynamic prompt
    const promptText = generateTripPrompt({
      destination,
      startDate,
      endDate,
      budget: parsedBudget,
      travelers: parsedTravelers,
      travelStyle,
      interests,
    });

    // Call Gemini API service
    const jsonString = await generateContent(promptText);

    // Validate if return string is a valid JSON
    let tripData;
    try {
      tripData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', jsonString);
      res.status(500).json({
        status: 'error',
        message: 'AI generated an invalid response. Please try again.',
      });
      return;
    }

    // Save generated trip into MongoDB — store full AI response structure
    const savedTrip = await Trip.create({
      // AI-generated fields (stored as-is, matching the AI response schema)
      title:           tripData.title,
      summary:         tripData.summary,
      durationDays:    tripData.durationDays,
      estimatedBudget: tripData.estimatedBudget,  // object: { total, perDay, perPersonPerDay, breakdown }
      bestTime:        tripData.bestTime,          // object: { recommended, reason, avoid }
      transportation:  tripData.transportation,    // object: { arrival, localTransit, departure, tips }
      localFoods:      tripData.localFoods,        // array of { name, description, where, estimatedCostPerPerson }
      packingTips:     tripData.packingTips,
      itinerary:       tripData.itinerary,         // array of days with embedded accommodation + activities objects

      // User input fields stored alongside for context
      destination:  destination,
      travelStyle:  travelStyle,
      interests:    interests,
      travelers:    parsedTravelers,
      budget:       parsedBudget,
      startDate:    start,
      endDate:      end,
      createdBy:    userId,
      userId:       userId, // backwards compatibility
      aiGenerated:  true,
    });

    res.status(200).json({
      status: 'success',
      data: savedTrip,
    });
  } catch (error: any) {
    console.error('AI Trip Generation Controller Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to generate trip plan using AI.',
    });
  }
};
