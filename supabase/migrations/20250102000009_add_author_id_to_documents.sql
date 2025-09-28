-- Ajouter la colonne author_id manquante à la table documents

-- Vérifier si la colonne author_id existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'author_id') THEN
        -- Ajouter la colonne author_id
        ALTER TABLE public.documents ADD COLUMN author_id UUID;
        
        -- Créer un index sur author_id pour les performances
        CREATE INDEX IF NOT EXISTS idx_documents_author_id ON public.documents(author_id);
        
        RAISE NOTICE 'Colonne author_id ajoutée à la table documents';
    ELSE
        RAISE NOTICE 'Colonne author_id existe déjà dans la table documents';
    END IF;
END $$;

-- Vérifier si la colonne folder_id existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'folder_id') THEN
        -- Ajouter la colonne folder_id
        ALTER TABLE public.documents ADD COLUMN folder_id UUID;
        
        -- Créer un index sur folder_id pour les performances
        CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON public.documents(folder_id);
        
        RAISE NOTICE 'Colonne folder_id ajoutée à la table documents';
    ELSE
        RAISE NOTICE 'Colonne folder_id existe déjà dans la table documents';
    END IF;
END $$;

-- Vérifier si la colonne current_version_id existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'current_version_id') THEN
        -- Ajouter la colonne current_version_id
        ALTER TABLE public.documents ADD COLUMN current_version_id UUID;
        
        -- Créer un index sur current_version_id pour les performances
        CREATE INDEX IF NOT EXISTS idx_documents_current_version_id ON public.documents(current_version_id);
        
        RAISE NOTICE 'Colonne current_version_id ajoutée à la table documents';
    ELSE
        RAISE NOTICE 'Colonne current_version_id existe déjà dans la table documents';
    END IF;
END $$;

-- Vérifier si la colonne is_public existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'is_public') THEN
        -- Ajouter la colonne is_public
        ALTER TABLE public.documents ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Colonne is_public ajoutée à la table documents';
    ELSE
        RAISE NOTICE 'Colonne is_public existe déjà dans la table documents';
    END IF;
END $$;

-- Vérifier si la colonne created_at existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'created_at') THEN
        -- Ajouter la colonne created_at
        ALTER TABLE public.documents ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Créer un index sur created_at pour les performances
        CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);
        
        RAISE NOTICE 'Colonne created_at ajoutée à la table documents';
    ELSE
        RAISE NOTICE 'Colonne created_at existe déjà dans la table documents';
    END IF;
END $$;

-- Vérifier si la colonne updated_at existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'updated_at') THEN
        -- Ajouter la colonne updated_at
        ALTER TABLE public.documents ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Colonne updated_at ajoutée à la table documents';
    ELSE
        RAISE NOTICE 'Colonne updated_at existe déjà dans la table documents';
    END IF;
END $$;

-- Afficher la structure finale de la table documents
SELECT 'documents' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;
