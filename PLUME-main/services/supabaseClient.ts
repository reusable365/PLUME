import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec variables d'environnement Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const getSupabaseKey = () => {
    // 1. Variable d'environnement Vite (Priorité haute)
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (envKey) return envKey;

    // 2. LocalStorage (Si l'utilisateur a surchargé la clé via l'UI)
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('plume_supabase_key');
        if (stored) return stored;
    }

    // 3. Erreur stricte si aucune clé n'est trouvée
    throw new Error(
        '🔴 VITE_SUPABASE_ANON_KEY manquante.\n\n' +
        'Créez un fichier .env.local à la racine du projet avec :\n' +
        'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
        'VITE_SUPABASE_ANON_KEY=your_anon_key_here\n' +
        'GEMINI_API_KEY=your_gemini_api_key_here'
    );
};

// Validation stricte de l'URL
if (!supabaseUrl) {
    throw new Error(
        '🔴 VITE_SUPABASE_URL manquante. Vérifiez votre fichier .env.local'
    );
}

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