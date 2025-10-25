'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create a group');
        return;
      }

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          currency,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) {
        toast.error(groupError.message);
        return;
      }

      // Add creator as member (required for group to show members)
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      if (memberError) {
        console.error('Error adding creator as member:', memberError);
        // Don't fail the group creation - the database trigger should handle this
        console.warn('Manual member addition failed, but database trigger should add creator as member');
      }

      // Small delay to ensure database trigger completes
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Group created successfully!');
      router.push(`/dashboard/groups/${group.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/groups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
          <CardDescription>
            Create a group to start tracking shared expenses with friends or family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Weekend Trip, Roommates, Office Lunch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Choose a descriptive name for your expense group
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="MXN">MXN ($)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All expenses will be tracked in this currency
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/dashboard/groups">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

