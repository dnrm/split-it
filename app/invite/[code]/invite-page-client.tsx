'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateInvitation, formatTimeRemaining } from '@/lib/utils/invitation-helper';
import { toast } from 'sonner';

interface InvitePageClientProps {
  code: string;
  invitation: any;
  user: any;
}

export function InvitePageClient({ code, invitation, user }: InvitePageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Handle invitation not found
  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invitation Not Found</CardTitle>
            </div>
            <CardDescription>
              This invitation link is invalid or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const group = invitation.group;
  const validation = validateInvitation(invitation);
  const redirectUrl = encodeURIComponent(`/invite/${code}`);

  const handleJoinGroup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/groups/invitations/${code}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to join group');
        return;
      }

      const data = await response.json();
      toast.success('Successfully joined the group!');
      router.push(`/dashboard/groups/${data.data.group_id}`);
      router.refresh();
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join {group.name}?</CardTitle>
          <CardDescription>
            You've been invited to join this group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Group Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Group Name</span>
              <span className="font-medium">{group.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Currency</span>
              <Badge variant="outline">{group.currency}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invitation Type</span>
              <Badge variant="secondary">
                {invitation.usage_type === 'single' ? 'Single-use' : 'Multi-use'}
              </Badge>
            </div>
            {!validation.valid && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="destructive">
                  {validation.reason === 'expired' ? 'Expired' : 'Used'}
                </Badge>
              </div>
            )}
            {validation.valid && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm font-medium">
                  {formatTimeRemaining(invitation.expires_at)}
                </span>
              </div>
            )}
          </div>

          {/* Validation Status */}
          {!validation.valid ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validation.reason === 'expired'
                  ? 'This invitation has expired. Please ask the group creator for a new invitation link.'
                  : 'This invitation has already been used and cannot be used again.'}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This invitation is valid and ready to use.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {validation.valid && (
            <div className="space-y-3 pt-2">
              {user ? (
                <Button
                  onClick={handleJoinGroup}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Joining...' : 'Join Group'}
                </Button>
              ) : (
                <>
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/auth/login?redirect=${redirectUrl}`}>
                      Sign In to Join
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href={`/auth/signup?redirect=${redirectUrl}`}>
                      Sign Up to Join
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}

          {!validation.valid && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

