import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedTicket } from '@/types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
2. Extract ONLY individual line items (not subtotals, tax, tips, or totals)
3. For each item: name, unit price, quantity
4. Calculate total as SUM of all items ONLY
5. Identify tax and tip separately (do NOT include in items)

IMPORTANT PARSING RULES:
- Ignore subtotal, tax, tip, total lines
- Only extract actual purchased items
- If quantity is not clear, assume 1
- Price should be per-unit, not line total
- If you see "2x Pizza $20", that means price=$10, quantity=2

Return this EXACT JSON structure:
{
  "merchantName": "Store Name",
  "total": 123.45,  // SUM of (price × quantity) for all items
  "tax": 12.34,     // Separate tax amount
  "tip": 5.00,      // Separate tip amount
  "items": [
    {
      "name": "Item Description",
      "price": 10.99,      // Unit price
      "quantity": 2,       // Number of units
      "category": "food"
    }
  ],
  "confidence": 0.95
}

Categories: food, drink, merchandise, service, other

Return ONLY the JSON object, no explanations or markdown.`;

    const geminiResult = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = geminiResult.response;
    const text = response.text();

    // Clean up the response - remove markdown code blocks if present
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '');
    jsonText = jsonText.replace(/```\n?/g, '');
    jsonText = jsonText.trim();

    console.log('Raw Gemini response:', jsonText);

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Provide sensible defaults for missing fields
    const result: ParsedTicket = {
      merchantName: parsed.merchantName || 'Unknown Merchant',
      total: parsed.total || 0,
      tax: parsed.tax,
      tip: parsed.tip,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      confidence: parsed.confidence || 0.5
    };

    // Auto-fix total if it doesn't match items
    // const calculatedTotal = result.items.reduce(
    //   (sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0
    // );

    // if (Math.abs(result.total - calculatedTotal) > 0.01) {
    //   console.warn(`Adjusting total from ${result.total} to ${calculatedTotal}`);
    //   result.total = calculatedTotal;
    //   result.confidence = Math.max(0.3, result.confidence - 0.2);
    // }

    // console.log('Parsed ticket data:', result);
    return result;

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
