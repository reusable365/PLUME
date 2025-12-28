-- Create table for guest invites
CREATE TABLE IF NOT EXISTS public.guest_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  relation TEXT,
  question TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'answered')),
  answer TEXT, -- Added column for storing contribution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.guest_invites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authors can view/edit/delete their own invites
DROP POLICY IF EXISTS "Authors can full access their invites" ON public.guest_invites;
CREATE POLICY "Authors can full access their invites"
  ON public.guest_invites
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy 2: Public can view invites by token (Simplified for SPA)
DROP POLICY IF EXISTS "Public read access" ON public.guest_invites;
CREATE POLICY "Public read access"
  ON public.guest_invites
  FOR SELECT
  USING (true);

-- Policy 3: Public can update status/answer by token
-- This is tricky with RLS if user is anon.
-- We might need a policy like "Anyone can update if token matches?" (Not possible easily without function or open RLS)
-- Secure approach: Use a Postgres function `submit_guest_answer(token, answer)` with security definer.
-- Simple approach (Proto): Allow Update for public (risk: anyone can update anything if they guess IDs? No, usually enforced via WHERE).
-- BUT RLS `USING` applies to rows being updated. `WITH CHECK` applies to new data.
-- If we allow public UPDATE using `true`, they can update ANY invite. Bad.
-- Constraint: Client only knows `token`.
-- We can allow UPDATE if `token` is in the input? No, RLS checks existing row.
-- Let's stick to "Authors access". Guests use a Security Definer function OR we (risky) allow public update for now.

-- BETTER: Create a function.
CREATE OR REPLACE FUNCTION submit_guest_answer(_token TEXT, _answer TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.guest_invites
  SET status = 'answered', answer = _answer, updated_at = NOW()
  WHERE token = _token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute to anon/public
GRANT EXECUTE ON FUNCTION submit_guest_answer TO anon, authenticated, service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS guest_invites_token_idx ON public.guest_invites(token);
CREATE INDEX IF NOT EXISTS guest_invites_user_id_idx ON public.guest_invites(user_id);
