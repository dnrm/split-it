import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { ParsedTicket } from '@/types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Schema for parsed ticket validation
const ParsedTicketSchema = z.object({
  merchantName: z.string().min(1),
  total: z.number().positive(),
  tax: z.number().optional(),
  tip: z.number().optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    quantity: z.number().positive(),
    category: z.string().optional(),
  })).min(1),
  confidence: z.number().min(0).max(1),
});

/**
 * Parse ticket/receipt image using Gemini Vision API
 * @param imageBuffer - Buffer containing the image data
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
 * @returns Parsed ticket data with items, totals, and confidence score
 */
export async function parseTicketFromImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ParsedTicket> {
  try {
    // Convert buffer to base64 for Gemini
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `You are an expert receipt and ticket parser. Analyze this image and extract all itemized information.

CRITICAL REQUIREMENTS:
1. Identify the merchant/store name
2. Extract ALL individual line items with their prices and quantities
3. Calculate the total amount
4. Identify tax and tip if present
5. Categorize each item appropriately
6. Return ONLY valid JSON, no markdown formatting

For each item, extract:
- name: Clear description of the item
- price: Unit price (not total for that line)
- quantity: Number of units (default to 1 if not specified)
- category: food, drink, merchandise, service, other

Return this EXACT JSON structure:
{
  "merchantName": "Store Name",
  "total": 123.45,
  "tax": 12.34,
  "tip": 5.00,
  "items": [
    {
      "name": "Item Description",
      "price": 10.99,
      "quantity": 2,
      "category": "food"
    }
  ],
  "confidence": 0.95
}

IMPORTANT RULES:
- price must be positive numbers only
- quantity must be positive numbers only
- total must equal sum of (price * quantity) for all items
- confidence should reflect how clear and readable the receipt is
- If you cannot read something clearly, lower the confidence
- Include ALL items, even small ones
- If quantity is not specified, assume 1
- Be precise with decimal places

Examples of good item extraction:
- "2x Coffee @ $3.50 each" → {"name": "Coffee", "price": 3.50, "quantity": 2, "category": "drink"}
- "Pizza - Large" → {"name": "Pizza - Large", "price": 15.99, "quantity": 1, "category": "food"}
- "Service Fee" → {"name": "Service Fee", "price": 2.00, "quantity": 1, "category": "service"}

Return ONLY the JSON object, no explanations or markdown.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Clean up the response - remove markdown code blocks if present
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '');
    jsonText = jsonText.replace(/```\n?/g, '');
    jsonText = jsonText.trim();

    console.log('Raw Gemini response:', jsonText);

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate with Zod
    const validated = ParsedTicketSchema.parse(parsed);

    // Additional validation: ensure total makes sense
    const calculatedTotal = validated.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // If there's a significant discrepancy, adjust confidence
    const totalDifference = Math.abs(validated.total - calculatedTotal);
    if (totalDifference > 0.01) {
      validated.confidence = Math.max(0.1, validated.confidence - 0.2);
      console.warn(`Total mismatch: expected ${calculatedTotal}, got ${validated.total}`);
    }

    console.log('Parsed ticket data:', validated);
    return validated;

  } catch (error) {
    console.error('Error parsing ticket image:', error);
    
    // Return a low-confidence fallback
    return {
      merchantName: 'Unknown Merchant',
      total: 0,
      items: [],
      confidence: 0,
    };
  }
}

/**
 * Validate that parsed ticket data is reasonable
 */
export function validateParsedTicket(parsed: ParsedTicket): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if total is reasonable
  if (parsed.total <= 0) {
    errors.push('Total amount must be positive');
  }

  // Check if items exist
  if (parsed.items.length === 0) {
    errors.push('No items found in the receipt');
  }

  // Check if items have valid prices
  parsed.items.forEach((item, index) => {
    if (item.price <= 0) {
      errors.push(`Item ${index + 1} has invalid price: ${item.price}`);
    }
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1} has invalid quantity: ${item.quantity}`);
    }
  });

  // Check if total matches sum of items
  const calculatedTotal = parsed.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  const totalDifference = Math.abs(parsed.total - calculatedTotal);
  if (totalDifference > 0.01) {
    errors.push(`Total mismatch: expected ${calculatedTotal}, got ${parsed.total}`);
  }

  // Check confidence level
  if (parsed.confidence < 0.3) {
    errors.push('Low confidence in parsing results');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Categorize items based on common patterns
 */
export function categorizeItem(itemName: string): string {
  const name = itemName.toLowerCase();
  
  // Food categories
  if (name.includes('pizza') || name.includes('burger') || name.includes('sandwich') || 
      name.includes('pasta') || name.includes('salad') || name.includes('soup')) {
    return 'food';
  }
  
  // Drink categories
  if (name.includes('coffee') || name.includes('tea') || name.includes('soda') || 
      name.includes('beer') || name.includes('wine') || name.includes('cocktail')) {
    return 'drink';
  }
  
  // Service categories
  if (name.includes('service') || name.includes('tip') || name.includes('delivery') || 
      name.includes('fee')) {
    return 'service';
  }
  
  // Default to other
  return 'other';
}
