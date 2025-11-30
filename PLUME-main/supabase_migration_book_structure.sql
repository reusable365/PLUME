-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: book_structures
-- Description: Stocke les structures de livre générées par l'Architecte (IA)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.book_structures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  mode text NOT NULL CHECK (mode IN ('chronological', 'thematic', 'expert')),
  structure jsonb NOT NULL, -- Contient le tableau 'chapters' avec memoryIds, descriptions, etc.
  rationale text, -- L'explication de l'IA
  is_active boolean DEFAULT false, -- La structure actuellement utilisée pour l'affichage
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.book_structures IS 'Structures de livre générées par l''IA';
COMMENT ON COLUMN public.book_structures.structure IS 'JSON complet de la structure (chapitres, ordre, IDs des souvenirs)';

-- Index pour récupérer rapidement la structure active
CREATE INDEX IF NOT EXISTS idx_book_structures_user_active ON public.book_structures(user_id, is_active);

-- Politique de sécurité (RLS)
ALTER TABLE public.book_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own book structures"
  ON public.book_structures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own book structures"
  ON public.book_structures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book structures"
  ON public.book_structures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book structures"
  ON public.book_structures FOR DELETE
  USING (auth.uid() = user_id);
