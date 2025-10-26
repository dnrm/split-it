'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  DollarSign,
  Loader2
} from 'lucide-react';
import { TicketViewer } from '@/components/tickets/ticket-viewer';
import { TicketClaiming } from '@/components/tickets/ticket-claiming';
import { FinalizeTicketDialog } from '@/components/tickets/finalize-ticket-dialog';
import { SharedTicket, TicketFinalizationSummary, GroupMember } from '@/types';
import { toast } from 'sonner';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [finalizationSummary, setFinalizationSummary] = useState<TicketFinalizationSummary | null>(null);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ticket details
      const ticketResponse = await fetch(`/api/tickets/${ticketId}`);
      if (!ticketResponse.ok) {
        throw new Error('Failed to fetch ticket');
      }
      const ticketData = await ticketResponse.json();
      setTicket(ticketData.ticket);

      // Fetch group members
      const membersResponse = await fetch(`/api/groups/${ticketData.ticket.group_id}/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setGroupMembers(membersData.members || []);
      }

      // Get current user ID (you might need to implement this differently)
      const userResponse = await fetch('/api/auth/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUserId(userData.user?.id || '');
      }

    } catch (err) {
      console.error('Error fetching ticket data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    try {
      // Get finalization summary
      const response = await fetch(`/api/tickets/${ticketId}/finalize-summary`);
      if (!response.ok) {
        throw new Error('Failed to get finalization summary');
      }
      const data = await response.json();
      setFinalizationSummary(data.summary);
      setShowFinalizeDialog(true);
    } catch (err) {
      console.error('Error getting finalization summary:', err);
      toast.error('Failed to get finalization summary');
    }
  };

  const handleFinalized = () => {
    // Refresh ticket data
    fetchTicketData();
    toast.success('Ticket finalized successfully!');
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Ticket not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ticket Details</h1>
            <p className="text-muted-foreground">
              {ticket.merchant_name || 'Unknown Merchant'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.status === 'ready' && (
            <Button onClick={handleFinalize}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalize
            </Button>
          )}
          {ticket.status === 'finalized' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Finalized
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Viewer */}
        <div className="space-y-6">
          <TicketViewer ticketId={ticketId} />
        </div>

        {/* Claiming Interface */}
        <div className="space-y-6">
          {ticket.status === 'ready' ? (
            <TicketClaiming
              ticketId={ticketId}
              currentUserId={currentUserId}
              groupMembers={groupMembers}
              onClaimsUpdate={fetchTicketData}
            />
          ) : ticket.status === 'processing' ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Processing receipt...</p>
                    <p className="text-sm text-muted-foreground">
                      AI is analyzing the image to extract items and prices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : ticket.status === 'error' ? (
            <Card>
              <CardContent className="pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to process receipt. The image might be unclear or in an unsupported format.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : ticket.status === 'finalized' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Ticket Finalized
                </CardTitle>
                <CardDescription>
                  This ticket has been finalized and expenses have been created
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Expenses created for group members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Check the expenses page to see the breakdown</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Finalize Dialog */}
      <FinalizeTicketDialog
        open={showFinalizeDialog}
        onOpenChange={setShowFinalizeDialog}
        ticketId={ticketId}
        summary={finalizationSummary}
        onFinalized={handleFinalized}
      />
    </div>
  );
}
