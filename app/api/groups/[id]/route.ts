import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Update group (name, currency, etc.)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { name, currency } = body as {
      name?: string;
      currency?: string;
    };

    // Validate input
    if (!name && !currency) {
      return NextResponse.json(
        { error: 'At least one field (name or currency) must be provided' },
        { status: 400 }
      );
    }

    // Check if user is the group creator
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
        { error: 'Only group creators can update group details' },
        { status: 403 }
      );
    }

    // Update group
    const updateData: any = {};
    if (name) updateData.name = name;
    if (currency) updateData.currency = currency;

    const { data: updatedGroup, error: updateError } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating group:', updateError);
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedGroup });
  } catch (error) {
    console.error('Error in PUT /api/groups/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete group
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

    // Check if user is the group creator
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
        { error: 'Only group creators can delete groups' },
        { status: 403 }
      );
    }

    // Delete group (CASCADE will handle related records)
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (deleteError) {
      console.error('Error deleting group:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/groups/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
