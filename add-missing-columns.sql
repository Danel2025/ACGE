-- Script pour ajouter les colonnes manquantes à la table dossiers
-- Basé sur les erreurs observées dans les logs

-- Ajouter la colonne montant si elle n'existe pas
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS montant DECIMAL(15,2) DEFAULT NULL;

-- Ajouter la colonne montantOrdonnance si elle n'existe pas
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS montantOrdonnance DECIMAL(15,2) DEFAULT NULL;

-- Ajouter la colonne validatedAt si elle n'existe pas
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS validatedAt TIMESTAMPTZ DEFAULT NULL;

-- Ajouter la colonne commentaires si elle n'existe pas
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS commentaires TEXT DEFAULT NULL;

-- Ajouter la colonne dateOrdonnancement si elle n'existe pas
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS dateOrdonnancement TIMESTAMPTZ DEFAULT NULL;

-- Ajouter la colonne folderId si elle n'existe pas (pour compatibilité)
ALTER TABLE dossiers
ADD COLUMN IF NOT EXISTS folderId UUID DEFAULT NULL;

-- Note: La colonne status pourrait être un doublon avec statut
-- Il semble que le code utilise parfois status et parfois statut
-- Pour éviter la confusion, on va utiliser uniquement statut

-- Créer un index sur les nouvelles colonnes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_dossiers_montant ON dossiers(montant);
CREATE INDEX IF NOT EXISTS idx_dossiers_validated_at ON dossiers(validatedAt);
CREATE INDEX IF NOT EXISTS idx_dossiers_folder_id ON dossiers(folderId);

-- Afficher la structure finale de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'dossiers' AND table_schema = 'public'
ORDER BY ordinal_position;