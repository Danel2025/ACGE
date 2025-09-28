-- Créer une table de mapping CUID -> UUID pour la compatibilité
CREATE TABLE IF NOT EXISTS public.user_mappings (
    cuid TEXT PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(uuid)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_user_mappings_uuid ON public.user_mappings(uuid);

-- Permettre l'accès à la table pour le service role
GRANT ALL ON public.user_mappings TO service_role;

-- RLS désactivé pour cette table (accès uniquement via service role)
ALTER TABLE public.user_mappings ENABLE ROW LEVEL SECURITY;

-- Politique pour le service role uniquement
CREATE POLICY "Service role full access" ON public.user_mappings
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Commentaire sur la table
COMMENT ON TABLE public.user_mappings IS 'Mapping entre les IDs CUID de l''application et les UUIDs Supabase';
