-- Migration finale pour corriger les noms de colonnes
-- Gère les cas où les colonnes existent déjà

-- 1. Vérifier et corriger la table document_versions (déjà partiellement corrigée)
DO $$ 
BEGIN
    -- Vérifier si les colonnes ont déjà les bons noms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'version_number') THEN
        -- Essayer de renommer si la colonne existe avec l'ancien nom
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'versionNumber') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "versionNumber" TO version_number;
            RAISE NOTICE 'Colonne versionNumber renommée en version_number';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'file_name') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'fileName') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "fileName" TO file_name;
            RAISE NOTICE 'Colonne fileName renommée en file_name';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'file_size') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'fileSize') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "fileSize" TO file_size;
            RAISE NOTICE 'Colonne fileSize renommée en file_size';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'file_type') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'fileType') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "fileType" TO file_type;
            RAISE NOTICE 'Colonne fileType renommée en file_type';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'file_path') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'filePath') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "filePath" TO file_path;
            RAISE NOTICE 'Colonne filePath renommée en file_path';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'change_log') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'changeLog') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "changeLog" TO change_log;
            RAISE NOTICE 'Colonne changeLog renommée en change_log';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'document_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'documentId') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "documentId" TO document_id;
            RAISE NOTICE 'Colonne documentId renommée en document_id';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'created_by_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'createdById') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "createdById" TO created_by_id;
            RAISE NOTICE 'Colonne createdById renommée en created_by_id';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'created_at') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'createdAt') THEN
            ALTER TABLE public.document_versions RENAME COLUMN "createdAt" TO created_at;
            RAISE NOTICE 'Colonne createdAt renommée en created_at';
        END IF;
    END IF;
END $$;

-- 2. Vérifier et corriger la table documents
DO $$ 
BEGIN
    -- Vérifier si les colonnes ont déjà les bons noms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'author_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'authorId') THEN
            ALTER TABLE public.documents RENAME COLUMN "authorId" TO author_id;
            RAISE NOTICE 'Colonne authorId renommée en author_id';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'folder_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'folderId') THEN
            ALTER TABLE public.documents RENAME COLUMN "folderId" TO folder_id;
            RAISE NOTICE 'Colonne folderId renommée en folder_id';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'current_version_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'currentVersionId') THEN
            ALTER TABLE public.documents RENAME COLUMN "currentVersionId" TO current_version_id;
            RAISE NOTICE 'Colonne currentVersionId renommée en current_version_id';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'is_public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'isPublic') THEN
            ALTER TABLE public.documents RENAME COLUMN "isPublic" TO is_public;
            RAISE NOTICE 'Colonne isPublic renommée en is_public';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'created_at') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'createdAt') THEN
            ALTER TABLE public.documents RENAME COLUMN "createdAt" TO created_at;
            RAISE NOTICE 'Colonne createdAt renommée en created_at';
        END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'updated_at') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'updatedAt') THEN
            ALTER TABLE public.documents RENAME COLUMN "updatedAt" TO updated_at;
            RAISE NOTICE 'Colonne updatedAt renommée en updated_at';
        END IF;
    END IF;
END $$;

-- 3. Créer les index manquants (s'ils n'existent pas déjà)
CREATE INDEX IF NOT EXISTS idx_documents_author_id ON public.documents(author_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_current_version_id ON public.documents(current_version_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by_id ON public.document_versions(created_by_id);

-- 4. Afficher la structure finale des tables
SELECT 'documents' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

SELECT 'document_versions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'document_versions' 
ORDER BY ordinal_position;
