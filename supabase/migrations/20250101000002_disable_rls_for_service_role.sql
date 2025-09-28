-- Migration: Désactivation de RLS pour le service role
-- Date: 2025-01-01
-- Description: Désactive RLS pour permettre au service role d'accéder aux tables

-- Désactiver RLS sur toutes les tables pour permettre l'accès du service role
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Vérifier que RLS est désactivé
DO $$
DECLARE
  table_name text;
  rls_enabled boolean;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['users', 'folders', 'documents', 'notifications'])
  LOOP
    EXECUTE format('SELECT relrowsecurity FROM pg_class WHERE relname = %L', table_name) INTO rls_enabled;
    RAISE NOTICE 'Table %: RLS = %', table_name, rls_enabled;
  END LOOP;
END $$;
