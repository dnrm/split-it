import { GoogleGenerativeAI } from '@google/generative-ai';
import { Expense, GroupSummary, SummaryTone, UserBalance } from '@/types';
import { calculateBalances } from '@/lib/utils/balance-calculator';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Generate an AI summary of group expenses
 * @param expenses - Array of group expenses
 * @param groupName - Name of the group
 * @param tone - Desired tone for the summary
 * @returns Group summary with AI-generated narrative
 */
export async function generateGroupSummary(
  expenses: Expense[],
  groupName: string,
  tone: SummaryTone = 'casual'
): Promise<GroupSummary> {
  // Calculate statistics
  const balances = calculateBalances(expenses);
  const totalSpend = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCount = expenses.length;

  // Find top spender
  const topSpender = balances.reduce(
    (max, user) => (user.totalPaid > max.amount ? { userId: user.userId, name: user.userName, amount: user.totalPaid } : max),
    { userId: '', name: '', amount: 0 }
  );

  const averagePerPerson = balances.length > 0 ? totalSpend / balances.length : 0;

  // Prepare data for AI prompt
  const expenseBreakdown = expenses
    .map((exp) => `- ${exp.description}: $${exp.amount.toFixed(2)} (paid by ${exp.payer?.name})`)
    .join('\n');

  const balanceBreakdown = balances
    .map((b) => {
      if (b.balance > 0) {
        return `- ${b.userName} is owed $${b.balance.toFixed(2)}`;
      } else if (b.balance < 0) {
        return `- ${b.userName} owes $${Math.abs(b.balance).toFixed(2)}`;
      } else {
        return `- ${b.userName} is settled up`;
      }
    })
    .join('\n');

  // Define tone instructions
  const toneInstructions = {
    formal:
      'Write in a professional, formal tone. Be clear and concise. Use proper business language.',
    casual:
      'Write in a friendly, conversational tone. Be warm and approachable. Use casual language but stay clear.',
    sarcastic:
      'Write with a playful, lightly sarcastic tone. Add some humor and wit. Gently tease but stay friendly.',
    roast:
      'Write in a brutally honest, roast-style tone. Be savage but playful. Call out ridiculous spending patterns, make fun of who paid the most, and roast people for their financial choices. Use humor, exaggeration, and friendly insults. Be mean but in a fun way that friends would laugh at.',
  };

  const prompt = `Generate a summary for "${groupName}" expense group.

Statistics:
- Total expenses: ${expenseCount}
- Total spent: $${totalSpend.toFixed(2)}
- Top spender: ${topSpender.name} ($${topSpender.amount.toFixed(2)})
- Average per person: $${averagePerPerson.toFixed(2)}

Expenses:
${expenseBreakdown}

Current balances:
${balanceBreakdown}

Tone: ${toneInstructions[tone]}

Write a 2-3 paragraph summary that:
1. Highlights key spending patterns
2. Mentions who paid the most
3. Notes any interesting insights about the expenses
4. Reminds people about outstanding balances

Keep it brief, engaging, and in the specified tone. Do not use markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summaryText = response.text().trim();

    return {
      totalSpend,
      topSpender,
      expenseCount,
      averagePerPerson,
      summary: summaryText,
      tone,
    };
  } catch (error) {
    console.error('Error generating summary:', error);

    // Return a basic fallback summary
    const fallbackSummary = `${groupName} has ${expenseCount} expenses totaling $${totalSpend.toFixed(
      2
    )}. ${topSpender.name} has paid the most at $${topSpender.amount.toFixed(
      2
    )}. The average expense per person is $${averagePerPerson.toFixed(2)}.`;

    return {
      totalSpend,
      topSpender,
      expenseCount,
      averagePerPerson,
      summary: fallbackSummary,
      tone,
    };
  }
}

