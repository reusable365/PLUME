-- Migration pour ajouter le suivi du tutoriel d'onboarding

-- 1. Ajouter la colonne has_completed_tutorial à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT FALSE;

-- 2. Créer une fonction sécurisée pour mettre à jour ce statut
CREATE OR REPLACE FUNCTION public.mark_tutorial_complete()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET has_completed_tutorial = TRUE
  WHERE id = auth.uid();
END;
$$;
