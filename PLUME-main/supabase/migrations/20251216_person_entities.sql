-- =========================================
-- PLUME - Entity Resolution System
-- Table: person_entities
-- =========================================
-- This table stores information about people mentioned in memories
-- and their various aliases (nicknames, formal names, relationships)

CREATE TABLE IF NOT EXISTS person_entities (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core Identity
    canonical_name TEXT NOT NULL,           -- Main name: "Caroline Cadario"
    display_name TEXT,                      -- Preferred display: "Caroline"
    
    -- Aliases (all ways this person is referred to)
    aliases JSONB DEFAULT '[]'::jsonb,      -- ["Caro", "mi amore", "mon amoureuse", "darling", "chérie"]
    
    -- Metadata
    gender TEXT,                            -- "female", "male", "other", null
    birth_date DATE,                        -- Optional
    
    -- Relationships (for contextual resolution)
    relationships JSONB DEFAULT '{}'::jsonb, -- {"spouse_of": "Stéphane", "mother_of": ["Tom", "Mathis", "Lou", "Charlie"], ...}
    
    -- Confidence & Tracking
    confidence_score NUMERIC(3,2) DEFAULT 0.80 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    first_mentioned_in_message_id UUID,     -- First message where this person was mentioned
    mention_count INTEGER DEFAULT 1,        -- How many times mentioned
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- Indexes for Performance
-- =========================================

-- User lookup (most common query)
CREATE INDEX idx_person_entities_user 
ON person_entities(user_id);

-- Canonical name lookup (for matching)
CREATE INDEX idx_person_entities_canonical 
ON person_entities(user_id, canonical_name);

-- Alias search (using GIN for JSONB)
CREATE INDEX idx_person_entities_aliases 
ON person_entities USING GIN (aliases);

-- =========================================
-- Row Level Security (RLS)
-- =========================================

ALTER TABLE person_entities ENABLE ROW LEVEL SECURITY;

-- Users can only access their own entities
CREATE POLICY "Users can view their own entities"
ON person_entities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entities"
ON person_entities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entities"
ON person_entities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entities"
ON person_entities FOR DELETE
USING (auth.uid() = user_id);

-- =========================================
-- Helper Functions
-- =========================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_person_entities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER set_person_entities_updated_at
BEFORE UPDATE ON person_entities
FOR EACH ROW
EXECUTE FUNCTION update_person_entities_updated_at();

-- =========================================
-- Function: Add Alias to Entity
-- =========================================

CREATE OR REPLACE FUNCTION add_alias_to_entity(
    entity_id UUID,
    new_alias TEXT
)
RETURNS void AS $$
BEGIN
    UPDATE person_entities
    SET 
        aliases = CASE
            WHEN aliases ? new_alias THEN aliases  -- Alias already exists
            ELSE aliases || jsonb_build_array(new_alias)  -- Add new alias
        END,
        mention_count = mention_count + 1,
        updated_at = NOW()
    WHERE id = entity_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- Function: Search Entities by Alias
-- =========================================

CREATE OR REPLACE FUNCTION search_entity_by_alias(
    p_user_id UUID,
    search_alias TEXT
)
RETURNS TABLE (
    entity_id UUID,
    canonical_name TEXT,
    all_aliases JSONB,
    match_confidence NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        person_entities.canonical_name,
        aliases,
        CASE
            WHEN lower(person_entities.canonical_name) = lower(search_alias) THEN 1.0
            WHEN aliases ? search_alias THEN 0.95
            WHEN lower(person_entities.canonical_name) LIKE '%' || lower(search_alias) || '%' THEN 0.7
            ELSE 0.5
        END as match_confidence
    FROM person_entities
    WHERE user_id = p_user_id
    AND (
        lower(canonical_name) = lower(search_alias)
        OR aliases ? search_alias
        OR lower(canonical_name) LIKE '%' || lower(search_alias) || '%'
    )
    ORDER BY match_confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- Sample Data (for testing)
-- =========================================

-- Example entity
/*
INSERT INTO person_entities (user_id, canonical_name, display_name, aliases, gender, relationships)
VALUES (
    auth.uid(),
    'Caroline Cadario',
    'Caroline',
    '["Caro", "mon amoureuse", "mi amore", "chérie"]'::jsonb,
    'female',
    '{
        "spouse_of": "Stéphane Cadario",
        "mother_of": ["Tom", "Mathis", "Lou", "Charlie"],
        "daughter_of": ["Michel", "Françoise"]
    }'::jsonb
);
*/

-- =========================================
-- USAGE EXAMPLES
-- =========================================

-- 1. Add a new alias to an existing entity
-- SELECT add_alias_to_entity('entity-uuid-here', 'darling');

-- 2. Search for entities by alias
-- SELECT * FROM search_entity_by_alias(auth.uid(), 'Caro');

-- 3. Get all entities for a user
-- SELECT * FROM person_entities WHERE user_id = auth.uid();

-- 4. Get entity with most mentions
-- SELECT canonical_name, mention_count 
-- FROM person_entities 
-- WHERE user_id = auth.uid() 
-- ORDER BY mention_count DESC 
-- LIMIT 10;
