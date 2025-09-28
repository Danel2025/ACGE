-- Corriger le type de la colonne author_id pour accepter des strings
ALTER TABLE documents ALTER COLUMN author_id TYPE TEXT;
ALTER TABLE document_versions ALTER COLUMN created_by TYPE TEXT;
