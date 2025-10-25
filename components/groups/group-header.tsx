'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, UserPlus, Users, ChevronDown, Link as LinkIcon, Mail } from 'lucide-react';
import { Group, GroupMember } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { GroupInviteDialog } from './group-invite-dialog';

interface GroupHeaderProps {
  group: Group;
  members: GroupMember[];
  currentUserId: string;
}

export function GroupHeader({ group, members, currentUserId }: GroupHeaderProps) {
  const router = useRouter();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', memberEmail)
        .single();

      if (userError || !userData) {
        toast.error('User not found. They need to sign up first.');
        setLoading(false);
        return;
      }

      // Check if already a member
      const isAlreadyMember = members.some((m) => m.user_id === userData.id);
      if (isAlreadyMember) {
        toast.error('This user is already a member');
        setLoading(false);
        return;
      }

      // Add member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: userData.id,
        });

      if (memberError) {
        toast.error(memberError.message);
        return;
      }

      toast.success(`${userData.name} added to the group!`);
      setIsAddMemberOpen(false);
      setMemberEmail('');
      router.refresh();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild>
        <Link href="/dashboard/groups">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <Badge variant="outline">{group.currency}</Badge>
          </div>
        </div>

        {isMounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddMemberOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Add by Email
              </DropdownMenuItem>
              <GroupInviteDialog
                groupId={group.id}
                groupName={group.name}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Create Invite Link
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent>
            <form onSubmit={handleAddMember}>
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
                <DialogDescription>
                  Invite someone to join this group by their email address.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    They must have a SplitSphere account
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Member'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members List */}
      <div className="flex flex-wrap gap-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {member.user?.name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {member.user?.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

