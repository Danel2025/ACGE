-- Migration: Correction des permissions du schéma public
-- Date: 2025-01-01
-- Description: Donne les permissions nécessaires au service role sur le schéma public

-- Donner tous les privilèges au service role sur le schéma public
GRANT ALL ON SCHEMA public TO service_role;

-- Donner tous les privilèges sur toutes les tables existantes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Donner tous les privilèges sur toutes les séquences existantes
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Donner les privilèges sur les objets futurs
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Vérifier les permissions
DO $$
DECLARE
  table_name text;
  has_select boolean;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['users', 'folders', 'documents', 'notifications'])
  LOOP
    EXECUTE format('SELECT has_table_privilege(''service_role'', %L, ''SELECT'')', table_name) INTO has_select;
    RAISE NOTICE 'Table %: SELECT privilege = %', table_name, has_select;
  END LOOP;
END $$;
