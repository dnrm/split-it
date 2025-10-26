"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  UserPlus,
  Users,
  ChevronDown,
  Link as LinkIcon,
  Mail,
  Edit3,
  Trash2,
  MoreVertical,
  UserMinus,
  LogOut,
} from "lucide-react";
import { Group, GroupMember } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { GroupInviteDialog } from "./group-invite-dialog";

interface GroupHeaderProps {
  group: Group;
  members: GroupMember[];
  currentUserId: string;
}

export function GroupHeader({
  group,
  members,
  currentUserId,
}: GroupHeaderProps) {
  const router = useRouter();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [groupName, setGroupName] = useState(group.name);
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
        .from("users")
        .select("*")
        .eq("email", memberEmail)
        .single();

      if (userError || !userData) {
        toast.error("User not found. They need to sign up first.");
        setLoading(false);
        return;
      }

      // Check if already a member
      const isAlreadyMember = members.some((m) => m.user_id === userData.id);
      if (isAlreadyMember) {
        toast.error("This user is already a member");
        setLoading(false);
        return;
      }

      // Add member
      const { error: memberError } = await supabase
        .from("group_members")
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
      setMemberEmail("");
      router.refresh();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to update group');
        return;
      }

      toast.success('Group name updated successfully!');
      setIsEditGroupOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete group');
        return;
      }

      toast.success('Group deleted successfully!');
      router.push('/dashboard/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/groups/${group.id}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIdToRemove,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove member');
        return;
      }

      const isLeavingGroup = userIdToRemove === currentUserId;
      toast.success(isLeavingGroup ? 'Left group successfully!' : 'Member removed successfully!');
      
      if (isLeavingGroup) {
        router.push('/dashboard/groups');
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isGroupCreator = group.created_by === currentUserId;

  return (
    <div className="space-y-4">
      <Button
        className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
        asChild
      >
        <Link href="/dashboard/groups">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            {isGroupCreator && isMounted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditGroupOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
            <span>·</span>
            <Badge variant="outline">{group.currency}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {isMounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary">
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

          {isMounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isGroupCreator && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditGroupOpen(true)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit Group
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteGroupOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Group
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => handleRemoveMember(currentUserId)}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

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
                <Button
                  type="button"
                  className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                  onClick={() => setIsAddMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
          <DialogContent>
            <form onSubmit={handleEditGroup}>
              <DialogHeader>
                <DialogTitle>Edit Group</DialogTitle>
                <DialogDescription>
                  Update the group name.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    type="text"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditGroupOpen(false);
                    setGroupName(group.name);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Group"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Group Dialog */}
        <Dialog open={isDeleteGroupOpen} onOpenChange={setIsDeleteGroupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Group</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this group? This action cannot be undone.
                All expenses, balances, and member data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteGroupOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteGroup}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Group"}
              </Button>
            </DialogFooter>
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
                {member.user?.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{member.user?.name}</span>
            {isMounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(isGroupCreator || member.user_id === currentUserId) && (
                    <DropdownMenuItem 
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-destructive focus:text-destructive"
                    >
                      {member.user_id === currentUserId ? (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Group
                        </>
                      ) : (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove Member
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
