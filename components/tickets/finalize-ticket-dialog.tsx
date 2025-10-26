'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  summary: TicketFinalizationSummary | null;
  onFinalized?: () => void;
}

export function FinalizeTicketDialog({ 
  open, 
  onOpenChange, 
  ticketId, 
  summary,
  onFinalized 
}: FinalizeTicketDialogProps) {
  const [loading, setLoading] = useState(false);
  const [handleUnclaimedItems, setHandleUnclaimedItems] = useState<'split_equally' | 'assign_to_uploader' | 'skip'>('split_equally');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleFinalize = async () => {
    if (!summary) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handleUnclaimedItems }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to finalize ticket');
      }

      const data = await response.json();
      toast.success('Ticket finalized successfully!');
      
      onFinalized?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Error finalizing ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to finalize ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize Ticket</DialogTitle>
            <DialogDescription>
              Loading ticket summary...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalClaimed = summary.userTotals.reduce((sum, user) => sum + user.total, 0);
  const totalUnclaimed = summary.unclaimedItems.reduce((sum, item) => sum + item.amount, 0);
  const hasUnclaimedItems = summary.unclaimedItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Finalize Ticket
          </DialogTitle>
          <DialogDescription>
            Review the summary and create expenses for claimed items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ticket Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {summary.merchantName}
              </CardTitle>
              <CardDescription>
                Total: {formatCurrency(summary.totalAmount)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Claimed: {formatCurrency(totalClaimed)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>Unclaimed: {formatCurrency(totalUnclaimed)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expenses to Create</CardTitle>
              <CardDescription>
                Each person will be charged for their claimed items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.userTotals.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.items.length} item{user.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(user.total)}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.items.map(item => item.itemName).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unclaimed Items */}
          {hasUnclaimedItems && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Unclaimed Items
                </CardTitle>
                <CardDescription>
                  These items haven't been claimed by anyone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {summary.unclaimedItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">{item.itemName}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">What should we do with unclaimed items?</Label>
                  <RadioGroup
                    value={handleUnclaimedItems}
                    onValueChange={(value) => setHandleUnclaimedItems(value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="split_equally" id="split_equally" />
                      <Label htmlFor="split_equally" className="text-sm">
                        Split equally among all group members ({formatCurrency(totalUnclaimed / summary.userTotals.length)} each)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="assign_to_uploader" id="assign_to_uploader" />
                      <Label htmlFor="assign_to_uploader" className="text-sm">
                        Assign to the person who uploaded the receipt ({formatCurrency(totalUnclaimed)})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip" className="text-sm">
                        Skip unclaimed items (they won't be included in expenses)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning for no claims */}
          {summary.userTotals.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No items have been claimed yet. Please have group members claim their items before finalizing.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={loading || summary.userTotals.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Create Expenses
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
