-- COMPLETE MIGRATION FOR GUEST FEATURE
-- This script consolidates all previous versions (v1, v2, v3, v4).
-- It is safe to run even if you already ran some parts (it checks for existence).

-- 1. Create Base Table
CREATE TABLE IF NOT EXISTS public.guest_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  relation TEXT,
  question TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'sent',
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure All Columns Exist (Evolutions)
DO $$
BEGIN
    -- Add title (v2)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'guest_invites' AND column_name = 'title') THEN
        ALTER TABLE public.guest_invites ADD COLUMN title TEXT;
    END IF;
    -- Add context (v2)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'guest_invites' AND column_name = 'context') THEN
        ALTER TABLE public.guest_invites ADD COLUMN context JSONB;
    END IF;
    -- Add chapter_id (v3)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'guest_invites' AND column_name = 'chapter_id') THEN
        ALTER TABLE public.guest_invites ADD COLUMN chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Update Status Constraints (Evolution v4)
-- We drop and recreate the check to ensure it includes 'integrated'
ALTER TABLE public.guest_invites DROP CONSTRAINT IF EXISTS guest_invites_status_check;
ALTER TABLE public.guest_invites ADD CONSTRAINT guest_invites_status_check 
    CHECK (status IN ('sent', 'opened', 'answered', 'accepted', 'rejected', 'integrated'));

-- 4. Security Policies (RLS)
ALTER TABLE public.guest_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors can full access their invites" ON public.guest_invites;
CREATE POLICY "Authors can full access their invites"
  ON public.guest_invites
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read access" ON public.guest_invites;
CREATE POLICY "Public read access"
  ON public.guest_invites
  FOR SELECT
  USING (true);

-- 5. Secure Submission Function
CREATE OR REPLACE FUNCTION submit_guest_answer(_token TEXT, _answer TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.guest_invites
  SET status = 'answered', answer = _answer, updated_at = NOW()
  WHERE token = _token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_guest_answer TO anon, authenticated, service_role;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS guest_invites_token_idx ON public.guest_invites(token);
CREATE INDEX IF NOT EXISTS guest_invites_user_id_idx ON public.guest_invites(user_id);
CREATE INDEX IF NOT EXISTS guest_invites_chapter_id_idx ON public.guest_invites(chapter_id);

-- DONE.
