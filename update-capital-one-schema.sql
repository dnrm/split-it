-- Add Capital One account ID to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS capital_one_account_id TEXT;

-- Create transactions table for tracking transfers
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  settlement_from UUID REFERENCES auth.users(id) NOT NULL,
  settlement_to UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  transfer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON public.transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_settlement_from ON public.transactions(settlement_from);
CREATE INDEX IF NOT EXISTS idx_transactions_settlement_to ON public.transactions(settlement_to);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON public.transactions(transfer_id);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions table
-- Users can view transactions from their groups
CREATE POLICY "Users can view transactions from their groups" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = transactions.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Group members can create transactions
CREATE POLICY "Group members can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = transactions.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can update transactions they are involved in
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (
    auth.uid() = settlement_from OR auth.uid() = settlement_to
  );

