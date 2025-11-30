-- ═══════════════════════════════════════════════════════════════════════════
-- 🪶 PLUME - SCHÉMA COMPLET DE BASE DE DONNÉES SUPABASE
-- ═══════════════════════════════════════════════════════════════════════════
-- Version: 2.0
-- Description: Script de création complète de la base de données pour PLUME
-- Utilisation: Exécutez ce script dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1: NETTOYAGE INITIAL
-- ═══════════════════════════════════════════════════════════════════════════
-- Supprime les anciennes structures pour éviter les conflits
-- ⚠️ ATTENTION: Cette opération supprime toutes les données existantes

DROP TABLE IF EXISTS public.writing_goals CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.chapters CASCADE;
DROP TABLE IF EXISTS public.entities CASCADE;
DROP TABLE IF EXISTS public.ideas CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Suppression des anciennes fonctions et triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 2: CRÉATION DES TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: profiles
-- Description: Profils utilisateurs avec informations personnelles
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  birth_date date,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec informations biographiques';
COMMENT ON COLUMN public.profiles.photos IS 'Tableau JSON de chemins vers les photos de profil';

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: messages
-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: ideas
-- Description: Coffre à idées pour stocker les inspirations
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.ideas IS 'Coffre à idées - Inspirations et notes des utilisateurs';
COMMENT ON COLUMN public.ideas.tags IS 'Tags pour catégoriser les idées';

CREATE INDEX idx_ideas_user_created ON public.ideas(user_id, created_at DESC);
CREATE INDEX idx_ideas_tags ON public.ideas USING GIN(tags);

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: entities
-- Description: Entités extraites (personnes, lieux, événements)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.entities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('person', 'place', 'event', 'date', 'theme', 'other')),
  value text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type, value)
);

COMMENT ON TABLE public.entities IS 'Entités extraites des conversations (personnes, lieux, événements)';
COMMENT ON COLUMN public.entities.type IS 'Type d''entité: person, place, event, date, theme, other';
COMMENT ON COLUMN public.entities.metadata IS 'Métadonnées additionnelles sur l''entité';

CREATE INDEX idx_entities_user_type ON public.entities(user_id, type);

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: chapters
-- Description: Chapitres du livre et espace de travail
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.chapters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'draft_workspace', 'published', 'archived')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.chapters IS 'Chapitres du livre et espace de travail (Atelier des Souvenirs)';
COMMENT ON COLUMN public.chapters.status IS 'Statut: draft, draft_workspace (Atelier), published, archived';
COMMENT ON COLUMN public.chapters.order_index IS 'Ordre d''affichage des chapitres';

CREATE INDEX idx_chapters_user_status ON public.chapters(user_id, status);
CREATE INDEX idx_chapters_user_order ON public.chapters(user_id, order_index);

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: media
-- Description: Fichiers médias (photos, audios, vidéos)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text CHECK (file_type IN ('image', 'audio', 'video', 'document')),
  caption text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.media IS 'Fichiers médias uploadés par les utilisateurs';
COMMENT ON COLUMN public.media.file_type IS 'Type de média: image, audio, video, document';
COMMENT ON COLUMN public.media.metadata IS 'Métadonnées du fichier (taille, dimensions, durée, etc.)';

CREATE INDEX idx_media_user_created ON public.media(user_id, created_at DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- TABLE: writing_goals
-- Description: Objectifs d'écriture quotidiens/hebdomadaires
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE public.writing_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type text NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  target_words integer NOT NULL DEFAULT 500,
  current_words integer DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.writing_goals IS 'Objectifs d''écriture pour suivre la progression';
COMMENT ON COLUMN public.writing_goals.goal_type IS 'Type d''objectif: daily, weekly, monthly';
COMMENT ON COLUMN public.writing_goals.target_words IS 'Nombre de mots cible';
COMMENT ON COLUMN public.writing_goals.current_words IS 'Progression actuelle en mots';

CREATE INDEX idx_writing_goals_user_date ON public.writing_goals(user_id, start_date DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 3: ACTIVATION DE LA SÉCURITÉ (ROW LEVEL SECURITY)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_goals ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 4: CRÉATION DES POLITIQUES DE SÉCURITÉ
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- PROFILES: Politiques granulaires
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ───────────────────────────────────────────────────────────────────────────
-- MESSAGES: Accès complet aux propres messages
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own messages" 
  ON public.messages FOR ALL 
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- IDEAS: Accès complet aux propres idées
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own ideas" 
  ON public.ideas FOR ALL 
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- ENTITIES: Accès complet aux propres entités
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own entities" 
  ON public.entities FOR ALL 
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- CHAPTERS: Accès complet aux propres chapitres
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own chapters" 
  ON public.chapters FOR ALL 
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- MEDIA: Accès complet aux propres médias
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own media" 
  ON public.media FOR ALL 
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- WRITING_GOALS: Accès complet aux propres objectifs
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own writing goals" 
  ON public.writing_goals FOR ALL 
  USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- BOOK_STRUCTURES: Accès complet aux propres structures
-- ───────────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own book structures" 
  ON public.book_structures FOR ALL 
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 5: TRIGGERS ET FONCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- Fonction: Création automatique du profil lors de l'inscription
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ───────────────────────────────────────────────────────────────────────────
-- Fonction: Mise à jour automatique de updated_at
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application du trigger sur les tables concernées
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_writing_goals_updated_at BEFORE UPDATE ON public.writing_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 6: RÉPARATION DES DONNÉES EXISTANTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Création des profils pour les utilisateurs existants qui n'en ont pas
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 7: CONFIGURATION DU STORAGE (OPTIONNEL)
-- ═══════════════════════════════════════════════════════════════════════════

-- Création du bucket pour les médias (si pas déjà créé)
-- Note: Cette commande peut échouer si le bucket existe déjà, c'est normal
INSERT INTO storage.buckets (id, name, public)
VALUES ('plume-media', 'plume-media', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de storage: Les utilisateurs peuvent uploader leurs propres fichiers
CREATE POLICY "Users can upload their own media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'plume-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plume-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'plume-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ AVEC SUCCÈS
-- ═══════════════════════════════════════════════════════════════════════════
-- Votre base de données PLUME est maintenant prête à l'emploi !
-- 
-- Prochaines étapes:
-- 1. Vérifiez que toutes les tables sont créées dans l'onglet "Table Editor"
-- 2. Testez l'authentification dans votre application
-- 3. Configurez vos clés API dans les variables d'environnement
-- ═══════════════════════════════════════════════════════════════════════════
