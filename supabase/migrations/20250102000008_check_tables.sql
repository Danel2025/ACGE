-- Vérifier la structure actuelle des tables

-- Afficher la structure de la table documents
SELECT 'documents' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

-- Afficher la structure de la table document_versions
SELECT 'document_versions' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'document_versions' 
ORDER BY ordinal_position;

-- Afficher quelques enregistrements de chaque table
SELECT 'documents' as table_name, COUNT(*) as record_count FROM public.documents;
SELECT 'document_versions' as table_name, COUNT(*) as record_count FROM public.document_versions;
