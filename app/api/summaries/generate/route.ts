import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateGroupSummary } from '@/lib/ai/summary-generator';
import { SummaryTone } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { expenses, groupName, tone } = body;

    if (!expenses || !Array.isArray(expenses) || !groupName) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const summaryTone: SummaryTone = tone || 'casual';
    const summary = await generateGroupSummary(expenses, groupName, summaryTone);

    return NextResponse.json({ summary, success: true });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

