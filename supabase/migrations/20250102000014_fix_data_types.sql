-- Migration pour corriger les types de données et assurer la cohérence
-- entre les tables documents et document_versions

-- 1. Vérifier et corriger les types de données des colonnes id
DO $$ 
BEGIN
    -- S'assurer que documents.id est de type UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'id') != 'uuid' THEN
            ALTER TABLE public.documents ALTER COLUMN id TYPE UUID USING id::uuid;
            RAISE NOTICE 'Colonne documents.id convertie en UUID';
        END IF;
    END IF;
    
    -- S'assurer que document_versions.id est de type UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'id') != 'uuid' THEN
            ALTER TABLE public.document_versions ALTER COLUMN id TYPE UUID USING id::uuid;
            RAISE NOTICE 'Colonne document_versions.id convertie en UUID';
        END IF;
    END IF;
    
    -- S'assurer que document_versions.document_id est de type UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'document_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'document_id') != 'uuid' THEN
            ALTER TABLE public.document_versions ALTER COLUMN document_id TYPE UUID USING document_id::uuid;
            RAISE NOTICE 'Colonne document_versions.document_id convertie en UUID';
        END IF;
    END IF;
    
    -- S'assurer que document_versions.created_by_id est de type UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'created_by_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'document_versions' AND column_name = 'created_by_id') != 'uuid' THEN
            ALTER TABLE public.document_versions ALTER COLUMN created_by_id TYPE UUID USING created_by_id::uuid;
            RAISE NOTICE 'Colonne document_versions.created_by_id convertie en UUID';
        END IF;
    END IF;
    
    -- S'assurer que documents.author_id est de type UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'author_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'author_id') != 'uuid' THEN
            ALTER TABLE public.documents ALTER COLUMN author_id TYPE UUID USING author_id::uuid;
            RAISE NOTICE 'Colonne documents.author_id convertie en UUID';
        END IF;
    END IF;
    
    -- S'assurer que documents.folder_id est de type UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'folder_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'folder_id') != 'uuid' THEN
            ALTER TABLE public.documents ALTER COLUMN folder_id TYPE UUID USING folder_id::uuid;
            RAISE NOTICE 'Colonne documents.folder_id convertie en UUID';
        END IF;
    END IF;
    
    -- S'assurer que documents.current_version_id est de type UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'current_version_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'current_version_id') != 'uuid' THEN
            ALTER TABLE public.documents ALTER COLUMN current_version_id TYPE UUID USING current_version_id::uuid;
            RAISE NOTICE 'Colonne documents.current_version_id convertie en UUID';
        END IF;
    END IF;
END $$;

-- 2. Ajouter la contrainte de clé étrangère maintenant que les types sont cohérents
DO $$ 
BEGIN
    -- Contrainte pour current_version_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_documents_current_version_id'
    ) THEN
        ALTER TABLE public.documents 
        ADD CONSTRAINT fk_documents_current_version_id 
        FOREIGN KEY (current_version_id) REFERENCES document_versions(id);
        RAISE NOTICE 'Contrainte de clé étrangère ajoutée pour current_version_id';
    END IF;
    
    -- Contrainte pour document_versions.document_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_document_versions_document_id'
    ) THEN
        ALTER TABLE public.document_versions 
        ADD CONSTRAINT fk_document_versions_document_id 
        FOREIGN KEY (document_id) REFERENCES documents(id);
        RAISE NOTICE 'Contrainte de clé étrangère ajoutée pour document_id';
    END IF;
END $$;

-- 3. Afficher la structure finale des tables avec les types
SELECT 
    'documents' as table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

SELECT 
    'document_versions' as table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'document_versions' 
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes de clés étrangères
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (tc.table_name = 'documents' OR tc.table_name = 'document_versions');
