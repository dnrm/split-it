import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TicketUploadResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Check if user is member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `ticket-${timestamp}-${user.id}.${fileExtension}`;
    const filePath = `tickets/${groupId}/${fileName}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ticket-images')
      .getPublicUrl(filePath);

    // Create shared_tickets record
    const { data: ticket, error: ticketError } = await supabase
      .from('shared_tickets')
      .insert({
        group_id: groupId,
        uploaded_by: user.id,
        image_url: urlData.publicUrl,
        status: 'processing',
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Database error:', ticketError);
      // Try to clean up uploaded file
      await supabase.storage
        .from('ticket-images')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to create ticket record' },
        { status: 500 }
      );
    }

    const response: TicketUploadResponse = {
      ticketId: ticket.id,
      status: 'processing',
      message: 'Image uploaded successfully. Processing...',
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error uploading ticket:', error);
    return NextResponse.json(
      { error: 'Failed to upload ticket' },
      { status: 500 }
    );
  }
}
