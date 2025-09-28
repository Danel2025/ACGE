-- Migration pour forcer la suppression de toutes les contraintes problématiques
-- Utilise DROP CONSTRAINT IF EXISTS pour éviter les erreurs

-- 1. Supprimer toutes les contraintes de clés étrangères connues
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_documentId_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_document_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS fk_comments_document_id;

ALTER TABLE public.document_shares DROP CONSTRAINT IF EXISTS document_shares_documentId_fkey;
ALTER TABLE public.document_shares DROP CONSTRAINT IF EXISTS document_shares_document_id_fkey;
ALTER TABLE public.document_shares DROP CONSTRAINT IF EXISTS fk_document_shares_document_id;

ALTER TABLE public._DocumentToTag DROP CONSTRAINT IF EXISTS _DocumentToTag_A_fkey;
ALTER TABLE public._DocumentToTag DROP CONSTRAINT IF EXISTS fk_document_to_tag_document_id;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS fk_documents_current_version_id;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS fk_documents_author_id;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS fk_documents_folder_id;

ALTER TABLE public.document_versions DROP CONSTRAINT IF EXISTS fk_document_versions_document_id;
ALTER TABLE public.document_versions DROP CONSTRAINT IF EXISTS fk_document_versions_created_by_id;

-- 2. Afficher toutes les contraintes restantes pour vérification
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    tc.constraint_type
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
