import { NextRequest, NextResponse } from 'next/server';
import { parseExpenseFromText } from '@/lib/ai/gemini-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, groupMembers } = body;

    if (!input || !groupMembers || !Array.isArray(groupMembers)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const parsed = await parseExpenseFromText(input, groupMembers);

    return NextResponse.json({ parsed, success: true });
  } catch (error) {
    console.error('Error parsing expense:', error);
    return NextResponse.json(
      { error: 'Failed to parse expense' },
      { status: 500 }
    );
  }
}

