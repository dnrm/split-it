import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch all group members
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to view members' },
        { status: 403 }
      );
    }

    // Fetch all group members
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch group members' },
        { status: 500 }
      );
    }

    // Fetch user details for all members
    const userIds = members?.map(member => member.user_id) || [];
    let userDetails: any[] = [];
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching user details:', usersError);
        // Continue with basic info even if user details fail
      } else {
        userDetails = users || [];
      }
    }

    // Transform the data to match the expected format
    const transformedMembers = members?.map(member => {
      const user = userDetails.find(u => u.id === member.user_id);
      return {
        id: member.user_id,
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        avatar_url: user?.avatar_url || null,
        joined_at: member.joined_at,
      };
    }) || [];

    return NextResponse.json({ 
      members: transformedMembers, 
      success: true 
    });

  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
