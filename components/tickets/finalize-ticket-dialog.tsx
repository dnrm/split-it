'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Users, 
  Package,
  Loader2
} from 'lucide-react';
import { TicketFinalizationSummary } from '@/types';
import { toast } from 'sonner';

interface FinalizeTicketDialogProps {
  ticketId: string;
  onFinalized?: () => void;
  children: React.ReactNode;
}

export function FinalizeTicketDialog({ 
  ticketId, 
  onFinalized,
  children 
}: FinalizeTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<TicketFinalizationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [handleUnclaimedItems, setHandleUnclaimedItems] = useState<'split_equally' | 'assign_to_uploader' | 'skip'>('split_equally');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/finalize-summary`);
      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Failed to load finalization summary');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handleUnclaimedItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to finalize ticket');
      }

      toast.success('Ticket finalized successfully!');
      setOpen(false);
      onFinalized?.();

    } catch (error) {
      console.error('Error finalizing ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to finalize ticket');
    } finally {
      setFinalizing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTotalClaimed = () => {
    if (!summary) return 0;
    return summary.userTotals.reduce((total, user) => total + user.total, 0);
  };

  const getUnclaimedTotal = () => {
    if (!summary) return 0;
    return summary.unclaimedItems.reduce((total, item) => total + item.amount, 0);
  };

  useEffect(() => {
    if (open && !summary) {
      fetchSummary();
    }
  }, [open, summary]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Finalize Ticket
          </DialogTitle>
          <DialogDescription>
            Review the final split and create individual expenses for each person
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading summary...</span>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Ticket Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {summary.merchantName}
                </CardTitle>
                <CardDescription>
                  Total: {formatCurrency(summary.totalAmount)}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* User Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Totals
                </CardTitle>
                <CardDescription>
                  Amount each person will be charged
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.userTotals.map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{user.userName}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(user.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.items.length} item{user.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Unclaimed Items */}
            {summary.unclaimedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Unclaimed Items
                  </CardTitle>
                  <CardDescription>
                    {summary.unclaimedItems.length} item{summary.unclaimedItems.length !== 1 ? 's' : ''} worth {formatCurrency(getUnclaimedTotal())}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {summary.unclaimedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{item.itemName}</span>
                        <span className="text-sm font-medium">
                          {item.quantity}x {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Handle unclaimed items:</label>
                    <Select
                      value={handleUnclaimedItems}
                      onValueChange={(value: any) => setHandleUnclaimedItems(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="split_equally">
                          Split equally among all group members
                        </SelectItem>
                        <SelectItem value="assign_to_uploader">
                          Assign to ticket uploader
                        </SelectItem>
                        <SelectItem value="skip">
                          Skip unclaimed items
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(getTotalClaimed())}
                </p>
                <p className="text-sm text-muted-foreground">Claimed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(getUnclaimedTotal())}
                </p>
                <p className="text-sm text-muted-foreground">Unclaimed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalAmount)}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            {/* Warnings */}
            {summary.unclaimedItems.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {summary.unclaimedItems.length} item{summary.unclaimedItems.length !== 1 ? 's' : ''} 
                  {' '}remain unclaimed. Choose how to handle them above.
                </AlertDescription>
              </Alert>
            )}

            {getTotalClaimed() === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No items have been claimed yet. Please claim some items before finalizing.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Failed to load summary</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={finalizing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={finalizing || !summary || getTotalClaimed() === 0}
          >
            {finalizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              'Finalize & Create Expenses'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
