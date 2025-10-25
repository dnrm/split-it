import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ParsedExpense } from '@/types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Schema for parsed expense
const ExpenseSchema = z.object({
  amount: z.number().positive(),
  payer: z.string(),
  participants: z.array(z.string()),
  description: z.string(),
  category: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

/**
 * Parse natural language expense input using Gemini AI
 * @param input - Natural language description of the expense
 * @param groupMembers - Array of group member names for context
 * @returns Parsed expense data
 */
export async function parseExpenseFromText(
  input: string,
  groupMembers: string[]
): Promise<ParsedExpense> {
  const memberList = groupMembers.join(', ');

  const prompt = `You are an expense parser for a group expense sharing app. Parse the following expense description and extract structured data.

Group members: ${memberList}

Expense description: "${input}"

Extract and return ONLY a JSON object with this exact structure (no other text):
{
  "amount": <number>,
  "payer": "<name from group members>",
  "participants": ["<name1>", "<name2>", ...],
  "description": "<brief description>",
  "category": "<food|transport|accommodation|entertainment|utilities|other>",
  "confidence": <0.0 to 1.0>
}

CRITICAL RULES:
1. amount: MUST be a positive number (extract numeric value, no currency symbols)
2. payer: MUST be a string matching one of the group members exactly
3. participants: MUST be an array of strings matching group member names
4. If "everyone" or "all" is mentioned, include ALL group members in participants
5. If no participants specified, assume equal split among all members
6. description: A clean, short description of the expense
7. category: Best matching category from the list above
8. confidence: Your confidence in the parsing (0.0-1.0)

IMPORTANT: 
- amount must be a number, never null or undefined
- payer must be a string, never null or undefined
- participants must be an array of strings, never null or undefined

Examples:
- "Add $60 for gas, paid by Franco, for Dani and Ana" → {"amount": 60, "payer": "Franco", "participants": ["Dani", "Ana"], "description": "Gas", "category": "transport", "confidence": 0.9}
- "Dani paid $45 for dinner for everyone" → {"amount": 45, "payer": "Dani", "participants": ["${memberList.split(', ').join('", "')}"], "description": "Dinner", "category": "food", "confidence": 0.9}
- "$25 pizza paid by Ana" → {"amount": 25, "payer": "Ana", "participants": ["${memberList.split(', ').join('", "')}"], "description": "Pizza", "category": "food", "confidence": 0.8}

Return ONLY the JSON object, no markdown, no explanation.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean up the response - remove markdown code blocks if present
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '');
    jsonText = jsonText.replace(/```\n?/g, '');
    jsonText = jsonText.trim();

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Log the parsed data for debugging
    console.log('Parsed expense data:', parsed);

    // Validate with Zod - with better error handling
    let validated;
    try {
      validated = ExpenseSchema.parse(parsed);
    } catch (zodError) {
      console.error('Zod validation error:', zodError);
      console.error('Parsed data that failed validation:', parsed);
      
      // Try to fix common issues
      const fixedParsed = {
        amount: parsed.amount || 0,
        payer: parsed.payer || groupMembers[0] || 'Unknown',
        participants: parsed.participants || groupMembers,
        description: parsed.description || input,
        category: parsed.category || 'other',
        confidence: parsed.confidence || 0.1,
      };
      
      // Try validation again with fixed data
      validated = ExpenseSchema.parse(fixedParsed);
    }

    // Handle "everyone" case
    if (
      validated.participants.length === 0 ||
      validated.participants.some((p) =>
        ['everyone', 'all', 'everybody'].includes(p.toLowerCase())
      )
    ) {
      validated.participants = groupMembers;
    }

    return validated as ParsedExpense;
  } catch (error) {
    console.error('Error parsing expense:', error);

    // Return a low-confidence fallback
    return {
      amount: 0,
      payer: groupMembers[0] || '',
      participants: groupMembers,
      description: input,
      category: 'other',
      confidence: 0,
    };
  }
}

/**
 * Validate that parsed names match group members
 */
export function validateParsedNames(
  parsedExpense: ParsedExpense,
  groupMembers: string[]
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if payer is in group
  if (!groupMembers.includes(parsedExpense.payer)) {
    const closestMatch = findClosestMatch(parsedExpense.payer, groupMembers);
    if (closestMatch) {
      errors.push(
        `Payer "${parsedExpense.payer}" not found. Did you mean "${closestMatch}"?`
      );
    } else {
      errors.push(`Payer "${parsedExpense.payer}" is not in the group.`);
    }
  }

  // Check if participants are in group
  parsedExpense.participants.forEach((participant) => {
    if (!groupMembers.includes(participant)) {
      const closestMatch = findClosestMatch(participant, groupMembers);
      if (closestMatch) {
        errors.push(
          `Participant "${participant}" not found. Did you mean "${closestMatch}"?`
        );
      } else {
        errors.push(`Participant "${participant}" is not in the group.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Find closest matching name using simple string similarity
 */
function findClosestMatch(
  name: string,
  options: string[]
): string | undefined {
  const nameLower = name.toLowerCase();
  let bestMatch: string | undefined;
  let bestScore = 0;

  options.forEach((option) => {
    const optionLower = option.toLowerCase();

    // Check if option contains name or vice versa
    if (optionLower.includes(nameLower) || nameLower.includes(optionLower)) {
      const score = Math.max(nameLower.length, optionLower.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = option;
      }
    }
  });

  return bestMatch;
}

