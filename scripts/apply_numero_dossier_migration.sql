-- Script pour appliquer la migration numeroDossier si nécessaire
-- Date: 2025-09-23
-- Ce script vérifie et applique la migration pour ajouter la colonne numeroDossier

-- Vérifier quelles colonnes existent (toutes les variations de casse possibles)
SELECT
    'Vérification des colonnes existantes dans folders:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'folders'
    AND table_schema = 'public'
    AND column_name ILIKE '%numerodossier%'
ORDER BY ordinal_position;

-- Vérifier si la colonne existe déjà (toutes les variations)
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'folders'
            AND column_name = 'numeroDossier'
            AND table_schema = 'public'
        ) THEN '✅ Colonne numeroDossier (camelCase) existe déjà'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'folders'
            AND column_name = 'numerodossier'
            AND table_schema = 'public'
        ) THEN '✅ Colonne numerodossier (minuscules) existe déjà'
        ELSE '❌ Aucune colonne numeroDossier trouvée'
    END as status_check;

-- Ajouter la colonne si elle n'existe pas dans la bonne casse
DO $$
DECLARE
    numerodossier_exists BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'folders'
        AND column_name = 'numerodossier'
        AND table_schema = 'public'
    );
    numerodossier_camel_exists BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'folders'
        AND column_name = 'numeroDossier'
        AND table_schema = 'public'
    );
BEGIN
    IF numerodossier_exists AND NOT numerodossier_camel_exists THEN
        -- Renommer la colonne de minuscules vers camelCase
        ALTER TABLE folders RENAME COLUMN numerodossier TO numeroDossier;
        RAISE NOTICE '✅ Colonne renommée de numerodossier vers numeroDossier';
    ELSIF NOT numerodossier_exists AND NOT numerodossier_camel_exists THEN
        -- Ajouter la colonne en camelCase si elle n'existe pas du tout
        ALTER TABLE folders
        ADD COLUMN numeroDossier TEXT UNIQUE;
        RAISE NOTICE '✅ Colonne numeroDossier ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne numeroDossier existe déjà dans le bon format';
    END IF;

    -- Ajouter un commentaire sur la colonne
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'folders'
        AND column_name = 'numeroDossier'
        AND table_schema = 'public'
    ) THEN
        COMMENT ON COLUMN folders.numeroDossier IS 'Numéro de dossier comptable généré automatiquement avec format DOSS-ACGE-YYYYXXX';
    END IF;

    -- Créer un index si la colonne existe et que l'index n'existe pas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'folders'
        AND column_name = 'numeroDossier'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'folders'
        AND indexname = 'idx_folders_numero_dossier'
    ) THEN
        CREATE INDEX idx_folders_numero_dossier ON folders(numeroDossier);
        RAISE NOTICE '✅ Index créé sur numeroDossier';
    END IF;
END $$;

-- Afficher la structure mise à jour de la table folders
SELECT
    'folders' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name = 'numeroDossier' THEN '✅ COLONNE AJOUTÉE'
        ELSE '📋 COLONNE EXISTANTE'
    END as status
FROM information_schema.columns
WHERE table_name = 'folders'
ORDER BY ordinal_position;
