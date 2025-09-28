-- =====================================================
-- MIGRATION: Ajout CASCADE DELETE pour validations_controles_fond
-- =====================================================
-- Date: 2025-01-28
-- Description: Ajoute CASCADE DELETE sur la contrainte foreign key 
--              validations_controles_fond_dossier_id_fkey pour permettre
--              la suppression automatique des validations quand un dossier est supprimé

-- Supprimer l'ancienne contrainte
ALTER TABLE validations_controles_fond 
DROP CONSTRAINT IF EXISTS validations_controles_fond_dossier_id_fkey;

-- Recréer la contrainte avec CASCADE DELETE
ALTER TABLE validations_controles_fond 
ADD CONSTRAINT validations_controles_fond_dossier_id_fkey 
FOREIGN KEY (dossier_id) 
REFERENCES dossiers(id) 
ON DELETE CASCADE;

-- Vérifier que la contrainte a été créée correctement
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'validations_controles_fond'
    AND kcu.column_name = 'dossier_id';

-- Commentaire sur la modification
COMMENT ON CONSTRAINT validations_controles_fond_dossier_id_fkey ON validations_controles_fond 
IS 'Contrainte de clé étrangère avec CASCADE DELETE - les validations sont supprimées automatiquement quand le dossier parent est supprimé';
