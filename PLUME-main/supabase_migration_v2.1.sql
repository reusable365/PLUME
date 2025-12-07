-- Migration V2.1: Idea Lifecycle & Verbatim Mode Support

-- 1. Update IDEAS table to support lifecycle (active -> converted)
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS souvenir_id uuid REFERENCES public.chapters(id);

-- 2. Update MESSAGES table just in case (though JSONB handles new fields fine, checking RLS)
-- No schema change needed for messages as 'content' is JSONB and supports 'isSynthesized'.

-- 3. Verify RLS Policies (Ensure updates are allowed)
-- Checks if policies exist, if not re-creates them (Idempotent approach)

DO $$ 
BEGIN
    -- Only creating if they don't exist to avoid errors
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ideas' AND policyname = 'Users can update their own ideas') THEN
        CREATE POLICY "Users can update their own ideas" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
