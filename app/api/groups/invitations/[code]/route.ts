import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateInvitation } from '@/lib/utils/invitation-helper';

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET - Validate and get invitation details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    // Fetch invitation by code (publicly accessible for validation)
    const { data: invitation, error: fetchError } = await supabase
      .from('group_invitations')
      .select(`
        *,
        group:groups(
          id,
          name,
          currency,
          created_by
        )
      `)
      .eq('code', code)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Validate invitation
    const validation = validateInvitation(invitation);

    if (!validation.valid) {
      return NextResponse.json(
        {
          data: {
            invitation,
            valid: false,
            reason: validation.reason,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      data: {
        invitation,
        valid: true,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/groups/invitations/[code]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

