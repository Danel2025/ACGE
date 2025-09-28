-- Migration pour ajouter les colonnes de fichier à la table documents
-- Si elles n'existent pas déjà

-- Ajouter les colonnes de fichier si elles n'existent pas
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Créer les index pour les performances (si ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_file_size ON documents(file_size);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Commentaires sur les colonnes
COMMENT ON COLUMN documents.file_name IS 'Nom du fichier uploadé';
COMMENT ON COLUMN documents.file_size IS 'Taille du fichier en bytes';
COMMENT ON COLUMN documents.file_type IS 'Type MIME du fichier';
COMMENT ON COLUMN documents.file_path IS 'Chemin du fichier dans le storage';
COMMENT ON COLUMN documents.url IS 'URL publique du fichier';
COMMENT ON COLUMN documents.tags IS 'Tags associés au document';
COMMENT ON COLUMN documents.is_public IS 'Visibilité du document';
