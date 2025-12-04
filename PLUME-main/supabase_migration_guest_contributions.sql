-- Create table for guest contributions
CREATE TABLE IF NOT EXISTS guest_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  guest_name TEXT,
  content TEXT, -- Text content or transcription
  media_url TEXT, -- For photos or audio
  contribution_type TEXT CHECK (contribution_type IN ('text', 'audio', 'photo')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE guest_contributions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for guests) - In a real app, we might want a token system
CREATE POLICY "Allow public insert to guest_contributions"
ON guest_contributions FOR INSERT
WITH CHECK (true);

-- Allow users to view contributions for their chapters
CREATE POLICY "Users can view contributions for their chapters"
ON guest_contributions FOR SELECT
USING (
  chapter_id IN (
    SELECT id FROM chapters WHERE user_id = auth.uid()
  )
);

-- Allow users to update status of contributions for their chapters
CREATE POLICY "Users can update contributions for their chapters"
ON guest_contributions FOR UPDATE
USING (
  chapter_id IN (
    SELECT id FROM chapters WHERE user_id = auth.uid()
  )
);
