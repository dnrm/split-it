'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image as ImageIcon, 
  Store, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { SharedTicket, TicketItem, TicketStatus } from '@/types';
import { toast } from 'sonner';

interface TicketViewerProps {
  ticketId: string;
  showImage?: boolean;
  className?: string;
}

export function TicketViewer({ ticketId, showImage = true, className }: TicketViewerProps) {
  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [items, setItems] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // If ticket is ready, fetch items
      if (ticketData.ticket.status === 'ready') {
        const itemsResponse = await fetch(`/api/tickets/${ticketId}/items`);
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItems(itemsData.items || []);
        }
      }

    } catch (err) {
      console.error('Error fetching ticket data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketData();
  }, [ticketId]);

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" />Processing</Badge>;
      case 'ready':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Ready</Badge>;
      case 'finalized':
        return <Badge variant="outline" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Finalized</Badge>;
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={fetchTicketData}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Ticket not found</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Ticket Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {ticket.merchant_name || 'Unknown Merchant'}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {new Date(ticket.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(ticket.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-medium">
                {ticket.total_amount ? formatCurrency(ticket.total_amount) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Items:</span>
              <span className="font-medium">{items.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Image */}
      {showImage && ticket.image_url && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Receipt Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                src={ticket.image_url}
                alt="Receipt"
                className="w-full max-w-md mx-auto rounded-lg border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => window.open(ticket.image_url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {ticket.status === 'ready' && items.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
            <CardDescription>
              {items.length} item{items.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {ticket.status === 'processing' && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Processing receipt...</p>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing the image to extract items and prices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {ticket.status === 'error' && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to process receipt. The image might be unclear or in an unsupported format.
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={fetchTicketData}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Finalized State */}
      {ticket.status === 'finalized' && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">Ticket finalized</p>
                <p className="text-sm text-muted-foreground">
                  Expenses have been created and added to the group
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
