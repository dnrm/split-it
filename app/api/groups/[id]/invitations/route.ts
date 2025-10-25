import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInvitationCode, calculateExpirationDate } from '@/lib/utils/invitation-helper';
import { InvitationExpiration, InvitationUsageType } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Create a new invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { usage_type, expiration } = body as {
      usage_type: InvitationUsageType;
      expiration: InvitationExpiration;
    };

    // Validate input
    if (!usage_type || !expiration) {
      return NextResponse.json(
        { error: 'Missing required fields: usage_type, expiration' },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to create invitations' },
        { status: 403 }
      );
    }

    // Generate invitation code and calculate expiration
    const code = generateInvitationCode();
    const expiresAt = calculateExpirationDate(expiration);

    // Create invitation
    const { data: invitation, error: createError } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        code,
        usage_type,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invitation:', createError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: invitation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/groups/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List all invitations for a group
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to view invitations' },
        { status: 403 }
      );
    }

    // Fetch all invitations for this group
    const { data: invitations, error: fetchError } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching invitations:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: invitations });
  } catch (error) {
    console.error('Error in GET /api/groups/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

