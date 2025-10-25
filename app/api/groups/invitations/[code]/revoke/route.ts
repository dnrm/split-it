import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ code: string }>;
}

// DELETE - Revoke an invitation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Fetch invitation to get group_id
    const { data: invitation, error: fetchError } = await supabase
      .from('group_invitations')
      .select('*, group:groups(created_by)')
      .eq('code', code)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if user is the group creator
    const group = invitation.group as any;
    if (group.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only group creators can revoke invitations' },
        { status: 403 }
      );
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('group_invitations')
      .delete()
      .eq('code', code);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to revoke invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/groups/invitations/[code]/revoke:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

