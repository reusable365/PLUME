-- Add missing columns to guest_invites table to store souvenir context
ALTER TABLE public.guest_invites
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS context JSONB;

-- Update the secure function to allow updating these if needed (optional, mainly for initial insert)
-- No change needed for submit_guest_answer as it only updates status/answer.

-- Policy update not strictly needed if RLS allows INSERT/SELECT as before.
-- Just ensuring the columns exist.
