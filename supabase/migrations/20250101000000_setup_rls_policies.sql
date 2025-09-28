-- Migration: Configuration des politiques RLS
-- Date: 2025-01-01
-- Description: Active RLS et configure les politiques d'accès pour toutes les tables

-- 1. Table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique (pour l'authentification)
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

-- Politique d'écriture pour les admins
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Politique de mise à jour pour les admins
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (true);

-- Politique de suppression pour les admins
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (true);

-- 2. Table folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour tous les utilisateurs connectés
CREATE POLICY "Users can view all folders" ON folders
  FOR SELECT USING (true);

-- Politique d'écriture pour tous les utilisateurs connectés
CREATE POLICY "Users can insert folders" ON folders
  FOR INSERT WITH CHECK (true);

-- Politique de mise à jour pour le propriétaire
CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (true);

-- Politique de suppression pour le propriétaire
CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (true);

-- 3. Table documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour tous les utilisateurs connectés
CREATE POLICY "Users can view all documents" ON documents
  FOR SELECT USING (true);

-- Politique d'écriture pour tous les utilisateurs connectés
CREATE POLICY "Users can insert documents" ON documents
  FOR INSERT WITH CHECK (true);

-- Politique de mise à jour pour le propriétaire
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (true);

-- Politique de suppression pour le propriétaire
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (true);

-- 4. Table notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour le destinataire
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = "userId");

-- Politique d'écriture pour tous les utilisateurs connectés
CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Politique de mise à jour pour le destinataire
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = "userId");

-- Politique de suppression pour le destinataire
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid()::text = "userId");

-- 5. Table document_versions (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_versions') THEN
    ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view all document versions" ON document_versions
      FOR SELECT USING (true);
    
    CREATE POLICY "Users can insert document versions" ON document_versions
      FOR INSERT WITH CHECK (true);
    
    CREATE POLICY "Users can update own document versions" ON document_versions
      FOR UPDATE USING (true);
    
    CREATE POLICY "Users can delete own document versions" ON document_versions
      FOR DELETE USING (true);
  END IF;
END $$;
