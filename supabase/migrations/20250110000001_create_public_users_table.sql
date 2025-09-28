-- Migration: Créer la table users dans le schéma public
-- Date: 2025-01-10
-- Description: Créer une table users avec les colonnes nécessaires pour l'application ACGE

-- Créer la table users dans le schéma public
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- CUID pour compatibilité avec l'application
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- Mot de passe hashé
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SECRETAIRE', 'CONTROLEUR_BUDGETAIRE', 'ORDONNATEUR', 'AGENT_COMPTABLE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Créer un index sur l'email pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Créer un index sur le rôle pour les filtres
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Permettre l'accès à la table pour le service role
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO postgres;

-- RLS désactivé pour cette table (accès uniquement via service role)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique pour le service role uniquement
CREATE POLICY "Service role full access" ON public.users
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Commentaire sur la table
COMMENT ON TABLE public.users IS 'Table des utilisateurs de l''application ACGE avec leurs rôles et permissions';
