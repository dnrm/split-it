-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies and tables (in reverse dependency order)
-- Only drop if they exist to avoid errors
DO $$ 
BEGIN
    -- Drop policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view splits from their group expenses' AND tablename = 'expense_splits') THEN
        DROP POLICY IF EXISTS "Users can view splits from their group expenses" ON public.expense_splits;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group members can create expense splits' AND tablename = 'expense_splits') THEN
        DROP POLICY IF EXISTS "Group members can create expense splits" ON public.expense_splits;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Expense creators can update splits' AND tablename = 'expense_splits') THEN
        DROP POLICY IF EXISTS "Expense creators can update splits" ON public.expense_splits;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Expense creators can delete splits' AND tablename = 'expense_splits') THEN
        DROP POLICY IF EXISTS "Expense creators can delete splits" ON public.expense_splits;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view expenses from their groups' AND tablename = 'expenses') THEN
        DROP POLICY IF EXISTS "Users can view expenses from their groups" ON public.expenses;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group members can create expenses' AND tablename = 'expenses') THEN
        DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Expense creators can update their expenses' AND tablename = 'expenses') THEN
        DROP POLICY IF EXISTS "Expense creators can update their expenses" ON public.expenses;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Expense creators can delete their expenses' AND tablename = 'expenses') THEN
        DROP POLICY IF EXISTS "Expense creators can delete their expenses" ON public.expenses;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group members can view invitations' AND tablename = 'group_invitations') THEN
        DROP POLICY IF EXISTS "Group members can view invitations" ON public.group_invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group members can create invitations' AND tablename = 'group_invitations') THEN
        DROP POLICY IF EXISTS "Group members can create invitations" ON public.group_invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group creators can delete invitations' AND tablename = 'group_invitations') THEN
        DROP POLICY IF EXISTS "Group creators can delete invitations" ON public.group_invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view valid invitations for joining' AND tablename = 'group_invitations') THEN
        DROP POLICY IF EXISTS "Anyone can view valid invitations for joining" ON public.group_invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view members of their groups' AND tablename = 'group_members') THEN
        DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group creators can add members' AND tablename = 'group_members') THEN
        DROP POLICY IF EXISTS "Group creators can add members" ON public.group_members;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group creators and members themselves can remove members' AND tablename = 'group_members') THEN
        DROP POLICY IF EXISTS "Group creators and members themselves can remove members" ON public.group_members;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view groups they are members of' AND tablename = 'groups') THEN
        DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create groups' AND tablename = 'groups') THEN
        DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group creators can update their groups' AND tablename = 'groups') THEN
        DROP POLICY IF EXISTS "Group creators can update their groups" ON public.groups;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group creators can delete their groups' AND tablename = 'groups') THEN
        DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.groups;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'users') THEN
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'users') THEN
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'users') THEN
        DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    END IF;
END $$;

-- Drop tables (in reverse dependency order) - only if they exist
DROP TABLE IF EXISTS public.expense_splits CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.group_invitations CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop trigger first (depends on function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_group_member(UUID, UUID);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Groups table
CREATE TABLE public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Group members table
CREATE TABLE public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Group invitations table
CREATE TABLE public.group_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('single', 'multi')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  used_count INTEGER DEFAULT 0 NOT NULL
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT,
  raw_input TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Expense splits table
CREATE TABLE public.expense_splits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_invitations_code ON public.group_invitations(code);
CREATE INDEX idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX idx_expenses_payer_id ON public.expenses(payer_id);
CREATE INDEX idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON public.expense_splits(user_id);

-- Function to check if user is group member (prevents recursion)
-- Drop function if it exists first
DROP FUNCTION IF EXISTS public.is_group_member(UUID, UUID);

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow group members to view each other's basic info
CREATE POLICY "Group members can view each other's basic info" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = users.id
    )
  );

-- DISABLE RLS for groups table (hackathon project)
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- RLS Policies for groups table (DISABLED)
-- CREATE POLICY "Users can view groups they are members of" ON public.groups
--   FOR SELECT USING (is_group_member(id, auth.uid()) OR auth.uid() = created_by);

-- CREATE POLICY "Users can create groups" ON public.groups
--   FOR INSERT WITH CHECK (auth.uid() = created_by);

-- CREATE POLICY "Group creators can update their groups" ON public.groups
--   FOR UPDATE USING (auth.uid() = created_by);

-- CREATE POLICY "Group creators can delete their groups" ON public.groups
--   FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for group_members table
CREATE POLICY "Users can view members of their groups" ON public.group_members
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group creators can add members" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM public.groups WHERE id = group_id
    ) OR
    auth.uid() = user_id
  );

-- Allow users to add themselves as members (for group creation)
CREATE POLICY "Users can add themselves as members" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group creators and members themselves can remove members" ON public.group_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT created_by FROM public.groups WHERE id = group_id
    )
  );

-- RLS Policies for group_invitations table
CREATE POLICY "Group members can view invitations" ON public.group_invitations
  FOR SELECT USING (
    is_group_member(group_id, auth.uid()) OR
    auth.uid() IN (
      SELECT created_by FROM public.groups WHERE id = group_id
    )
  );

CREATE POLICY "Group members can create invitations" ON public.group_invitations
  FOR INSERT WITH CHECK (
    is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Group creators can delete invitations" ON public.group_invitations
  FOR DELETE USING (
    auth.uid() IN (
      SELECT created_by FROM public.groups WHERE id = group_id
    )
  );

CREATE POLICY "Anyone can view valid invitations for joining" ON public.group_invitations
  FOR SELECT USING (expires_at > NOW());

-- RLS Policies for expenses table
CREATE POLICY "Users can view expenses from their groups" ON public.expenses
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can create expenses" ON public.expenses
  FOR INSERT WITH CHECK (is_group_member(group_id, auth.uid()));

CREATE POLICY "Expense creators can update their expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = payer_id);

CREATE POLICY "Expense creators can delete their expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = payer_id);

-- RLS Policies for expense_splits table
CREATE POLICY "Users can view splits from their group expenses" ON public.expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_splits.expense_id
      AND is_group_member(e.group_id, auth.uid())
    )
  );

CREATE POLICY "Group members can create expense splits" ON public.expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_id
      AND is_group_member(e.group_id, auth.uid())
    )
  );

CREATE POLICY "Expense creators can update splits" ON public.expense_splits
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT payer_id FROM public.expenses WHERE id = expense_id
    )
  );

CREATE POLICY "Expense creators can delete splits" ON public.expense_splits
  FOR DELETE USING (
    auth.uid() IN (
      SELECT payer_id FROM public.expenses WHERE id = expense_id
    )
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically add group creator as member
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the group creator as a member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user names for existing users without names
CREATE OR REPLACE FUNCTION public.update_user_names()
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET name = split_part(email, '@', 1)
  WHERE name IS NULL OR TRIM(name) = '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add group creator as member
DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();

