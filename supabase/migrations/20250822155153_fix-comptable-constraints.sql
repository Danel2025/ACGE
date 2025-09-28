-- Migration pour ajouter les contraintes manquantes sur les tables comptables
-- Gère les cas où les contraintes existent déjà

-- Ajout des clés étrangères avec gestion des erreurs
DO $$ 
BEGIN
    -- UserSettings foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_settings_userId_fkey') THEN
        ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    -- Dossiers foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'dossiers_posteComptableId_fkey') THEN
        ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_posteComptableId_fkey" FOREIGN KEY ("posteComptableId") REFERENCES "postes_comptables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'dossiers_natureDocumentId_fkey') THEN
        ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_natureDocumentId_fkey" FOREIGN KEY ("natureDocumentId") REFERENCES "natures_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'dossiers_secretaireId_fkey') THEN
        ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_secretaireId_fkey" FOREIGN KEY ("secretaireId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    -- Validations foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'validations_dossiers_dossierId_fkey') THEN
        ALTER TABLE "validations_dossiers" ADD CONSTRAINT "validations_dossiers_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'validations_dossiers_validateurId_fkey') THEN
        ALTER TABLE "validations_dossiers" ADD CONSTRAINT "validations_dossiers_validateurId_fkey" FOREIGN KEY ("validateurId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
