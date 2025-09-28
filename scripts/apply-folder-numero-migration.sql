-- ===========================================
-- MIGRATION: Ajout colonne numeroDossier à folders
-- ===========================================
-- Cette migration ajoute la colonne numeroDossier à la table folders
-- Date: 2025-09-23

-- 1. Ajouter la colonne numeroDossier
ALTER TABLE folders
ADD COLUMN IF NOT EXISTS numeroDossier TEXT UNIQUE;

-- 2. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_folders_numero_dossier ON folders(numeroDossier);

-- 3. Commentaire sur la colonne
COMMENT ON COLUMN folders.numeroDossier IS 'Numéro de dossier comptable généré automatiquement avec format DOSS-ACGE-YYYYXXX';

-- 4. Vérification de la structure
SELECT
    'folders' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'folders' AND column_name = 'numeroDossier'
ORDER BY ordinal_position;

-- ===========================================
-- FIN DE LA MIGRATION
-- ===========================================
