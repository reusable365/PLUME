-- SEED DATA FOR TEST
-- Inserts 6 high-quality memories for user 'stephanecadario@gmail.com'

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID (assumes user exists)
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'stephanecadario@gmail.com' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found, skipping seed.';
        RETURN;
    END IF;

    -- 1. Noël avec Laurent
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'Noël avec Laurent',
        'draft',
        'C''était le 24 décembre 1998, une soirée glaciale mais chaleureuse à Strasbourg. Laurent était arrivé avec ses bras chargés de cadeaux mal emballés, riant de sa propre maladresse. Nous avions passé la soirée à refaire le monde autour d''une raclette interminable. Je me souviens de son pull rouge un peu ridicule qu''il portait fièrement. Il m''avait raconté ses projets de voyage en Amérique du Sud, les yeux brillants. C''est un souvenir précieux car c''était notre dernier Noël avant son départ.',
        NOW() - INTERVAL '5 days',
        NOW()
    );

    -- 2. L'été en Bretagne
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'Les remparts de Saint-Malo',
        'draft',
        'Août 2005. Le vent soufflait fort sur les remparts de Saint-Malo. Avec Sophie et Marc, nous avions décidé de faire le tour complet de la ville close à pied. L''odeur des crêpes se mêlait aux embruns. Nous avons fini la journée sur la plage du Sillon, à regarder les chars à voile. Marc a essayé d''en faire et a fini par chuter spectaculairement dans le sable, provoquant un fou rire général qui a duré de longues minutes. Une journée simple, parfaite.',
        NOW() - INTERVAL '4 days',
        NOW()
    );

    -- 3. Le Mariage de Sophie
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'Le mariage de Sophie',
        'draft',
        'Le 15 juin 2010. Le domaine de la Tour était magnifique sous le soleil de Provence. Sophie rayonnait dans sa robe blanche, un peu stressée mais tellement heureuse. Je me souviens de l''émotion de son père lors du discours, sa voix tremblait quand il évoquait son enfance. Nous avons dansé jusqu''à l''aube sur des tubes des années 80. C''était la célébration de l''amour, mais aussi de notre amitié qui dure depuis le lycée.',
        NOW() - INTERVAL '3 days',
        NOW()
    );

    -- 4. Mon premier Marathon
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        '42km de courage',
        'draft',
        'Paris, avril 2015. Je m''étais entraîné pendant six mois. Au départ sur les Champs-Élysées, j''avais la boule au ventre. Les 30 premiers kilomètres se sont bien passés, portés par la foule. Mais au 35ème, le "mur" m''a frappé. J''ai cru abandonner dix fois. C''est la pensée de Papa, qui m''avait toujours encouragé à me dépasser, qui m''a fait tenir. Passer la ligne d''arrivée avenue Foch a été une explosion de larmes et de fierté. J''avais mal partout, mais je me sentais invicible.',
        NOW() - INTERVAL '2 days',
        NOW()
    );

    -- 5. La recette de Mamie Rose
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'Dans la cuisine de Mamie Rose',
        'draft',
        'L''odeur de la vanille et du beurre noisette. C''est ça, le souvenir de Mamie Rose. Chaque mercredi, elle m''apprenait à faire ses fameuses madeleines. "Le secret, c''est de laisser reposer la pâte", disait-elle toujours en me tapotant la main. Elle portait toujours son tablier à fleurs bleues. La cuisine était petite, encombrée, mais c''était le centre du monde. Aujourd''hui, quand je fais des madeleines, je l''entends encore me corriger doucement.',
        NOW() - INTERVAL '1 day',
        NOW()
    );

    -- 6. Voyage au Japon
    INSERT INTO public.chapters (user_id, title, status, content, created_at, updated_at)
    VALUES (
        target_user_id,
        'Printemps à Tokyo',
        'draft',
        'Avril 2019. L''arrivée à Tokyo a été un choc sensoriel. Les néons, le monde, le bruit, et pourtant ce calme incroyable dans les parcs. Nous avons eu la chance immense de voir les cerisiers en pleine floraison (sakura) au parc Ueno. Les gens pique-niquaient sous les arbres, une pluie de pétales roses tombait à chaque brise. J''ai mangé mes meilleurs sushis dans un petit boui-boui de Tsukiji à 5h du matin. Une immersion totale dans une autre culture.',
        NOW(),
        NOW()
    );

END $$;
