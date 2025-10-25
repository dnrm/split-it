'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Copy, TrendingUp, TrendingDown, MinusCircle } from 'lucide-react';
import { ExpenseWithDetails } from '@/types';
import { calculateBalances } from '@/lib/utils/balance-calculator';
import { optimizeSettlements } from '@/lib/utils/settlement-optimizer';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface BalanceViewProps {
  expenses: ExpenseWithDetails[];
  groupId: string;
  currency: string;
  currentUserId: string;
}

export function BalanceView({ expenses, currency, currentUserId }: BalanceViewProps) {
  const balances = useMemo(() => calculateBalances(expenses), [expenses]);
  const settlements = useMemo(() => optimizeSettlements(balances), [balances]);

  const currentUserBalance = balances.find((b) => b.userId === currentUserId);
  const userSettlements = settlements.filter(
    (s) => s.from === currentUserId || s.to === currentUserId
  );

  const handleCopyAmount = (amount: number) => {
    navigator.clipboard.writeText(amount.toFixed(2));
    toast.success('Amount copied to clipboard');
  };

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MinusCircle className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No expenses to calculate</h3>
          <p className="text-center text-sm text-muted-foreground">
            Add expenses to see balances and settlement suggestions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Your Balance */}
      {currentUserBalance && (
        <Card>
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
            <CardDescription>Your current standing in this group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-6 text-center">
              <p className="mb-2 text-sm text-muted-foreground">Net Balance</p>
              <p
                className={`text-4xl font-bold ${
                  currentUserBalance.balance > 0
                    ? 'text-green-600'
                    : currentUserBalance.balance < 0
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                }`}
              >
                {currentUserBalance.balance > 0 ? '+' : ''}
                {formatCurrency(currentUserBalance.balance, currency)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentUserBalance.balance > 0
                  ? 'You are owed this amount'
                  : currentUserBalance.balance < 0
                  ? 'You owe this amount'
                  : 'You are settled up'}
              </p>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Paid</p>
                  <p className="font-semibold">{formatCurrency(currentUserBalance.totalPaid, currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Owe</p>
                  <p className="font-semibold">{formatCurrency(currentUserBalance.totalOwed, currency)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Settlements */}
      {userSettlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Settlements</CardTitle>
            <CardDescription>Payments you need to make or receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userSettlements.map((settlement, index) => {
              const isDebtor = settlement.from === currentUserId;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {isDebtor ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isDebtor ? `Pay ${settlement.toName}` : `Receive from ${settlement.fromName}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isDebtor ? 'You owe' : 'You will receive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      {formatCurrency(settlement.amount, currency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyAmount(settlement.amount)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Member Balances */}
      <Card>
        <CardHeader>
          <CardTitle>All Balances</CardTitle>
          <CardDescription>Net balance for each member</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {balances.map((balance) => (
            <div
              key={balance.userId}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{balance.userName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {balance.userName}
                    {balance.userId === currentUserId && ' (You)'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Paid {formatCurrency(balance.totalPaid, currency)} · Owes{' '}
                    {formatCurrency(balance.totalOwed, currency)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={balance.balance === 0 ? 'outline' : 'default'}
                  className={
                    balance.balance > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : balance.balance < 0
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : ''
                  }
                >
                  {balance.balance > 0 ? '+' : ''}
                  {formatCurrency(balance.balance, currency)}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Optimized Settlements */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement Plan</CardTitle>
          <CardDescription>
            Optimized to minimize transactions ({settlements.length} payment
            {settlements.length !== 1 ? 's' : ''} needed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {settlements.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Everyone is settled up! 🎉</p>
            </div>
          ) : (
            settlements.map((settlement, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex flex-1 items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {settlement.fromName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{settlement.fromName}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {settlement.toName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{settlement.toName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {formatCurrency(settlement.amount, currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyAmount(settlement.amount)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

