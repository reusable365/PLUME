import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://tuezgyggesrebzfxeufr.supabase.co';

// Utilisation de la clé fournie directement comme valeur par défaut
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZXpneWdnZXNyZWJ6ZnhldWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTcxODcsImV4cCI6MjA3OTU5MzE4N30.cNUF9zyZLNMwLxp3XH-fD74pME5un656pj331L89rhk';

const getSupabaseKey = () => {
    // 1. Variable d'environnement (Priorité haute)
    const envKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
    if (envKey) return envKey;

    // 2. LocalStorage (Si l'utilisateur a surchargé la clé via l'UI)
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('plume_supabase_key');
        if (stored) return stored;
    }

    // 3. Clé par défaut (Celle fournie dans le screenshot)
    return defaultKey;
};

const supabaseKey = getSupabaseKey();

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper pour sauvegarder la clé depuis l'UI (toujours utile en cas de changement)
export const saveSupabaseKey = (key: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('plume_supabase_key', key);
        window.location.reload();
    }
};

/**
 * SQL SCHEMA FOR SUPABASE
 * Copiez et exécutez ce code dans l'éditeur SQL de Supabase pour configurer votre base de données.
 * 
 * -- === SCRIPT DE FONDATION COMPLET POUR PLUME ===
 * 
 * -- 1. Nettoyage initial (supprime les anciennes structures pour éviter les conflits)
 * DROP TABLE IF EXISTS public.profiles CASCADE;
 * DROP TABLE IF EXISTS public.messages CASCADE;
 * DROP TABLE IF EXISTS public.ideas CASCADE;
 * DROP TABLE IF EXISTS public.entities CASCADE;
 * DROP TABLE IF EXISTS public.chapters CASCADE;
 * DROP TABLE IF EXISTS public.media CASCADE;
 * 
 * -- 2. Création de toutes les tables avec la structure finale
 * CREATE TABLE public.profiles (
 *   id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   first_name text,
 *   last_name text,
 *   birth_date date,
 *   photos jsonb DEFAULT '[]'::jsonb,
 *   updated_at timestamptz DEFAULT now()
 * );
 * 
 * CREATE TABLE public.messages (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   role text NOT NULL,
 *   content jsonb NOT NULL,
 *   created_at timestamptz DEFAULT now()
 * );
 * 
 * CREATE TABLE public.ideas (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   title text,
 *   content text,
 *   tags text[],
 *   created_at timestamptz DEFAULT now()
 * );
 * 
 * CREATE TABLE public.entities (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   type text NOT NULL,
 *   value text NOT NULL,
 *   UNIQUE(user_id, type, value)
 * );
 * 
 * CREATE TABLE public.chapters (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   title text,
 *   content text,
 *   status text,
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now()
 * );
 * 
 * CREATE TABLE public.media (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   file_path text,
 *   caption text,
 *   created_at timestamptz DEFAULT now()
 * );
 * 
 * -- 3. Activation de la sécurité (RLS) sur toutes les tables
 * ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
 * 
 * -- 4. Création de toutes les politiques de sécurité
 * -- PROFILES
 * CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
 * -- MESSAGES
 * CREATE POLICY "Users can manage their own messages" ON public.messages FOR ALL USING (auth.uid() = user_id);
 * -- IDEAS
 * CREATE POLICY "Users can manage their own ideas" ON public.ideas FOR ALL USING (auth.uid() = user_id);
 * -- ENTITIES
 * CREATE POLICY "Users can manage their own entities" ON public.entities FOR ALL USING (auth.uid() = user_id);
 * -- CHAPTERS
 * CREATE POLICY "Users can manage their own chapters" ON public.chapters FOR ALL USING (auth.uid() = user_id);
 * -- MEDIA
 * CREATE POLICY "Users can manage their own media" ON public.media FOR ALL USING (auth.uid() = user_id);
 * 
 * -- 5. Trigger de création de profil
 * CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
 * BEGIN
 *   INSERT INTO public.profiles (id) VALUES (new.id);
 *   RETURN new;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * 
 * DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
 * CREATE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 * 
 * -- 6. Remplissage des profils pour les utilisateurs existants
 * INSERT INTO public.profiles (id)
 * SELECT id FROM auth.users
 * ON CONFLICT (id) DO NOTHING;
 */