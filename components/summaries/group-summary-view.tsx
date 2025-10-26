'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, FileText, TrendingUp, Receipt, DollarSign } from 'lucide-react';
import { ExpenseWithDetails, SummaryTone } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface GroupSummaryViewProps {
  expenses: ExpenseWithDetails[];
  groupName: string;
  groupId: string;
}

export function GroupSummaryView({ expenses, groupName }: GroupSummaryViewProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [tone, setTone] = useState<SummaryTone>('casual');

  const handleGenerate = async (selectedTone: SummaryTone) => {
    setLoading(true);
    setTone(selectedTone);
    try {
      const response = await fetch('/api/summaries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses,
          groupName,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      toast.success('Summary generated!');
    } catch (error) {
      console.error('Summary error:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  if (!expenses || expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No data to summarize</h3>
          <p className="text-center text-sm text-muted-foreground">
            Add some expenses first to generate an AI summary
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate basic stats
  const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const expenseCount = expenses.length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenseCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent / expenseCount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Summary
          </CardTitle>
          <CardDescription>
            Generate an intelligent summary of group expenses with different tones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!summary && !loading && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose a tone for your summary:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                  onClick={() => handleGenerate('formal')}
                  disabled={loading}
                >
                  Formal
                </Button>
                <Button
                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                  onClick={() => handleGenerate('casual')}
                  disabled={loading}
                >
                  Casual
                </Button>
                <Button
                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                  onClick={() => handleGenerate('sarcastic')}
                  disabled={loading}
                >
                  Sarcastic
                </Button>
                <Button
                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                  onClick={() => handleGenerate('roast')}
                  disabled={loading}
                >
                  🔥 Roast
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {summary && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {tone.charAt(0).toUpperCase() + tone.slice(1)} tone
                </Badge>
                <Button
                  className='rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary'
                  size="sm"
                  onClick={() => setSummary(null)}
                >
                  Generate New
                </Button>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {summary.summary}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Top Spender</p>
                  <p className="font-semibold">{summary.topSpender.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(summary.topSpender.amount)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Average per Person</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(summary.averagePerPerson)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              expenses.reduce((acc, exp) => {
                const cat = exp.category || 'other';
                acc[cat] = (acc[cat] || 0) + Number(exp.amount);
                return acc;
              }, {} as Record<string, number>)
            )
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="capitalize">{category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(amount / totalSpent) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-right font-semibold">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

