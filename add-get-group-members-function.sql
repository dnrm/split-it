-- Function to get group members with their user data (bypasses RLS safely)
-- This function helps retrieve group member data safely
CREATE OR REPLACE FUNCTION public.get_group_members_with_accounts(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = p_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  -- Return all members of the group with their user data
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.name,
    u.email
  FROM public.group_members gm
  INNER JOIN public.users u ON u.id = gm.user_id
  WHERE gm.group_id = p_group_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_group_members_with_accounts(UUID) TO authenticated;

