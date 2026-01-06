
-- Exécutez ce script dans l'éditeur SQL de Supabase pour activer la période d'essai Famille
-- User ID identifié: eb77c6c7-6667-419e-a60d-7384b203be0b

INSERT INTO "public"."subscriptions" ("user_id", "plan_id", "status", "current_period_end", "is_lifetime")
VALUES (
    'eb77c6c7-6667-419e-a60d-7384b203be0b', 
    'family', 
    'active', 
    (NOW() + interval '15 days'), 
    false
)
ON CONFLICT ("user_id") 
DO UPDATE SET 
    "plan_id" = 'family',
    "status" = 'active',
    "current_period_end" = (NOW() + interval '15 days');
