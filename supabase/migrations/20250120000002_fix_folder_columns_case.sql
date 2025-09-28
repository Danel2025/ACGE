-- Migration pour corriger la casse des colonnes folderId et folderName
-- Date: 2025-01-20
-- Description: Renomme folderName en foldername pour correspondre à la base de données

-- Renommer la colonne folderName en foldername
ALTER TABLE dossiers 
RENAME COLUMN "folderName" TO foldername;

-- Mettre à jour le commentaire
COMMENT ON COLUMN dossiers.foldername IS 'Nom du dossier parent pour affichage rapide';

