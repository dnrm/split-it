'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Plus, Check, AlertCircle, Upload, MessageSquare } from 'lucide-react';
import { GroupMember, ParsedExpense } from '@/types';
import { toast } from 'sonner';
import { TicketUpload } from '@/components/tickets/ticket-upload';

interface AddExpenseFormProps {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  currency: string;
}

export function AddExpenseForm({ groupId, members, currentUserId, currency }: AddExpenseFormProps) {
  const router = useRouter();
  
  // Debug logging
  console.log('AddExpenseForm - members received:', members);
  console.log('AddExpenseForm - currentUserId:', currentUserId);
  console.log('AddExpenseForm - groupId:', groupId);
  const [nlInput, setNlInput] = useState('');
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields after parsing
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [payerId, setPayerId] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [category, setCategory] = useState('');

  const handleParse = async () => {
    if (!nlInput.trim()) {
      toast.error('Please enter an expense description');
      return;
    }

    setLoading(true);
    try {
      const memberNames = members.map((m) => m.user?.name || '');
      
      const response = await fetch('/api/expenses/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: nlInput,
          groupMembers: memberNames,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse expense');
      }

      const data = await response.json();
      const parsed: ParsedExpense = data.parsed;

      setParsedExpense(parsed);
      setAmount(parsed.amount.toString());
      setDescription(parsed.description);
      setCategory(parsed.category || 'other');

      // Find payer by name
      const payer = members.find((m) => m.user?.name === parsed.payer);
      if (payer) {
        setPayerId(payer.user_id);
      }

      // Find participants by names
      const participantIds = members
        .filter((m) => parsed.participants.includes(m.user?.name || ''))
        .map((m) => m.user_id);
      setSelectedParticipants(participantIds);

      toast.success('Expense parsed! Review and confirm below.');
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Failed to parse expense. Try being more specific.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || !description || !payerId || selectedParticipants.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          amount: parseFloat(amount),
          description,
          payerId,
          participants: selectedParticipants,
          category,
          rawInput: nlInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create expense');
      }

      toast.success('Expense added successfully!');
      
      // Reset form
      setNlInput('');
      setParsedExpense(null);
      setAmount('');
      setDescription('');
      setPayerId('');
      setSelectedParticipants([]);
      setCategory('');
      
      router.refresh();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleTicketUploadComplete = (ticketId: string) => {
    router.push(`/dashboard/tickets/${ticketId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Expense
        </CardTitle>
        <CardDescription>
          Add expenses using natural language or upload a receipt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Receipt
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-6">
        {/* Natural Language Input */}
        <div className="space-y-3">
          <Label htmlFor="nl-input">Describe the expense</Label>
          <div className="flex gap-2">
            <Textarea
              id="nl-input"
              placeholder='e.g., "I paid $45 for dinner for everyone" or "Dani paid $60 for gas for Andrea and Richy"'
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              disabled={loading || saving}
              className="min-h-[80px]"
            />
          </div>
          <Button
            onClick={handleParse}
            disabled={loading || saving || !nlInput.trim()}
            className="w-full sm:w-auto rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? 'Parsing...' : 'Parse with AI'}
          </Button>
        </div>

        {/* Parsed Result / Manual Entry */}
        {(parsedExpense || nlInput === '') && (
          <div className="space-y-4 rounded-lg border p-4">
            {parsedExpense && (
              <div className="mb-4 flex items-center gap-2">
                {parsedExpense.confidence >= 0.7 ? (
                  <>
                    <Check className="h-4 w-4 text-chart-5" />
                    <span className="text-sm font-medium text-chart-5">High confidence</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-chart-4" />
                    <span className="text-sm font-medium text-chart-4">
                      Please review carefully
                    </span>
                  </>
                )}
                <Badge variant="outline" className="ml-auto">
                  {Math.round(parsedExpense.confidence * 100)}% confident
                </Badge>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer">Paid by</Label>
                <Select value={payerId} onValueChange={setPayerId} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payer" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => {
                      console.log('Rendering member in dropdown:', {
                        user_id: member.user_id,
                        user_name: member.user?.name,
                        display_name: member.user?.name || 'Unknown User',
                        is_current_user: member.user_id === currentUserId
                      });
                      return (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user?.name || 'Unknown User'}
                          {member.user_id === currentUserId && ' (You)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Split between</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => {
                  console.log('Rendering member in pills:', {
                    user_id: member.user_id,
                    user_name: member.user?.name,
                    display_name: member.user?.name || 'Unknown User',
                    is_current_user: member.user_id === currentUserId
                  });
                  return (
                    <Badge
                      key={member.user_id}
                      variant={selectedParticipants.includes(member.user_id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => !saving && handleToggleParticipant(member.user_id)}
                    >
                      {member.user?.name || 'Unknown User'}
                      {member.user_id === currentUserId && ' (You)'}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Click to select who should split this expense
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !amount || !payerId || selectedParticipants.length === 0}
              className="w-full rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
            >
              {saving ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        )}
          </TabsContent>
          
          <TabsContent value="upload" className="space-y-6">
            <TicketUpload
              groupId={groupId}
              onUploadComplete={handleTicketUploadComplete}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

