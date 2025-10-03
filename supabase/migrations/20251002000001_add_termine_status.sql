-- Migration pour ajouter le statut TERMINÉ et VALIDÉ_DÉFINITIVEMENT
-- Date: 2025-10-02

-- Supprimer l'ancienne contrainte si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dossiers_statut_check'
        AND table_name = 'dossiers'
    ) THEN
        ALTER TABLE dossiers DROP CONSTRAINT dossiers_statut_check;
    END IF;
END $$;

-- Ajouter la nouvelle contrainte avec TERMINÉ et VALIDÉ_DÉFINITIVEMENT
ALTER TABLE dossiers
ADD CONSTRAINT dossiers_statut_check
CHECK (statut IN (
    'EN_ATTENTE',
    'VALIDÉ_CB',
    'REJETÉ_CB',
    'VALIDÉ_ORDONNATEUR',
    'VALIDÉ_DÉFINITIVEMENT',
    'TERMINÉ',
    'REJETÉ_ORDONNATEUR',
    'REJETÉ_AC'
));

-- Ajouter la colonne quitus_numero si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dossiers'
        AND column_name = 'quitus_numero'
    ) THEN
        ALTER TABLE dossiers ADD COLUMN quitus_numero TEXT;
    END IF;
END $$;

-- Ajouter la colonne termine_le si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dossiers'
        AND column_name = 'termine_le'
    ) THEN
        ALTER TABLE dossiers ADD COLUMN termine_le TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Créer un index sur le statut pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_dossiers_statut ON dossiers(statut);

-- Créer un index sur quitus_numero
CREATE INDEX IF NOT EXISTS idx_dossiers_quitus_numero ON dossiers(quitus_numero);
