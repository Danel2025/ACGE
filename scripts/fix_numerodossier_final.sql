-- Script FINAL pour corriger la colonne numeroDossier (gérer tous les cas)
-- Date: 2025-09-23
-- Ce script force la correction quel que soit l'état actuel

-- 1. Vérifier l'état actuel complet de la table
SELECT '=== ÉTAT ACTUEL DE LA TABLE FOLDERS ===' as diagnostic_info;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name = 'numerodossier' THEN '❌ COLONNE EN MINUSCULES (À RENOMMER)'
        WHEN column_name = 'numeroDossier' THEN '✅ COLONNE EN CAMELCASE (OK)'
        ELSE '📋 AUTRE COLONNE'
    END as status
FROM information_schema.columns
WHERE table_name = 'folders'
ORDER BY ordinal_position;

-- 2. Vérifier spécifiquement les colonnes numeroDossier
SELECT '=== VÉRIFICATION SPÉCIFIQUE DES COLONNES NUMERODOSSIER ===' as specific_check;
SELECT
    'Vérification colonne numerodossier (minuscules):' as check_type,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'folders' AND column_name = 'numerodossier')
        THEN '❌ TROUVÉE (doit être renommée)'
        ELSE '✅ NON TROUVÉE'
    END as result
UNION ALL
SELECT
    'Vérification colonne numeroDossier (camelCase):' as check_type,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'folders' AND column_name = 'numeroDossier')
        THEN '✅ TROUVÉE (colonne correcte)'
        ELSE '❌ NON TROUVÉE'
    END as result;

-- 3. Corriger le problème - approche forcée
DO $$
DECLARE
    numerodossier_exists BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'folders'
        AND column_name = 'numerodossier'
    );
    numerodossier_camel_exists BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'folders'
        AND column_name = 'numeroDossier'
    );
    numerodossier_data_exists BOOLEAN := EXISTS (
        SELECT 1 FROM folders WHERE numerodossier IS NOT NULL
    );
BEGIN
    RAISE NOTICE '=== DIAGNOSTIC AVANT CORRECTION ===';
    RAISE NOTICE 'Colonne numerodossier (minuscules) existe: %', numerodossier_exists;
    RAISE NOTICE 'Colonne numeroDossier (camelCase) existe: %', numerodossier_camel_exists;
    RAISE NOTICE 'Données dans numerodossier: %', numerodossier_data_exists;

    -- Cas 1: Colonne en minuscules existe mais pas en camelCase
    IF numerodossier_exists AND NOT numerodossier_camel_exists THEN
        RAISE NOTICE '✅ SCÉNARIO 1: Renommage de numerodossier vers numeroDossier';

        -- Étape 1: Créer une colonne temporaire si nécessaire
        IF numerodossier_data_exists THEN
            -- Copier les données vers une colonne temporaire
            ALTER TABLE folders ADD COLUMN IF NOT EXISTS temp_numerodossier_backup TEXT;
            UPDATE folders SET temp_numerodossier_backup = numerodossier;
            RAISE NOTICE '✅ Données sauvegardées dans temp_numerodossier_backup';
        END IF;

        -- Étape 2: Renommer la colonne
        ALTER TABLE folders RENAME COLUMN numerodossier TO numeroDossier;
        RAISE NOTICE '✅ Colonne renommée de numerodossier vers numeroDossier';

        -- Étape 3: Restaurer les données si nécessaire
        IF numerodossier_data_exists THEN
            UPDATE folders SET numeroDossier = temp_numerodossier_backup;
            RAISE NOTICE '✅ Données restaurées dans numeroDossier';
        END IF;

    -- Cas 2: Les deux colonnes existent (problème majeur)
    ELSIF numerodossier_exists AND numerodossier_camel_exists THEN
        RAISE NOTICE '⚠️ SCÉNARIO 2: Les deux colonnes existent - consolidation nécessaire';

        -- Copier les données de la colonne minuscules vers camelCase si différentes
        UPDATE folders
        SET numeroDossier = numerodossier
        WHERE numeroDossier IS NULL AND numerodossier IS NOT NULL;

        -- Supprimer la colonne minuscules (garder seulement camelCase)
        ALTER TABLE folders DROP COLUMN numerodossier;
        RAISE NOTICE '✅ Colonne numerodossier supprimée, données consolidées dans numeroDossier';

    -- Cas 3: Aucune colonne n'existe (très improbable)
    ELSIF NOT numerodossier_exists AND NOT numerodossier_camel_exists THEN
        RAISE NOTICE '❌ SCÉNARIO 3: Aucune colonne numeroDossier trouvée - création nécessaire';
        ALTER TABLE folders ADD COLUMN numeroDossier TEXT UNIQUE;
        RAISE NOTICE '✅ Colonne numeroDossier créée';

    -- Cas 4: Colonne camelCase existe déjà (parfait)
    ELSE
        RAISE NOTICE '✅ SCÉNARIO 4: Colonne numeroDossier existe déjà dans le bon format';
    END IF;

    -- 4. Ajouter le commentaire et l'index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'folders'
        AND column_name = 'numeroDossier'
    ) THEN
        -- Ajouter le commentaire
        COMMENT ON COLUMN folders.numeroDossier IS 'Numéro de dossier comptable généré automatiquement avec format DOSS-ACGE-YYYYXXX';
        RAISE NOTICE '✅ Commentaire ajouté sur la colonne numeroDossier';

        -- Créer l'index si nécessaire
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'folders'
            AND indexname = 'idx_folders_numero_dossier'
        ) THEN
            CREATE INDEX idx_folders_numero_dossier ON folders(numeroDossier);
            RAISE NOTICE '✅ Index créé sur numeroDossier';
        ELSE
            RAISE NOTICE '✅ Index déjà existant';
        END IF;
    END IF;

    RAISE NOTICE '=== CORRECTION TERMINÉE ===';
END $$;

-- 5. Afficher le résultat final
SELECT '=== RÉSULTAT FINAL APRÈS CORRECTION ===' as final_result;
SELECT
    'folders' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name = 'numeroDossier' THEN '✅ COLONNE CORRIGÉE'
        ELSE '📋 COLONNE AUTRE'
    END as status
FROM information_schema.columns
WHERE table_name = 'folders'
ORDER BY ordinal_position;

-- 6. Vérifier que l'index existe
SELECT '=== VÉRIFICATION INDEX ===' as index_check;
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'folders'
ORDER BY indexname;
