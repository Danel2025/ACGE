-- Créer la table documents dans Supabase
-- Compatible avec l'API existante

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    author_id TEXT NOT NULL,
    folder_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur author_id pour les performances
CREATE INDEX IF NOT EXISTS idx_documents_author_id ON documents(author_id);

-- Créer un index sur folder_id pour les performances  
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- Créer un index sur created_at pour le tri
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Activer RLS (Row Level Security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique RLS : tous les utilisateurs authentifiés peuvent voir tous les documents
CREATE POLICY "Authenticated users can view all documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique RLS : tous les utilisateurs authentifiés peuvent créer des documents
CREATE POLICY "Authenticated users can create documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique RLS : les utilisateurs peuvent modifier leurs propres documents
CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid()::text = author_id);

-- Politique RLS : les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid()::text = author_id);

-- Commentaire sur la table
COMMENT ON TABLE documents IS 'Table des documents ACGE - Gestion des fichiers uploadés';
