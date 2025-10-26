import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
