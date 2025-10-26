'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Users
} from 'lucide-react';
import { TicketViewer } from '@/components/tickets/ticket-viewer';
import { TicketClaiming } from '@/components/tickets/ticket-claiming';
import { FinalizeTicketDialog } from '@/components/tickets/finalize-ticket-dialog';
import { SharedTicket, TicketItemWithClaims, User } from '@/types';
import { toast } from 'sonner';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [items, setItems] = useState<TicketItemWithClaims[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTicketData = async () => {
    try {
      // Fetch ticket details
      const ticketResponse = await fetch(`/api/tickets/${ticketId}`);
      if (!ticketResponse.ok) {
        const errorData = await ticketResponse.json();
        console.error('Ticket fetch error:', errorData);
        throw new Error(`Failed to fetch ticket: ${errorData.error || 'Unknown error'}`);
      }
      const ticketData = await ticketResponse.json();
      setTicket(ticketData.ticket);

      // Fetch ticket items
      const itemsResponse = await fetch(`/api/tickets/${ticketId}/items`);
      if (!itemsResponse.ok) {
        const errorData = await itemsResponse.json();
        console.error('Items fetch error:', errorData);
        throw new Error(`Failed to fetch items: ${errorData.error || 'Unknown error'}`);
      }
      const itemsData = await itemsResponse.json();
      setItems(itemsData.items);

      // Fetch current user
      const userResponse = await fetch('/api/auth/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }

    } catch (error) {
      console.error('Error fetching ticket data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load ticket data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchTicketData();
    setRefreshing(false);
  };

  const handleRetryParse = async () => {
    if (!ticket) return;

    setRefreshing(true);
    try {
      const response = await fetch('/api/tickets/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Parsing failed');
      }

      toast.success('Ticket parsing retried successfully');
      await fetchTicketData();
    } catch (error) {
      console.error('Error retrying parse:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to retry parsing');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFinalized = () => {
    // Refresh data to show updated status
    fetchTicketData();
    toast.success('Ticket finalized! Expenses have been created.');
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId]);

  // Auto-refresh if ticket is processing
  useEffect(() => {
    if (ticket?.status === 'processing') {
      const interval = setInterval(() => {
        refreshData();
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
    }
  }, [ticket?.status]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading ticket...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Ticket Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The ticket you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/dashboard/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  const canFinalize = ticket.status === 'ready' && currentUser;
  const hasUnclaimedItems = items.some(item => item.remaining_quantity > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/tickets')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
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
          <Badge 
            className={
              ticket.status === 'ready' ? 'bg-green-100 text-green-800' :
              ticket.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
              ticket.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }
          >
            {ticket.status === 'processing' && <Clock className="mr-1 h-3 w-3" />}
            {ticket.status === 'ready' && <CheckCircle className="mr-1 h-3 w-3" />}
            {ticket.status === 'error' && <AlertCircle className="mr-1 h-3 w-3" />}
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {ticket.status === 'processing' && (
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Processing receipt... This may take a few moments. The page will update automatically.
          </AlertDescription>
        </Alert>
      )}

      {ticket.status === 'error' && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to parse receipt. Please try uploading a clearer image.
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryParse}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ticket Viewer */}
        <div>
          <TicketViewer
            ticket={ticket}
            onRetry={handleRetryParse}
          />
        </div>

        {/* Claiming Interface */}
        {ticket.status === 'ready' && currentUser && (
          <div>
            <TicketClaiming
              ticketId={ticketId}
              items={items}
              currentUser={currentUser}
              onClaimUpdate={refreshData}
            />
          </div>
        )}
      </div>

      {/* Finalize Section */}
      {canFinalize && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ready to Finalize?
            </CardTitle>
            <CardDescription>
              {hasUnclaimedItems 
                ? 'Some items are still unclaimed. You can finalize now or wait for more claims.'
                : 'All items have been claimed. Ready to create individual expenses.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {items.length} total items • {items.filter(item => item.is_fully_claimed).length} fully claimed
              </div>
              <FinalizeTicketDialog
                ticketId={ticketId}
                onFinalized={handleFinalized}
              >
                <Button>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalize Ticket
                </Button>
              </FinalizeTicketDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finalized State */}
      {ticket.status === 'finalized' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Ticket Finalized
            </CardTitle>
            <CardDescription>
              This ticket has been finalized and individual expenses have been created for each person.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
