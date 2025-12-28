-- Add chapter_id to guest_invites to link invites to specific souvenirs
ALTER TABLE public.guest_invites 
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS guest_invites_chapter_id_idx ON public.guest_invites(chapter_id);
