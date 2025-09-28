-- Migration: Correction des permissions du service role
-- Date: 2025-01-01
-- Description: Donne les permissions nécessaires au service role pour contourner RLS

-- Donner tous les privilèges au service role sur toutes les tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Donner les privilèges sur les tables futures
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- S'assurer que le service role peut contourner RLS
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE folders FORCE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Créer une politique spéciale pour le service role (contourne RLS)
CREATE POLICY "Service role bypass RLS" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass RLS" ON folders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass RLS" ON documents
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role bypass RLS" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Vérifier que les politiques existent
DO $$
DECLARE
  table_name text;
  policy_count integer;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['users', 'folders', 'documents', 'notifications'])
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM pg_policies WHERE tablename = %L', table_name) INTO policy_count;
    RAISE NOTICE 'Table %: % politiques RLS', table_name, policy_count;
  END LOOP;
END $$;
