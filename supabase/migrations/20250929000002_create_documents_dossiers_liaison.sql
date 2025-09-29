-- Migration pour créer une table de liaison définitive entre documents et dossiers comptables
-- Date: 2025-09-29
-- Description: Architecture définitive avec table de liaison

-- Création de la table de liaison documents_dossiers_comptables
CREATE TABLE IF NOT EXISTS documents_dossiers_comptables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    dossier_comptable_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Contrainte unique pour éviter les doublons
    UNIQUE(document_id, dossier_comptable_id)
);

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_dossiers_document_id
ON documents_dossiers_comptables(document_id);

CREATE INDEX IF NOT EXISTS idx_documents_dossiers_dossier_id
ON documents_dossiers_comptables(dossier_comptable_id);

-- Activer RLS (Row Level Security)
ALTER TABLE documents_dossiers_comptables ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour permettre toutes les opérations aux utilisateurs authentifiés
CREATE POLICY "Allow all operations for authenticated users" ON documents_dossiers_comptables
    FOR ALL USING (true);

-- Commentaires pour documentation
COMMENT ON TABLE documents_dossiers_comptables IS 'Table de liaison entre documents et dossiers comptables';
COMMENT ON COLUMN documents_dossiers_comptables.document_id IS 'ID du document lié';
COMMENT ON COLUMN documents_dossiers_comptables.dossier_comptable_id IS 'ID du dossier comptable lié';

-- Fonction helper pour récupérer les documents d'un dossier comptable
CREATE OR REPLACE FUNCTION get_documents_by_dossier_comptable(dossier_id UUID)
RETURNS TABLE (
    document_id UUID,
    title TEXT,
    description TEXT,
    file_name TEXT,
    file_size BIGINT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    author_id TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.description,
        d.file_name,
        d.file_size,
        d.file_type,
        d.created_at,
        d.author_id
    FROM documents d
    INNER JOIN documents_dossiers_comptables ddc ON d.id = ddc.document_id
    WHERE ddc.dossier_comptable_id = dossier_id
    ORDER BY d.created_at DESC;
END;
$$;

-- Fonction helper pour lier un document à un dossier comptable
CREATE OR REPLACE FUNCTION link_document_to_dossier(doc_id UUID, dossier_id UUID)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
    liaison_id UUID;
BEGIN
    INSERT INTO documents_dossiers_comptables (document_id, dossier_comptable_id)
    VALUES (doc_id, dossier_id)
    ON CONFLICT (document_id, dossier_comptable_id) DO NOTHING
    RETURNING id INTO liaison_id;

    RETURN liaison_id;
END;
$$;

-- Migrer les données existantes
INSERT INTO documents_dossiers_comptables (document_id, dossier_comptable_id)
SELECT id, '9270988d-f17d-42f0-972d-44db343fcde0'
FROM documents
WHERE folder_id = '9270988d-f17d-42f0-972d-44db343fcde0'
ON CONFLICT (document_id, dossier_comptable_id) DO NOTHING;

-- Afficher le résultat
DO $$
DECLARE
    liaison_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO liaison_count
    FROM documents_dossiers_comptables
    WHERE dossier_comptable_id = '9270988d-f17d-42f0-972d-44db343fcde0';

    RAISE NOTICE 'Architecture définitive créée: % liaisons documents-dossier comptable', liaison_count;
END $$;