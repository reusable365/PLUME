-- ============================================================================
-- PLUME - Script de correction des warnings Supabase Linter
-- Date: 2024-12-24
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Ouvrez le SQL Editor dans votre dashboard Supabase
-- 2. Copiez-collez ce script
-- 3. Exécutez-le
-- ============================================================================

-- ============================================================================
-- PARTIE 1: SÉCURITÉ - Ajouter search_path aux fonctions
-- ============================================================================

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_person_entities_updated_at() SET search_path = public;

-- Note: Ces fonctions ont des paramètres, ajustez si nécessaire selon votre schéma
-- Vérifiez la signature exacte avec: \df public.add_alias_to_entity
ALTER FUNCTION public.add_alias_to_entity(uuid, text) SET search_path = public;
ALTER FUNCTION public.search_entity_by_alias(uuid, text) SET search_path = public;

-- ============================================================================
-- PARTIE 2: PERFORMANCE - Supprimer les policies dupliquées sur 'ideas'
-- ============================================================================

-- Supprime la policy dupliquée (garde "Users can manage their own ideas")
DROP POLICY IF EXISTS "Users can update their own ideas" ON public.ideas;

-- ============================================================================
-- PARTIE 3: PERFORMANCE - Recréer les RLS policies optimisées
-- ============================================================================

-- === TABLE: messages ===
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;
CREATE POLICY "Users can manage their own messages" ON public.messages
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- === TABLE: ideas ===
DROP POLICY IF EXISTS "Users can manage their own ideas" ON public.ideas;
CREATE POLICY "Users can manage their own ideas" ON public.ideas
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- === TABLE: entities ===
DROP POLICY IF EXISTS "Users can manage their own entities" ON public.entities;
CREATE POLICY "Users can manage their own entities" ON public.entities
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- === TABLE: chapters ===
DROP POLICY IF EXISTS "Users can manage their own chapters" ON public.chapters;
CREATE POLICY "Users can manage their own chapters" ON public.chapters
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- === TABLE: media ===
DROP POLICY IF EXISTS "Users can manage their own media" ON public.media;
CREATE POLICY "Users can manage their own media" ON public.media
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- === TABLE: writing_goals ===
DROP POLICY IF EXISTS "Users can manage their own writing goals" ON public.writing_goals;
CREATE POLICY "Users can manage their own writing goals" ON public.writing_goals
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- === TABLE: profiles ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- === TABLE: book_structures ===
DROP POLICY IF EXISTS "Users can manage their own book structures" ON public.book_structures;
CREATE POLICY "Users can manage their own book structures" ON public.book_structures
  FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- === TABLE: person_entities ===
DROP POLICY IF EXISTS "Users can view their own entities" ON public.person_entities;
CREATE POLICY "Users can view their own entities" ON public.person_entities
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own entities" ON public.person_entities;
CREATE POLICY "Users can insert their own entities" ON public.person_entities
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own entities" ON public.person_entities;
CREATE POLICY "Users can update their own entities" ON public.person_entities
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own entities" ON public.person_entities;
CREATE POLICY "Users can delete their own entities" ON public.person_entities
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- PARTIE 4: PERFORMANCE - Ajouter les index manquants sur Foreign Keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_book_structures_user_id 
  ON public.book_structures(user_id);

CREATE INDEX IF NOT EXISTS idx_ideas_souvenir_id 
  ON public.ideas(souvenir_id);

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Listez les policies pour vérifier:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Listez les fonctions avec leur search_path:
-- SELECT proname, proconfig FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- ============================================================================
-- RAPPEL: Actions manuelles dans le Dashboard Supabase
-- ============================================================================
-- 
-- 1. Activer "Leaked Password Protection":
--    Settings > Auth > Password Security > Enable Leaked Password Protection
--
-- ============================================================================
