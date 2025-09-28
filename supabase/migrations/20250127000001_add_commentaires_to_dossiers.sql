-- Migration pour ajouter la colonne commentaires à la table dossiers
-- Date: 2025-01-27
-- Description: Ajoute la colonne commentaires pour permettre aux secrétaires d'ajouter des notes aux dossiers

-- Ajouter la colonne commentaires à la table dossiers
ALTER TABLE dossiers 
ADD COLUMN IF NOT EXISTS commentaires TEXT;

-- Créer un index pour les performances sur la colonne commentaires
CREATE INDEX IF NOT EXISTS idx_dossiers_commentaires ON dossiers(commentaires);

-- Commentaire sur la nouvelle colonne
COMMENT ON COLUMN dossiers.commentaires IS 'Commentaires et notes ajoutés par la secrétaire sur le dossier';

-- Afficher la structure mise à jour de la table dossiers
SELECT 
    'dossiers' as table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dossiers' 
ORDER BY ordinal_position;
