-- Ticket Vision Parser Schema Migration
-- Add new tables for shared ticket functionality

-- Create shared_tickets table
CREATE TABLE public.shared_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  image_url TEXT NOT NULL,
  merchant_name TEXT,
  total_amount NUMERIC(10, 2),
  parsed_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('processing', 'ready', 'finalized', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create ticket_items table
CREATE TABLE public.ticket_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES public.shared_tickets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  category TEXT,
  line_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create ticket_item_claims table
CREATE TABLE public.ticket_item_claims (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.ticket_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  quantity_claimed NUMERIC(10, 2) NOT NULL CHECK (quantity_claimed > 0),
  custom_amount NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(item_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_shared_tickets_group_id ON public.shared_tickets(group_id);
CREATE INDEX idx_shared_tickets_uploaded_by ON public.shared_tickets(uploaded_by);
CREATE INDEX idx_shared_tickets_status ON public.shared_tickets(status);
CREATE INDEX idx_ticket_items_ticket_id ON public.ticket_items(ticket_id);
CREATE INDEX idx_ticket_item_claims_item_id ON public.ticket_item_claims(item_id);
CREATE INDEX idx_ticket_item_claims_user_id ON public.ticket_item_claims(user_id);

-- Enable Row Level Security
ALTER TABLE public.shared_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_item_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_tickets table
CREATE POLICY "Group members can view tickets from their groups" ON public.shared_tickets
  FOR SELECT USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Group members can create tickets" ON public.shared_tickets
  FOR INSERT WITH CHECK (is_group_member(group_id, auth.uid()));

CREATE POLICY "Ticket uploaders can update their tickets" ON public.shared_tickets
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Ticket uploaders can delete their tickets" ON public.shared_tickets
  FOR DELETE USING (auth.uid() = uploaded_by);

-- RLS Policies for ticket_items table
CREATE POLICY "Group members can view items from their group tickets" ON public.ticket_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shared_tickets st
      WHERE st.id = ticket_items.ticket_id
      AND is_group_member(st.group_id, auth.uid())
    )
  );

CREATE POLICY "Group members can create ticket items" ON public.ticket_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_tickets st
      WHERE st.id = ticket_id
      AND is_group_member(st.group_id, auth.uid())
    )
  );

CREATE POLICY "Group members can update ticket items" ON public.ticket_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shared_tickets st
      WHERE st.id = ticket_items.ticket_id
      AND is_group_member(st.group_id, auth.uid())
    )
  );

CREATE POLICY "Group members can delete ticket items" ON public.ticket_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shared_tickets st
      WHERE st.id = ticket_items.ticket_id
      AND is_group_member(st.group_id, auth.uid())
    )
  );

-- RLS Policies for ticket_item_claims table
CREATE POLICY "Group members can view claims from their group tickets" ON public.ticket_item_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ticket_items ti
      JOIN public.shared_tickets st ON ti.ticket_id = st.id
      WHERE ti.id = ticket_item_claims.item_id
      AND is_group_member(st.group_id, auth.uid())
    )
  );

CREATE POLICY "Group members can create claims" ON public.ticket_item_claims
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ticket_items ti
      JOIN public.shared_tickets st ON ti.ticket_id = st.id
      WHERE ti.id = item_id
      AND is_group_member(st.group_id, auth.uid())
    )
  );

CREATE POLICY "Users can update their own claims" ON public.ticket_item_claims
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claims" ON public.ticket_item_claims
  FOR DELETE USING (auth.uid() = user_id);

-- Function to check if all items in a ticket are claimed
CREATE OR REPLACE FUNCTION public.get_ticket_claim_summary(p_ticket_id UUID)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  item_price NUMERIC,
  item_quantity NUMERIC,
  total_claimed NUMERIC,
  remaining_quantity NUMERIC,
  is_fully_claimed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.id,
    ti.name,
    ti.price,
    ti.quantity::NUMERIC,
    COALESCE(SUM(tic.quantity_claimed), 0) as total_claimed,
    (ti.quantity::NUMERIC - COALESCE(SUM(tic.quantity_claimed), 0)) as remaining_quantity,
    (ti.quantity::NUMERIC <= COALESCE(SUM(tic.quantity_claimed), 0)) as is_fully_claimed
  FROM public.ticket_items ti
  LEFT JOIN public.ticket_item_claims tic ON ti.id = tic.item_id
  WHERE ti.ticket_id = p_ticket_id
  GROUP BY ti.id, ti.name, ti.price, ti.quantity
  ORDER BY ti.line_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user's total from claimed items
CREATE OR REPLACE FUNCTION public.get_user_ticket_total(p_ticket_id UUID, p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  user_total NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN tic.custom_amount IS NOT NULL THEN tic.custom_amount
      ELSE (tic.quantity_claimed * ti.price)
    END
  ), 0)
  INTO user_total
  FROM public.ticket_item_claims tic
  JOIN public.ticket_items ti ON tic.item_id = ti.id
  JOIN public.shared_tickets st ON ti.ticket_id = st.id
  WHERE st.id = p_ticket_id AND tic.user_id = p_user_id;
  
  RETURN user_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
