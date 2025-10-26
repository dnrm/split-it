'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Receipt, Trash2, Users } from 'lucide-react';
import { ExpenseWithDetails } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface ExpensesListProps {
  expenses: ExpenseWithDetails[];
  currentUserId: string;
  currency: string;
}

const categoryColors: Record<string, string> = {
  food: 'bg-chart-1/10 text-chart-1',
  transport: 'bg-chart-2/10 text-chart-2',
  accommodation: 'bg-chart-3/10 text-chart-3',
  entertainment: 'bg-chart-4/10 text-chart-4',
  utilities: 'bg-chart-5/10 text-chart-5',
  other: 'bg-muted text-muted-foreground',
};

export function ExpensesList({ expenses, currentUserId, currency }: ExpensesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);


  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId);
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      toast.success('Expense deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Receipt className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No expenses yet</h3>
          <p className="text-center text-sm text-muted-foreground">
            Add your first expense using the form above
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense History</CardTitle>
        <CardDescription>{expenses.length} total expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.map((expense) => {
          const isPayer = expense.payer_id === currentUserId;
          const userSplit = expense.splits?.find((s) => s.user_id === currentUserId);
          

          return (
            <div
              key={expense.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{expense.description}</h4>
                      {expense.category && (
                        <Badge
                          variant="secondary"
                          className={categoryColors[expense.category] || categoryColors.other}
                        >
                          {expense.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(expense.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {expense.payer?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    Paid by {expense.payer?.name}
                    {isPayer && ' (You)'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Split between {expense.splits?.length || 0} people</span>
                </div>
                
                {/* Show split details if available */}
                {expense.splits && expense.splits.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Split amounts: {expense.splits.map(split => 
                      `${split.user?.name || 'Unknown'}: ${formatCurrency(Number(split.amount), currency)}`
                    ).join(', ')}
                  </div>
                )}

                {userSplit && !isPayer && (
                  <div className="rounded-md bg-muted p-2 text-sm">
                    <span className="text-muted-foreground">Your share: </span>
                    <span className="font-semibold">{formatCurrency(Number(userSplit.amount), currency)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(Number(expense.amount), currency)}</p>
                </div>
                {isPayer && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                        size="icon"
                        disabled={deletingId === expense.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this expense and update all balances.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(expense.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

