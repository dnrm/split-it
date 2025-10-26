'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Copy,
  Share2,
  QrCode as QrCodeIcon,
  Clock,
  Users,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  InvitationExpiration,
  InvitationUsageType,
  GroupInvitation,
} from '@/types';
import {
  formatInvitationUrl,
  formatTimeRemaining,
  isInvitationExpired,
  getExpirationLabel,
} from '@/lib/utils/invitation-helper';

interface GroupInviteDialogProps {
  groupId: string;
  groupName: string;
  trigger?: React.ReactNode;
}

export function GroupInviteDialog({
  groupId,
  groupName,
  trigger,
}: GroupInviteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usageType, setUsageType] = useState<InvitationUsageType>('multi');
  const [expiration, setExpiration] = useState<InvitationExpiration>('24h');
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [selectedInvitation, setSelectedInvitation] =
    useState<GroupInvitation | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [activeInvitationQR, setActiveInvitationQR] = useState<{
    [key: string]: { show: boolean; qrUrl: string };
  }>({});

  // Fetch existing invitations
  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, [groupId]);

  useEffect(() => {
    if (open) {
      fetchInvitations();
    }
  }, [open, fetchInvitations]);

  // Generate QR code when invitation is selected
  useEffect(() => {
    if (selectedInvitation && showQR) {
      const inviteUrl = formatInvitationUrl(selectedInvitation.code);
      QRCode.toDataURL(inviteUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [selectedInvitation, showQR]);

  // Generate QR code for active invitation
  const generateQRForInvitation = async (invitation: GroupInvitation) => {
    const inviteUrl = formatInvitationUrl(invitation.code);
    try {
      const qrUrl = await QRCode.toDataURL(inviteUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setActiveInvitationQR(prev => ({
        ...prev,
        [invitation.id]: { show: true, qrUrl }
      }));
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  // Toggle QR code display for active invitation
  const toggleQRForInvitation = (invitation: GroupInvitation) => {
    const currentState = activeInvitationQR[invitation.id];
    if (currentState?.show) {
      setActiveInvitationQR(prev => ({
        ...prev,
        [invitation.id]: { show: false, qrUrl: '' }
      }));
    } else {
      generateQRForInvitation(invitation);
    }
  };

  const handleCreateInvitation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage_type: usageType, expiration }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to create invitation');
        return;
      }

      const data = await response.json();
      setSelectedInvitation(data.data);
      await fetchInvitations();
      toast.success('Invitation created successfully!');
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (code: string) => {
    const inviteUrl = formatInvitationUrl(code);
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invitation link copied to clipboard!');
  };

  const handleShare = async (code: string) => {
    const inviteUrl = formatInvitationUrl(code);

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on SplitIt`,
          text: `You've been invited to join ${groupName}. Click the link to join!`,
          url: inviteUrl,
        });
        toast.success('Invitation shared!');
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to copy
          handleCopyLink(code);
        }
      }
    } else {
      // Fallback to copy if Web Share API not supported
      handleCopyLink(code);
      toast.info('Share menu not available. Link copied instead!');
    }
  };

  const handleRevoke = async (code: string) => {
    try {
      const response = await fetch(
        `/api/groups/invitations/${code}/revoke`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to revoke invitation');
        return;
      }

      toast.success('Invitation revoked successfully!');
      await fetchInvitations();
      if (selectedInvitation?.code === code) {
        setSelectedInvitation(null);
        setShowQR(false);
      }
      router.refresh();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast.error('Failed to revoke invitation');
    }
  };

  const handleRegenerateExpired = () => {
    // Reset to creation form
    setSelectedInvitation(null);
    setShowQR(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'>
            <LinkIcon className="mr-2 h-4 w-4" />
            Create Invite Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite to {groupName}</DialogTitle>
          <DialogDescription>
            Create an invitation link or QR code to invite others to join this
            group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create New Invitation */}
          {!selectedInvitation && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Usage Type</Label>
                <RadioGroup
                  value={usageType}
                  onValueChange={(value) =>
                    setUsageType(value as InvitationUsageType)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multi" id="multi" />
                    <Label htmlFor="multi" className="font-normal cursor-pointer">
                      Multi-use (can be used by multiple people)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single" className="font-normal cursor-pointer">
                      Single-use (expires after one person joins)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Expiration</Label>
                <RadioGroup
                  value={expiration}
                  onValueChange={(value) =>
                    setExpiration(value as InvitationExpiration)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="24h" id="24h" />
                    <Label htmlFor="24h" className="font-normal cursor-pointer">
                      24 hours (default)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7d" id="7d" />
                    <Label htmlFor="7d" className="font-normal cursor-pointer">
                      7 days
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30d" id="30d" />
                    <Label htmlFor="30d" className="font-normal cursor-pointer">
                      30 days
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={handleCreateInvitation}
                disabled={loading}
                className="w-full rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
              >
                {loading ? 'Creating...' : 'Create Invitation'}
              </Button>
            </div>
          )}

          {/* Show Created Invitation */}
          {selectedInvitation && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Your invitation link has been created!
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="secondary">
                    {selectedInvitation.usage_type === 'single'
                      ? 'Single-use'
                      : 'Multi-use'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Expires
                  </span>
                  <span className="text-sm font-medium">
                    {formatTimeRemaining(selectedInvitation.expires_at)}
                  </span>
                </div>
                {selectedInvitation.usage_type === 'multi' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Times Used
                    </span>
                    <Badge variant="outline">
                      {selectedInvitation.used_count}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleCopyLink(selectedInvitation.code)}
                  className='flex-1 rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                >
                  <Copy className='mr-2 h-4 w-4' />
                  Copy Link
                </Button>
                <Button
                  onClick={() => handleShare(selectedInvitation.code)}
                  className='flex-1 rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  Share
                </Button>
              </div>

              <Button
                onClick={() => setShowQR(!showQR)}
                className='w-full rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
              >
                <QrCodeIcon className="mr-2 h-4 w-4" />
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </Button>

              {showQR && qrCodeUrl && (
                <div className="flex justify-center p-4 bg-card rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="Invitation QR Code"
                    className="w-64 h-64"
                  />
                </div>
              )}

              <Button
                onClick={handleRegenerateExpired}
                className="w-full rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Create Another Invitation
              </Button>
            </div>
          )}

          {/* List Existing Invitations */}
          {invitations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Active Invitations</h4>
                <div className="space-y-2">
                  {invitations.map((invitation) => {
                    const expired = isInvitationExpired(invitation.expires_at);
                    const usageLimitReached =
                      invitation.usage_type === 'single' &&
                      invitation.used_count >= 1;

                    return (
                      <div key={invitation.id} className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  expired || usageLimitReached
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {expired
                                  ? 'Expired'
                                  : usageLimitReached
                                  ? 'Used'
                                  : invitation.usage_type === 'single'
                                  ? 'Single-use'
                                  : 'Multi-use'}
                              </Badge>
                              {invitation.usage_type === 'multi' &&
                                !expired && (
                                  <span className="text-xs text-muted-foreground">
                                    Used {invitation.used_count} times
                                  </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {expired
                                ? 'Expired'
                                : formatTimeRemaining(invitation.expires_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!expired && !usageLimitReached && (
                              <>
                                <Button
                                  size='sm'
                                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                                  onClick={() => handleCopyLink(invitation.code)}
                                >
                                  <Copy className='h-4 w-4' />
                                </Button>
                                <Button
                                  size='sm'
                                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                                  onClick={() => handleShare(invitation.code)}
                                >
                                  <Share2 className='h-4 w-4' />
                                </Button>
                                <Button
                                  size='sm'
                                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                                  onClick={() => toggleQRForInvitation(invitation)}
                                >
                                  <QrCodeIcon className='h-4 w-4' />
                                </Button>
                              </>
                            )}
                            <Button
                              size='sm'
                              className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                              onClick={() => handleRevoke(invitation.code)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {/* QR Code Display for Active Invitation */}
                        {activeInvitationQR[invitation.id]?.show && activeInvitationQR[invitation.id]?.qrUrl && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-center">
                              <img
                                src={activeInvitationQR[invitation.id].qrUrl}
                                alt="Invitation QR Code"
                                className="w-48 h-48"
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-2">
                              Scan this QR code to join the group
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

