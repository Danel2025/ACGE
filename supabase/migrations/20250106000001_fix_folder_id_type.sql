-- Migration pour changer le type de folder_id de UUID vers TEXT
-- Cela permet de supporter les formats d'ID legacy (folder-timestamp) et UUID

-- Changer le type de folder_id de UUID vers TEXT
ALTER TABLE documents ALTER COLUMN folder_id TYPE TEXT;

-- Mettre à jour l'index existant
DROP INDEX IF EXISTS idx_documents_folder_id;
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- Commentaire sur la colonne
COMMENT ON COLUMN documents.folder_id IS 'ID du dossier parent (UUID ou format legacy folder-timestamp)';
