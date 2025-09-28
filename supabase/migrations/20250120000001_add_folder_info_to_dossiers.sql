-- Migration pour nettoyer les références à la table folders supprimée
-- Date: 2025-01-20 (Modifiée)
-- Description: Supprime les colonnes folderId et folderName qui référençaient la table folders supprimée

-- Supprimer les colonnes folderId et folderName qui ne sont plus nécessaires
-- Car la table folders a été supprimée et n'existe plus
DO $$
BEGIN
    -- Supprimer l'index s'il existe
    DROP INDEX IF EXISTS idx_dossiers_folder_id;

    -- Supprimer les colonnes si elles existent
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dossiers'
        AND column_name = 'folderid'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE dossiers DROP COLUMN IF EXISTS folderId;
        RAISE NOTICE 'Colonne folderId supprimée de la table dossiers';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dossiers'
        AND column_name = 'foldername'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE dossiers DROP COLUMN IF EXISTS folderName;
        RAISE NOTICE 'Colonne folderName supprimée de la table dossiers';
    END IF;
END $$;
