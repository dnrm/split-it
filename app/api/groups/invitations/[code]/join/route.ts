import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateInvitation } from '@/lib/utils/invitation-helper';

interface RouteParams {
  params: Promise<{ code: string }>;
}

// POST - Join a group using an invitation code
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('group_invitations')
      .select('*')
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
        { error: `Invitation is ${validation.reason}` },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', invitation.group_id)
      .eq('user_id', user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add user to group
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: invitation.group_id,
        user_id: user.id,
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      return NextResponse.json(
        { error: 'Failed to join group' },
        { status: 500 }
      );
    }

    // Increment used_count
    const { error: updateError } = await supabase
      .from('group_invitations')
      .update({ used_count: invitation.used_count + 1 })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation count:', updateError);
      // Don't fail the request if we can't update the count
    }

    return NextResponse.json({
      data: {
        group_id: invitation.group_id,
        message: 'Successfully joined the group',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/groups/invitations/[code]/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

