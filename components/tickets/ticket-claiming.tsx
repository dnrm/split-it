'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Package,
  Settings
} from 'lucide-react';
import { TicketItemWithClaims, TicketClaimSummary, User } from '@/types';
import { toast } from 'sonner';

interface TicketClaimingProps {
  ticketId: string;
  items: TicketItemWithClaims[];
  currentUser: User;
  onClaimUpdate?: () => void;
  className?: string;
}

export function TicketClaiming({ 
  ticketId, 
  items, 
  currentUser, 
  onClaimUpdate,
  className 
}: TicketClaimingProps) {
  const [claimMode, setClaimMode] = useState<'simple' | 'advanced'>('simple');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<Record<string, {
    quantity: number;
    customAmount?: number;
  }>>({});

  // Initialize claim data
  useEffect(() => {
    const initialData: Record<string, { quantity: number; customAmount?: number }> = {};
    
    items.forEach(item => {
      const userClaim = item.claims?.find(claim => claim.user_id === currentUser.id);
      if (userClaim) {
        initialData[item.id] = {
          quantity: userClaim.quantity_claimed,
          customAmount: userClaim.custom_amount,
        };
      } else {
        initialData[item.id] = {
          quantity: 0,
          customAmount: undefined,
        };
      }
    });
    
    setClaimData(initialData);
  }, [items, currentUser.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getClaimStatus = (item: TicketItemWithClaims) => {
    if (item.is_fully_claimed) {
      return { status: 'claimed', color: 'bg-green-100 text-green-800' };
    } else if (item.total_claimed > 0) {
      return { status: 'partial', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'unclaimed', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleSimpleClaim = async (itemId: string, checked: boolean) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const quantity = checked ? item.remaining_quantity : 0;
    await updateClaim(itemId, quantity);
  };

  const handleAdvancedClaim = async (itemId: string) => {
    await updateClaim(itemId, claimData[itemId]?.quantity || 0, claimData[itemId]?.customAmount);
  };

  const updateClaim = async (itemId: string, quantity: number, customAmount?: number) => {
    setClaiming(itemId);
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          quantityClaimed: quantity,
          customAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update claim');
      }

      toast.success('Claim updated successfully');
      
      // Update local state
      setClaimData(prev => ({
        ...prev,
        [itemId]: { quantity, customAmount },
      }));

      onClaimUpdate?.();

    } catch (error) {
      console.error('Error updating claim:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update claim');
    } finally {
      setClaiming(null);
    }
  };

  const removeClaim = async (itemId: string) => {
    setClaiming(itemId);
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}/claims?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove claim');
      }

      toast.success('Claim removed');
      
      // Update local state
      setClaimData(prev => ({
        ...prev,
        [itemId]: { quantity: 0, customAmount: undefined },
      }));

      onClaimUpdate?.();

    } catch (error) {
      console.error('Error removing claim:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove claim');
    } finally {
      setClaiming(null);
    }
  };

  const getClaimedBy = (item: TicketItemWithClaims) => {
    if (!item.claims || item.claims.length === 0) return [];
    
    return item.claims.map(claim => ({
      user: claim.user || { name: 'Unknown User' },
      quantity: claim.quantity_claimed,
      amount: claim.custom_amount || (claim.quantity_claimed * item.price),
    }));
  };

  const getTotalClaimed = () => {
    return items.reduce((total, item) => {
      const userClaim = item.claims?.find(claim => claim.user_id === currentUser.id);
      if (userClaim) {
        return total + (userClaim.custom_amount || (userClaim.quantity_claimed * item.price));
      }
      return total;
    }, 0);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Claim Items
              </CardTitle>
              <CardDescription>
                Select which items you want to claim and split the cost
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(getTotalClaimed())}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={claimMode} onValueChange={(value) => setClaimMode(value as 'simple' | 'advanced')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Simple
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4 mt-6">
              {items.map((item) => {
                const claimStatus = getClaimStatus(item);
                const userClaim = item.claims?.find(claim => claim.user_id === currentUser.id);
                const isClaimed = userClaim && userClaim.quantity_claimed > 0;
                const claimedBy = getClaimedBy(item);

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isClaimed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Checkbox
                            checked={isClaimed}
                            onCheckedChange={(checked) => 
                              handleSimpleClaim(item.id, checked as boolean)
                            }
                            disabled={claiming === item.id || item.remaining_quantity <= 0}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.name}</h4>
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
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Price: </span>
                            <span className="font-medium">
                              {formatCurrency(item.price)} each
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                            <Badge className={claimStatus.color}>
                              {claimStatus.status === 'claimed' ? 'Fully Claimed' :
                               claimStatus.status === 'partial' ? 'Partially Claimed' : 'Unclaimed'}
                            </Badge>
                          </div>
                        </div>

                        {/* Claimed by section */}
                        {claimedBy.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Claimed by:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {claimedBy.map((claim, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-sm bg-white px-2 py-1 rounded border"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={(claim.user as any)?.avatar_url} />
                                    <AvatarFallback>
                                      {claim.user.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{claim.user.name}</span>
                                  <span className="text-muted-foreground">
                                    ({claim.quantity}x)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-6">
              {items.map((item) => {
                const claimStatus = getClaimStatus(item);
                const userClaim = item.claims?.find(claim => claim.user_id === currentUser.id);
                const claimedBy = getClaimedBy(item);

                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Available: {item.remaining_quantity}</span>
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
                          <p className="font-bold text-lg">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <Badge className={claimStatus.color}>
                            {claimStatus.status === 'claimed' ? 'Fully Claimed' :
                             claimStatus.status === 'partial' ? 'Partially Claimed' : 'Unclaimed'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`quantity-${item.id}`}>
                            Quantity to Claim (max: {item.remaining_quantity})
                          </Label>
                          <div className="flex items-center gap-3 mt-1">
                            <Slider
                              id={`quantity-${item.id}`}
                              min={0}
                              max={item.remaining_quantity}
                              step={0.1}
                              value={[claimData[item.id]?.quantity || 0]}
                              onValueChange={([value]) => 
                                setClaimData(prev => ({
                                  ...prev,
                                  [item.id]: { 
                                    ...prev[item.id], 
                                    quantity: value 
                                  }
                                }))
                              }
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={item.remaining_quantity}
                              step={0.1}
                              value={claimData[item.id]?.quantity || 0}
                              onChange={(e) => 
                                setClaimData(prev => ({
                                  ...prev,
                                  [item.id]: { 
                                    ...prev[item.id], 
                                    quantity: parseFloat(e.target.value) || 0 
                                  }
                                }))
                              }
                              className="w-20"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`custom-${item.id}`}>
                            Custom Amount (optional)
                          </Label>
                          <Input
                            id={`custom-${item.id}`}
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="Leave empty for automatic calculation"
                            value={claimData[item.id]?.customAmount || ''}
                            onChange={(e) => 
                              setClaimData(prev => ({
                                ...prev,
                                [item.id]: { 
                                  ...prev[item.id], 
                                  customAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                                }
                              }))
                            }
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Auto: {formatCurrency((claimData[item.id]?.quantity || 0) * item.price)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAdvancedClaim(item.id)}
                            disabled={claiming === item.id || (claimData[item.id]?.quantity || 0) <= 0}
                            size="sm"
                          >
                            {claiming === item.id ? 'Updating...' : 
                             userClaim ? 'Update Claim' : 'Claim Items'}
                          </Button>
                          
                          {userClaim && (
                            <Button
                              variant="outline"
                              onClick={() => removeClaim(item.id)}
                              disabled={claiming === item.id}
                              size="sm"
                            >
                              Remove Claim
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Claimed by section */}
                      {claimedBy.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Claimed by:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {claimedBy.map((claim, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm bg-muted px-2 py-1 rounded"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={(claim.user as any)?.avatar_url} />
                                  <AvatarFallback>
                                    {claim.user.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{claim.user.name}</span>
                                <span className="text-muted-foreground">
                                  ({claim.quantity}x - {formatCurrency(claim.amount)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
