-- Script d'initialisation pour la base de données GED
-- Ce script est exécuté automatiquement lors de la création du conteneur PostgreSQL

-- Créer des extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Configuration pour de meilleures performances
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Recharger la configuration
SELECT pg_reload_conf();
