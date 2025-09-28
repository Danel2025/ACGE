-- Migration pour ajouter la colonne dossier_comptable_id à la table documents
-- Date: 2025-09-25
-- Description: Permet d'associer des documents aux dossiers comptables

-- Ajouter la colonne dossier_comptable_id
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS dossier_comptable_id UUID;

-- Ajouter une contrainte de clé étrangère vers la table dossiers
ALTER TABLE documents
ADD CONSTRAINT fk_documents_dossier_comptable
FOREIGN KEY (dossier_comptable_id)
REFERENCES dossiers(id)
ON DELETE SET NULL;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_dossier_comptable_id
ON documents(dossier_comptable_id);

-- Ajouter un commentaire
COMMENT ON COLUMN documents.dossier_comptable_id IS 'ID du dossier comptable auquel le document est associé';

-- Contrainte pour s'assurer qu'un document est associé soit à un folder soit à un dossier comptable, mais pas les deux
ALTER TABLE documents
ADD CONSTRAINT chk_documents_folder_or_dossier
CHECK (
  (folder_id IS NOT NULL AND dossier_comptable_id IS NULL) OR
  (folder_id IS NULL AND dossier_comptable_id IS NOT NULL) OR
  (folder_id IS NULL AND dossier_comptable_id IS NULL)
);

-- Afficher la structure mise à jour
SELECT
    'documents' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('folder_id', 'dossier_comptable_id')
ORDER BY ordinal_position;