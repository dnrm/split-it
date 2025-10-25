import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validateInvitation } from '@/lib/utils/invitation-helper';
import { InvitePageClient } from './invite-page-client';

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch invitation details
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

  const group = invitation?.group as any;

  // Handle invitation not found
  if (fetchError || !invitation) {
    return <InvitePageClient code={code} invitation={null} user={null} />;
  }

  // Check if group exists - this could happen if the group was deleted
  if (!group) {
    return <InvitePageClient code={code} invitation={null} user={null} />;
  }

  // Validate invitation
  const validation = validateInvitation(invitation);

  // Check if user is already a member
  let isAlreadyMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single();

    if (membership) {
      isAlreadyMember = true;
    }
  }

  // If user is already a member, redirect to group page
  if (isAlreadyMember) {
    redirect(`/dashboard/groups/${group.id}`);
  }

  // Add group data to invitation object for client component
  const invitationWithGroup = {
    ...invitation,
    group: group
  };

  return (
    <InvitePageClient
      code={code}
      invitation={invitationWithGroup}
      user={user}
    />
  );
}

