-- Script pour renommer la colonne numerodossier vers numeroDossier (corriger la casse)
-- Date: 2025-09-23
-- Puisque la colonne existe en minuscules, on la renomme en camelCase

-- Afficher l'état actuel avant modification
SELECT 'État actuel AVANT correction:' as info;
SELECT
    column_name,
    data_type,
    is_nullable,
    CASE
        WHEN column_name = 'numerodossier' THEN '❌ À RENOMMER (minuscules)'
        ELSE '✅ OK'
    END as status
FROM information_schema.columns
WHERE table_name = 'folders'
ORDER BY ordinal_position;

-- Renommer la colonne
ALTER TABLE folders RENAME COLUMN numerodossier TO numeroDossier;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN folders.numeroDossier IS 'Numéro de dossier comptable généré automatiquement avec format DOSS-ACGE-YYYYXXX';

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_folders_numero_dossier ON folders(numeroDossier);

-- Afficher le résultat final
SELECT 'Résultat final APRÈS correction:' as info;
SELECT
    'folders' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name = 'numeroDossier' THEN '✅ COLONNE RENOMMÉE'
        ELSE '📋 COLONNE EXISTANTE'
    END as status
FROM information_schema.columns
WHERE table_name = 'folders'
ORDER BY ordinal_position;
