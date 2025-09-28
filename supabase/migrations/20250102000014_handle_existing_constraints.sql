-- Migration pour gérer les contraintes existantes avant de changer les types
-- Supprime temporairement les contraintes problématiques

-- 1. Identifier et supprimer les contraintes de clés étrangères existantes
DO $$ 
BEGIN
    -- Supprimer la contrainte comments_documentId_fkey si elle existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comments_documentId_fkey'
    ) THEN
        ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_documentId_fkey;
        RAISE NOTICE 'Contrainte comments_documentId_fkey supprimée temporairement';
    END IF;
    
    -- Supprimer d'autres contraintes potentiellement problématiques
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'document_shares_documentId_fkey'
    ) THEN
        ALTER TABLE public.document_shares DROP CONSTRAINT IF EXISTS document_shares_documentId_fkey;
        RAISE NOTICE 'Contrainte document_shares_documentId_fkey supprimée temporairement';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = '_DocumentToTag_A_fkey'
    ) THEN
        ALTER TABLE public._DocumentToTag DROP CONSTRAINT IF EXISTS _DocumentToTag_A_fkey;
        RAISE NOTICE 'Contrainte _DocumentToTag_A_fkey supprimée temporairement';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_documents_current_version_id'
    ) THEN
        ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS fk_documents_current_version_id;
        RAISE NOTICE 'Contrainte fk_documents_current_version_id supprimée temporairement';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_document_versions_document_id'
    ) THEN
        ALTER TABLE public.document_versions DROP CONSTRAINT IF EXISTS fk_document_versions_document_id;
        RAISE NOTICE 'Contrainte fk_document_versions_document_id supprimée temporairement';
    END IF;
END $$;

-- 2. Afficher les contraintes restantes pour vérification
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
    AND (tc.table_name = 'documents' OR tc.table_name = 'document_versions' 
         OR tc.table_name = 'comments' OR tc.table_name = 'document_shares'
         OR tc.table_name = '_DocumentToTag')
ORDER BY tc.table_name, kcu.column_name;
