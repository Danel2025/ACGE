-- Migration pour vérifier la structure actuelle des tables
-- et identifier les incohérences de noms de colonnes

-- 1. Vérifier la structure de la table documents
SELECT 
    'documents' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

-- 2. Vérifier la structure de la table document_versions
SELECT 
    'document_versions' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'document_versions' 
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes de clés étrangères
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

-- 4. Vérifier les index existants
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('documents', 'document_versions')
ORDER BY tablename, indexname;

-- 5. Compter les enregistrements dans chaque table
SELECT 'documents' as table_name, COUNT(*) as record_count FROM public.documents
UNION ALL
SELECT 'document_versions' as table_name, COUNT(*) as record_count FROM public.document_versions;

-- 6. Vérifier les types de données des colonnes critiques
SELECT 
    'documents.author_id' as column_info,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'author_id'

UNION ALL

SELECT 
    'document_versions.document_id' as column_info,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'document_versions' AND column_name = 'document_id'

UNION ALL

SELECT 
    'document_versions.created_by_id' as column_info,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'document_versions' AND column_name = 'created_by_id';
