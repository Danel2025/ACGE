-- Migration pour ajouter la colonne nature_document_id à la table documents
-- Date: 2025-01-22
-- Description: Ajoute la liaison avec la table natures_documents pour classifier les documents

-- Ajouter la colonne nature_document_id à la table documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS nature_document_id UUID REFERENCES natures_documents(id) ON DELETE SET NULL;

-- Créer un index sur nature_document_id pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_nature_document_id ON documents(nature_document_id);

-- Commentaire sur la nouvelle colonne
COMMENT ON COLUMN documents.nature_document_id IS 'ID de la nature du document (référence vers natures_documents)';

-- Afficher la structure mise à jour
SELECT 
    'documents' as table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;
