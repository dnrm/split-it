import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - Remove a member from the group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Parse request body to get the user ID to remove
    const body = await request.json();
    const { userIdToRemove } = body as {
      userIdToRemove: string;
    };

    if (!userIdToRemove) {
      return NextResponse.json(
        { error: 'User ID to remove is required' },
        { status: 400 }
      );
    }

    // Check if the current user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to remove members' },
        { status: 403 }
      );
    }

    // Check if the user to remove is actually a member
    const { data: targetMembership, error: targetMembershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userIdToRemove)
      .single();

    if (targetMembershipError || !targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 404 }
      );
    }

    // Check if user is trying to remove themselves (leave group)
    const isLeavingGroup = userIdToRemove === user.id;

    // If removing someone else, check if current user is group creator
    if (!isLeavingGroup) {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      if (group.created_by !== user.id) {
        return NextResponse.json(
          { error: 'Only group creators can remove other members' },
          { status: 403 }
        );
      }
    }

    // Remove the member
    const { error: removeError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userIdToRemove);

    if (removeError) {
      console.error('Error removing member:', removeError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: isLeavingGroup ? 'Left group successfully' : 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/groups/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
