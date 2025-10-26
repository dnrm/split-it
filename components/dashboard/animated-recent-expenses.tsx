'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Expense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  group?: {
    name: string;
  };
  payer?: {
    name: string;
  };
}

interface AnimatedRecentExpensesProps {
  expenses: Expense[];
}

export function AnimatedRecentExpenses({ expenses }: AnimatedRecentExpensesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="mb-8 shadow-xs rounded-none bg-muted">
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Latest expenses across all groups</CardDescription>
        </CardHeader>
        <CardContent>
          {!expenses || expenses.length === 0 ? (
            <motion.div 
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Receipt className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium">No expenses yet</p>
              <p className="text-xs text-muted-foreground">Add your first expense to get started</p>
            </motion.div>
          ) : (
            <div className="space-y-3 bg-background">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.4 + (index * 0.1),
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    x: 4,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.group?.name} · Paid by {expense.payer?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(expense.amount))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(expense.created_at)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
