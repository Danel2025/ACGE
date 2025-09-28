-- Script SIMPLE pour renommer numerodossier vers numeroDossier
-- Date: 2025-09-23

-- Vérifier l'état actuel
SELECT 'AVANT:' as status;
SELECT column_name FROM information_schema.columns
WHERE table_name = 'folders' AND column_name = 'numerodossier';

-- Renommer la colonne
ALTER TABLE folders RENAME COLUMN numerodossier TO numeroDossier;

-- Ajouter un commentaire
COMMENT ON COLUMN folders.numeroDossier IS 'Numéro de dossier comptable généré automatiquement avec format DOSS-ACGE-YYYYXXX';

-- Vérifier le résultat
SELECT 'APRÈS:' as status;
SELECT column_name FROM information_schema.columns
WHERE table_name = 'folders' AND column_name = 'numeroDossier';
