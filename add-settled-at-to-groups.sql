-- Add settled_at column to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN public.groups.settled_at IS 'Timestamp when the group was marked as settled';

