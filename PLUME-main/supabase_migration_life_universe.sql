-- =====================================================
-- MIGRATION: Life Universe (Univers de Vie)
-- Fusionne Espace-Temps, Relations, Chronologie
-- =====================================================

-- 1. TABLE: PLACES (Lieux de vie)
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'home', 'work', 'school', 'travel', 'other'
    
    -- Géolocalisation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    country TEXT,
    city TEXT,
    address TEXT,
    
    -- Période
    period_start TEXT, -- Ex: "1990", "Enfance"
    period_end TEXT,   -- Ex: "1995", "Adolescence"
    
    -- Métadonnées
    memory_count INTEGER DEFAULT 0,
    photo_count INTEGER DEFAULT 0,
    importance_score INTEGER DEFAULT 0, -- Calculé par l'IA (0-100)
    
    -- IA
    ai_description TEXT, -- Ex: "Maison d'enfance, lieu de souvenirs heureux"
    ai_generated BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE: RELATIONSHIPS (Relations enrichies)
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    person_name TEXT NOT NULL,
    
    -- Type de relation
    relationship_type TEXT, -- 'family', 'friend', 'colleague', 'romantic', 'mentor', 'other'
    relationship_subtype TEXT, -- 'mother', 'best_friend', 'boss', etc.
    
    -- Contexte
    met_at_place_id UUID REFERENCES places(id),
    met_date TEXT, -- Ex: "1985", "Adolescence"
    met_context TEXT, -- Ex: "École primaire", "Voyage en Italie"
    
    -- Importance
    mention_count INTEGER DEFAULT 0,
    importance_score INTEGER DEFAULT 0, -- 0-100, calculé par l'IA
    
    -- IA
    ai_summary TEXT, -- Ex: "Meilleur ami d'enfance, partagé de nombreuses aventures"
    ai_personality_traits TEXT[], -- Ex: ["généreux", "drôle", "fidèle"]
    
    -- Métadonnées
    is_active BOOLEAN DEFAULT true, -- false si la personne n'est plus dans la vie de l'auteur
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, person_name)
);

-- 3. TABLE: TIMELINE_EVENTS (Événements chronologiques)
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Événement
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL, -- 'milestone', 'period', 'trip', 'meeting', 'move', 'other'
    
    -- Temporalité
    date_start TEXT NOT NULL, -- Ex: "1990-06-15", "Été 1990", "1990"
    date_end TEXT, -- Pour les périodes
    date_precision TEXT DEFAULT 'exact', -- 'exact', 'month', 'year', 'decade', 'fuzzy'
    
    -- Liens
    place_id UUID REFERENCES places(id),
    related_people UUID[], -- IDs de relationships
    related_chapters UUID[], -- IDs de chapters
    
    -- Importance
    importance_score INTEGER DEFAULT 0, -- 0-100
    
    -- IA
    ai_generated BOOLEAN DEFAULT false,
    ai_category TEXT, -- Ex: "Éducation", "Carrière", "Famille", "Voyage"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: LIFE_PERIODS (Périodes de vie)
CREATE TABLE IF NOT EXISTS life_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Période
    name TEXT NOT NULL, -- Ex: "Enfance à Paris", "Années universitaires"
    period_type TEXT, -- 'childhood', 'adolescence', 'young_adult', 'adult', 'custom'
    
    -- Temporalité
    start_year INTEGER,
    end_year INTEGER,
    start_age INTEGER,
    end_age INTEGER,
    
    -- Contexte
    main_place_id UUID REFERENCES places(id),
    description TEXT,
    
    -- Statistiques
    memory_count INTEGER DEFAULT 0,
    narrative_density INTEGER DEFAULT 0, -- 0-100, densité de souvenirs
    
    -- IA
    ai_summary TEXT, -- Ex: "Période formatrice marquée par l'école et les premières amitiés"
    ai_themes TEXT[], -- Ex: ["éducation", "famille", "découverte"]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE: PLACE_MEMORIES (Lien entre lieux et souvenirs)
CREATE TABLE IF NOT EXISTS place_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
    relevance_score INTEGER DEFAULT 50, -- 0-100, pertinence du lien
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(place_id, chapter_id)
);

-- 6. TABLE: RELATIONSHIP_MEMORIES (Lien entre personnes et souvenirs)
CREATE TABLE IF NOT EXISTS relationship_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
    interaction_type TEXT, -- 'mention', 'dialogue', 'shared_experience'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(relationship_id, chapter_id)
);

-- =====================================================
-- INDEXES pour performance
-- =====================================================

CREATE INDEX idx_places_user_id ON places(user_id);
CREATE INDEX idx_places_type ON places(type);
CREATE INDEX idx_relationships_user_id ON relationships(user_id);
CREATE INDEX idx_relationships_importance ON relationships(importance_score DESC);
CREATE INDEX idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX idx_timeline_events_date ON timeline_events(date_start);
CREATE INDEX idx_life_periods_user_id ON life_periods(user_id);
CREATE INDEX idx_place_memories_place ON place_memories(place_id);
CREATE INDEX idx_place_memories_chapter ON place_memories(chapter_id);
CREATE INDEX idx_relationship_memories_relationship ON relationship_memories(relationship_id);
CREATE INDEX idx_relationship_memories_chapter ON relationship_memories(chapter_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_memories ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users manage their places" ON places FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their relationships" ON relationships FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their timeline events" ON timeline_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage their life periods" ON life_periods FOR ALL USING (auth.uid() = user_id);

-- Policies for junction tables (via foreign keys)
CREATE POLICY "Users manage place memories" ON place_memories FOR ALL 
    USING (EXISTS (SELECT 1 FROM places WHERE places.id = place_memories.place_id AND places.user_id = auth.uid()));

CREATE POLICY "Users manage relationship memories" ON relationship_memories FOR ALL 
    USING (EXISTS (SELECT 1 FROM relationships WHERE relationships.id = relationship_memories.relationship_id AND relationships.user_id = auth.uid()));

-- =====================================================
-- TRIGGERS pour auto-update
-- =====================================================

-- Trigger: Update updated_at on modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_life_periods_updated_at BEFORE UPDATE ON life_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS utilitaires
-- =====================================================

-- Function: Calculer le score d'importance d'un lieu
CREATE OR REPLACE FUNCTION calculate_place_importance(place_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    mem_count INTEGER;
    photo_count INTEGER;
BEGIN
    SELECT memory_count, photo_count INTO mem_count, photo_count
    FROM places WHERE id = place_uuid;
    
    -- Score basé sur nombre de souvenirs (max 50 points)
    score := LEAST(mem_count * 5, 50);
    
    -- Bonus photos (max 30 points)
    score := score + LEAST(photo_count * 3, 30);
    
    -- Bonus si lieu de type 'home' (20 points)
    IF (SELECT type FROM places WHERE id = place_uuid) = 'home' THEN
        score := score + 20;
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function: Calculer le score d'importance d'une relation
CREATE OR REPLACE FUNCTION calculate_relationship_importance(relationship_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    mentions INTEGER;
BEGIN
    SELECT mention_count INTO mentions
    FROM relationships WHERE id = relationship_uuid;
    
    -- Score basé sur mentions (max 70 points)
    score := LEAST(mentions * 7, 70);
    
    -- Bonus famille (30 points)
    IF (SELECT relationship_type FROM relationships WHERE id = relationship_uuid) = 'family' THEN
        score := score + 30;
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;
