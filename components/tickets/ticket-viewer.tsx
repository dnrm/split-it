'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  Calendar, 
  User, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { SharedTicket, TicketItem } from '@/types';
import { format } from 'date-fns';

interface TicketViewerProps {
  ticket: SharedTicket;
  onRetry?: () => void;
  className?: string;
}

export function TicketViewer({ ticket, onRetry, className }: TicketViewerProps) {
  const [imageError, setImageError] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'finalized':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'finalized':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy \'at\' h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className={className}>
      {/* Ticket Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {ticket.merchant_name || 'Unknown Merchant'}
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(ticket.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Unknown User
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(ticket.status)}
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ticket Image */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Receipt Image</h4>
            <div className="relative border rounded-lg overflow-hidden bg-muted">
              {imageError ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Failed to load image</p>
                  </div>
                </div>
              ) : (
                <img
                  src={ticket.image_url}
                  alt="Receipt"
                  className="w-full h-auto max-h-96 object-contain"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          </div>

          {/* Ticket Summary */}
          {ticket.status === 'ready' && (
            <div className="space-y-3">
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    {formatCurrency(ticket.total_amount || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Items Found</p>
                  <p className="text-2xl font-bold">
                    {ticket.items?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {ticket.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-800">
                    Failed to parse receipt
                  </p>
                  <p className="text-sm text-red-600">
                    The receipt could not be processed. Please try uploading a clearer image.
                  </p>
                  {ticket.parsed_data?.error && (
                    <p className="text-xs text-red-500 font-mono">
                      {ticket.parsed_data.error}
                    </p>
                  )}
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="mt-2"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {ticket.status === 'processing' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Processing receipt...
                  </p>
                  <p className="text-sm text-yellow-600">
                    This may take a few moments. The page will update automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Items */}
          {ticket.status === 'ready' && ticket.items && ticket.items.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Parsed Items</h4>
                <div className="space-y-2">
                  {ticket.items.map((item: TicketItem, index: number) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          {item.category && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parsed Data Debug (only in development) */}
          {process.env.NODE_ENV === 'development' && ticket.parsed_data && (
            <div className="space-y-2">
              <Separator />
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-muted-foreground">
                  Debug: Parsed Data
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(ticket.parsed_data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
