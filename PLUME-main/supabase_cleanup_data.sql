-- ROBUST CLEANUP SCRIPT
-- Deletes data ONLY if the tables exist. Safe to run.

BEGIN;

-- 1. Photos (handled via profiles mostly, but checking table just in case)
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'photos') THEN 
        DELETE FROM public.photos; 
    END IF; 
END $$;

-- 2. Guest Feature
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guest_invites') THEN 
        DELETE FROM public.guest_invites; 
    END IF; 
END $$;
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guest_contributions') THEN 
        DELETE FROM public.guest_contributions; 
    END IF; 
END $$;

-- 3. Core Data
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entities') THEN 
        DELETE FROM public.entities; 
    END IF; 
END $$;
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chapters') THEN 
        DELETE FROM public.chapters; 
    END IF; 
END $$;
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN 
        DELETE FROM public.messages; 
    END IF; 
END $$;

-- 4. Life Universe
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'relationships') THEN 
        DELETE FROM public.relationships; 
    END IF; 
END $$;
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timeline_events') THEN 
        DELETE FROM public.timeline_events; 
    END IF; 
END $$;
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'life_periods') THEN 
        DELETE FROM public.life_periods; 
    END IF; 
END $$;

-- 5. User Profiles
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN 
        DELETE FROM public.profiles; 
    END IF; 
END $$;
-- Fallback for user_profiles if schema differs
DO $$ BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN 
        DELETE FROM public.user_profiles; 
    END IF; 
END $$;

COMMIT;
