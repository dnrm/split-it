'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  DollarSign,
  Package
} from 'lucide-react';
import { TicketClaimSummary, TicketClaimRequest } from '@/types';
import { toast } from 'sonner';

interface TicketClaimingProps {
  ticketId: string;
  currentUserId: string;
  groupMembers: Array<{ user_id: string; user: { name: string; id: string } }>;
  onClaimsUpdate?: () => void;
  className?: string;
}

export function TicketClaiming({ 
  ticketId, 
  currentUserId, 
  groupMembers, 
  onClaimsUpdate,
  className 
}: TicketClaimingProps) {
  const [claimSummary, setClaimSummary] = useState<TicketClaimSummary[]>([]);
  const [userClaims, setUserClaims] = useState<Map<string, { quantity: number; customAmount?: number }>>(new Map());
  const [advancedMode, setAdvancedMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tickets/${ticketId}/claims`);
      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }

      const data = await response.json();
      setClaimSummary(data.claimSummary || []);

    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err instanceof Error ? err.message : 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [ticketId]);

  const handleClaim = async (itemId: string, quantity: number, customAmount?: number) => {
    try {
      const claimRequest: TicketClaimRequest = {
        itemId,
        quantityClaimed: quantity,
        customAmount,
      };

      const response = await fetch(`/api/tickets/${ticketId}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to claim item');
      }

      const data = await response.json();
      toast.success(data.message);

      // Update local state
      setUserClaims(prev => {
        const newClaims = new Map(prev);
        if (quantity > 0) {
          newClaims.set(itemId, { quantity, customAmount });
        } else {
          newClaims.delete(itemId);
        }
        return newClaims;
      });

      // Refresh claims data
      fetchClaims();
      onClaimsUpdate?.();

    } catch (err) {
      console.error('Error claiming item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to claim item');
    }
  };

  const handleUnclaim = async (itemId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/claims?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unclaim item');
      }

      toast.success('Item unclaimed');

      // Update local state
      setUserClaims(prev => {
        const newClaims = new Map(prev);
        newClaims.delete(itemId);
        return newClaims;
      });

      // Refresh claims data
      fetchClaims();
      onClaimsUpdate?.();

    } catch (err) {
      console.error('Error unclaiming item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to unclaim item');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getClaimStatus = (item: TicketClaimSummary) => {
    if (item.is_fully_claimed) return 'fully-claimed';
    if (item.total_claimed > 0) return 'partially-claimed';
    return 'unclaimed';
  };

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'fully-claimed': return 'bg-green-100 text-green-800 border-green-200';
      case 'partially-claimed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Claim Items
            </CardTitle>
            <CardDescription>
              Select which items you want to claim from this receipt
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="advanced-mode" className="text-sm">Advanced</Label>
            <Switch
              id="advanced-mode"
              checked={advancedMode}
              onCheckedChange={setAdvancedMode}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {claimSummary.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No items found in this ticket</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {claimSummary.map((item) => {
              const status = getClaimStatus(item);
              const userClaim = userClaims.get(item.item_id);
              const isClaimed = userClaim && userClaim.quantity > 0;

              return (
                <div
                  key={item.item_id}
                  className={`p-4 border rounded-lg transition-colors ${
                    isClaimed ? 'bg-primary/5 border-primary' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.item_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(item.item_price)} each
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getClaimStatusColor(status)}`}
                        >
                          {status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(item.item_price * item.item_quantity)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.item_quantity} × {formatCurrency(item.item_price)}
                      </div>
                    </div>
                  </div>

                  {/* Simple Mode */}
                  {!advancedMode && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`claim-${item.item_id}`}
                          checked={isClaimed}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleClaim(item.item_id, item.remaining_quantity);
                            } else {
                              handleUnclaim(item.item_id);
                            }
                          }}
                        />
                        <Label htmlFor={`claim-${item.item_id}`} className="text-sm">
                          Claim {item.remaining_quantity} remaining
                        </Label>
                      </div>
                      {isClaimed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnclaim(item.item_id)}
                        >
                          Unclaim
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Advanced Mode */}
                  {advancedMode && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Quantity to claim:</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={item.remaining_quantity}
                            step="0.1"
                            value={userClaim?.quantity || 0}
                            onChange={(e) => {
                              const quantity = parseFloat(e.target.value) || 0;
                              setUserClaims(prev => {
                                const newClaims = new Map(prev);
                                if (quantity > 0) {
                                  newClaims.set(item.item_id, { 
                                    quantity, 
                                    customAmount: userClaim?.customAmount 
                                  });
                                } else {
                                  newClaims.delete(item.item_id);
                                }
                                return newClaims;
                              });
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            / {item.remaining_quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Custom amount (optional):</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={userClaim?.customAmount || ''}
                          onChange={(e) => {
                            const customAmount = parseFloat(e.target.value) || undefined;
                            setUserClaims(prev => {
                              const newClaims = new Map(prev);
                              const current = newClaims.get(item.item_id);
                              if (current) {
                                newClaims.set(item.item_id, { 
                                  ...current, 
                                  customAmount 
                                });
                              }
                              return newClaims;
                            });
                          }}
                          className="w-24"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleClaim(
                            item.item_id, 
                            userClaim?.quantity || 0,
                            userClaim?.customAmount
                          )}
                          disabled={!userClaim || userClaim.quantity <= 0}
                        >
                          {isClaimed ? 'Update Claim' : 'Claim'}
                        </Button>
                        {isClaimed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnclaim(item.item_id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Claim Status */}
                  {item.total_claimed > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-3 w-3" />
                        <span>
                          {item.total_claimed} of {item.item_quantity} claimed
                        </span>
                        {item.remaining_quantity > 0 && (
                          <span>({item.remaining_quantity} remaining)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {claimSummary.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Your Claims:</span>
              <span className="text-sm text-muted-foreground">
                {Array.from(userClaims.values()).reduce((sum, claim) => sum + claim.quantity, 0)} items
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total estimated cost: {formatCurrency(
                Array.from(userClaims.entries()).reduce((sum, [itemId, claim]) => {
                  const item = claimSummary.find(i => i.item_id === itemId);
                  if (!item) return sum;
                  return sum + (claim.customAmount || (claim.quantity * item.item_price));
                }, 0)
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
