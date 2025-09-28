-- Créer le bucket Supabase Storage pour les documents

-- Insérer le bucket dans la table storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Créer une politique RLS pour permettre l'accès public au bucket
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

-- Créer une politique RLS pour permettre l'upload authentifié
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- Créer une politique RLS pour permettre la mise à jour par l'utilisateur authentifié
CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Créer une politique RLS pour permettre la suppression par l'utilisateur authentifié
CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
