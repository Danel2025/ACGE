-- Migration pour ajouter définitivement la colonne dossier_comptable_id à la table documents
-- Date: 2025-09-29
-- Description: Liaison définitive entre documents et dossiers comptables

-- Étape 1: Ajouter la colonne dossier_comptable_id
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS dossier_comptable_id UUID;

-- Étape 2: Ajouter une contrainte de clé étrangère vers la table dossiers (avec vérification)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_documents_dossier_comptable'
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents
        ADD CONSTRAINT fk_documents_dossier_comptable
        FOREIGN KEY (dossier_comptable_id)
        REFERENCES dossiers(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Étape 3: Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_dossier_comptable_id
ON documents(dossier_comptable_id);

-- Étape 4: Migrer les données existantes depuis folder_id vers dossier_comptable_id
-- Pour le dossier comptable spécifique
UPDATE documents
SET dossier_comptable_id = folder_id
WHERE folder_id = '9270988d-f17d-42f0-972d-44db343fcde0'
AND dossier_comptable_id IS NULL;

-- Étape 5: Vider folder_id pour les documents qui ont été migrés
UPDATE documents
SET folder_id = NULL
WHERE dossier_comptable_id = '9270988d-f17d-42f0-972d-44db343fcde0'
AND folder_id = '9270988d-f17d-42f0-972d-44db343fcde0';

-- Étape 6: Ajouter un commentaire pour documentation
COMMENT ON COLUMN documents.dossier_comptable_id IS 'ID du dossier comptable auquel le document est associé';

-- Étape 7: Afficher le résultat de la migration
DO $$
DECLARE
    doc_count INTEGER;
BEGIN
    -- Compter les documents migrés
    SELECT COUNT(*) INTO doc_count
    FROM documents
    WHERE dossier_comptable_id = '9270988d-f17d-42f0-972d-44db343fcde0';

    RAISE NOTICE 'Migration terminée: % documents liés au dossier comptable 9270988d-f17d-42f0-972d-44db343fcde0', doc_count;
END $$;

-- Étape 8: Vérifier la structure finale
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name IN ('folder_id', 'dossier_comptable_id')
ORDER BY ordinal_position;