-- Ajout de la colonne metadata à la table chapters pour permettre le filtrage
ALTER TABLE public.chapters 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.chapters.metadata IS 'Métadonnées du chapitre (dates, personnages, tags, photos)';
