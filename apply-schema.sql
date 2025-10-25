-- Apply the RLS policy for group members to view each other's basic info
-- This allows group members to see each other's names and basic information

CREATE POLICY "Group members can view each other's basic info" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm2.user_id = users.id
    )
  );
