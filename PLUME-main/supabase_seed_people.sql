-- SEED DATA FOR ADDRESS BOOK TEST
-- Inserts stories with people AND populates the detected entities.

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'stephanecadario@gmail.com' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found, skipping seed.';
        RETURN;
    END IF;

    -- 1. Insert Stories (Chapters)
    
    -- Story 1: Seb
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'La finale 98 chez Seb',
        'draft',
        'On était tous chez Sébastien pour la finale. Seb avait peint son visage en bleu blanc rouge. Quand Petit a marqué le troisième but, on a sauté sur le canapé jusqu''à le casser. C''était la folie. Seb pleurait de joie en serrant Julie dans ses bras. Une nuit inoubliable.',
        NOW() - INTERVAL '10 days',
        NOW()
    );

    -- Story 2: Family
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'Dimanche en famille',
        'draft',
        'Le déjeuner dominical classique. Maman avait fait son rôti, Papa servait le vin. Ma soeur Claire racontait ses dernières aventures de dating, ce qui faisait lever les yeux au ciel à Lucas, mon petit frère. C''est bruyant, c''est chaotique, mais c''est ma famille.',
        NOW() - INTERVAL '11 days',
        NOW()
    );

    -- Story 3: Work
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'Promotion au bureau',
        'draft',
        'Isabelle m''a appelé dans son bureau avec un air sérieux. J''ai cru que j''allais être viré. En fait, elle voulait m''annoncer ma promotion ! En sortant, j''ai croisé Marc à la machine à café, il a tout de suite deviné à mon sourire. On a fêté ça le soir même.',
        NOW() - INTERVAL '12 days',
        NOW()
    );

    -- 2. Insert Person Entities (Simulating AI detection)
    
    -- Check if table exists first (Safety)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'person_entities') THEN
        
        -- Sébastien
        INSERT INTO public.person_entities (user_id, canonical_name, display_name, aliases, mention_count, confidence_score)
        VALUES (target_user_id, 'Sébastien', 'Seb', ARRAY['Seb'], 5, 0.95);

        -- Julie
        INSERT INTO public.person_entities (user_id, canonical_name, display_name, mention_count, confidence_score)
        VALUES (target_user_id, 'Julie', 'Julie', 3, 0.90);

        -- Claire
        INSERT INTO public.person_entities (user_id, canonical_name, display_name, mention_count, confidence_score, relationships)
        VALUES (target_user_id, 'Claire', 'Soeur', 8, 0.98, '{"type": "sister"}'::jsonb);

        -- Lucas
        INSERT INTO public.person_entities (user_id, canonical_name, display_name, mention_count, confidence_score, relationships)
        VALUES (target_user_id, 'Lucas', 'Petit frère', 4, 0.92, '{"type": "brother"}'::jsonb);

        -- Isabelle
         INSERT INTO public.person_entities (user_id, canonical_name, display_name, mention_count, confidence_score, relationships)
        VALUES (target_user_id, 'Isabelle', 'Isabelle', 2, 0.85, '{"type": "boss"}'::jsonb);

         -- Marc
         INSERT INTO public.person_entities (user_id, canonical_name, display_name, mention_count, confidence_score)
        VALUES (target_user_id, 'Marc', 'Marc', 3, 0.88);
        
    END IF;

END $$;
