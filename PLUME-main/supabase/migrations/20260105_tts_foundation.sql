
-- 1. Table des voix disponibles
CREATE TABLE voices (
  id text PRIMARY KEY,
  provider text NOT NULL,        -- 'google', 'elevenlabs', 'openai'
  name text NOT NULL,
  language text DEFAULT 'fr-FR',
  gender text,                   -- 'male', 'female', 'neutral'
  preview_url text,
  is_premium boolean DEFAULT false
);

-- Données initiales des voix (Exemples)
INSERT INTO voices (id, provider, name, gender, is_premium) VALUES
('fr-FR-Neural2-A', 'google', 'Google - Femme (Standard)', 'female', false),
('fr-FR-Neural2-B', 'google', 'Google - Homme (Standard)', 'male', false),
('eleven_monolingual_v1_rachel', 'elevenlabs', 'Rachel (Premium)', 'female', true),
('eleven_monolingual_v1_josh', 'elevenlabs', 'Josh (Premium)', 'male', true);


-- 2. Cache Audio pour ne pas régénérer inutilement
CREATE TABLE audio_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  chapter_id uuid REFERENCES chapters, -- Optionnel, peut être lié à un souvenir spécifique
  content_hash text NOT NULL,          -- SHA256 du texte pour dédoublonner
  voice_id text REFERENCES voices,
  provider text NOT NULL,
  audio_url text,                      -- URL dans le Storage Bucket
  duration_seconds integer,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Index pour recherche rapide dans le cache
CREATE INDEX idx_audio_cache_lookup ON audio_cache(content_hash, voice_id);


-- 3. RLS
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les voix
CREATE POLICY "Public read voices" ON voices FOR SELECT USING (true);

-- Les utilisateurs peuvent voir/créer leur propre cache (ou public si on veut partager le cache commun ?)
-- Pour l'instant, cache privé par user pour simplifier RLS, mais idéalement cache global pour économie.
-- Faisons un cache global en lecture, mais insert auth.
CREATE POLICY "Public read audio_cache" ON audio_cache FOR SELECT USING (true);
CREATE POLICY "Users can insert audio_cache" ON audio_cache FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Storage Bucket 'audio'
-- (Note: Bucket creation usually done via API or Dashboard, but policies handled here)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true);

-- POLICY storage objects
-- CREATE POLICY "Public Access Audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
-- CREATE POLICY "Auth Upload Audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.uid() = owner);
