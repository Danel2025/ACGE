-- Migration pour ajouter les colonnes de rejet à la table dossiers
-- Date: 2025-01-24
-- Description: Ajoute les colonnes nécessaires pour gérer le rejet des dossiers par le Contrôleur Budgétaire

-- Ajouter les colonnes de rejet à la table dossiers
ALTER TABLE dossiers 
ADD COLUMN IF NOT EXISTS rejectedAt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejectionReason TEXT,
ADD COLUMN IF NOT EXISTS rejectionDetails TEXT;

-- Créer des index pour les performances sur les colonnes de rejet
CREATE INDEX IF NOT EXISTS idx_dossiers_rejected_at ON dossiers(rejectedAt);
CREATE INDEX IF NOT EXISTS idx_dossiers_rejection_reason ON dossiers(rejectionReason);

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN dossiers.rejectedAt IS 'Date et heure du rejet du dossier par le Contrôleur Budgétaire';
COMMENT ON COLUMN dossiers.rejectionReason IS 'Motif du rejet du dossier';
COMMENT ON COLUMN dossiers.rejectionDetails IS 'Détails supplémentaires du rejet (optionnel)';

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
