-- Migration pour mettre à jour les numéros de dossier vers le nouveau format
-- Format: DOSS-ACGE-[N° nature]-[date]-[poste]-[document]-[id]
-- Date: 2025-09-28
-- Ce script met à jour les numéros de dossier existants vers le nouveau format

-- Fonction pour générer un nouveau numéro de dossier
CREATE OR REPLACE FUNCTION generate_new_numero_dossier(
    p_numero_nature TEXT,
    p_created_at TIMESTAMP WITH TIME ZONE,
    p_poste_comptable_id UUID,
    p_nature_document_id UUID,
    p_current_numero_dossier TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_date_formatted TEXT;
    v_clean_numero_nature TEXT;
    v_poste_code TEXT;
    v_nature_doc_code TEXT;
    v_short_id TEXT;
    v_new_numero_dossier TEXT;
BEGIN
    -- Formater la date (AAAAMMJJ)
    v_date_formatted := TO_CHAR(p_created_at, 'YYYYMMDD');

    -- Nettoyer et formater le numéro de nature
    v_clean_numero_nature := UPPER(REGEXP_REPLACE(COALESCE(p_numero_nature, 'XX'), '[^a-zA-Z0-9]', ''));

    -- Récupérer le code du poste comptable
    SELECT code INTO v_poste_code
    FROM postes_comptables
    WHERE id = p_poste_comptable_id;

    -- Récupérer le code de la nature du document
    SELECT code INTO v_nature_doc_code
    FROM natures_documents
    WHERE id = p_nature_document_id;

    -- Générer un identifiant unique court basé sur l'ID actuel ou aléatoire
    IF p_current_numero_dossier IS NOT NULL THEN
        -- Extraire l'ancienne partie timestamp ou générer aléatoirement
        v_short_id := UPPER(SUBSTRING(MD5(p_current_numero_dossier) FROM 1 FOR 6));
    ELSE
        -- Générer aléatoirement pour les nouveaux dossiers
        v_short_id := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    END IF;

    -- Construire le numéro de dossier
    v_new_numero_dossier := 'DOSS-ACGE-' || v_clean_numero_nature || '-' || v_date_formatted;

    -- Ajouter le poste comptable si disponible
    IF v_poste_code IS NOT NULL THEN
        v_new_numero_dossier := v_new_numero_dossier || '-' || UPPER(REGEXP_REPLACE(v_poste_code, '[^a-zA-Z0-9]', ''));
    END IF;

    -- Ajouter la nature du document si disponible
    IF v_nature_doc_code IS NOT NULL THEN
        v_new_numero_dossier := v_new_numero_dossier || '-' || UPPER(REGEXP_REPLACE(v_nature_doc_code, '[^a-zA-Z0-9]', ''));
    END IF;

    -- Ajouter l'identifiant unique
    v_new_numero_dossier := v_new_numero_dossier || '-' || v_short_id;

    RETURN v_new_numero_dossier;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour les numéros de dossier dans la table dossiers
DO $$
DECLARE
    dossier_record RECORD;
    new_numero_dossier TEXT;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 Début de la migration des numéros de dossier...';

    -- Parcourir tous les dossiers qui n'ont pas encore le nouveau format
    FOR dossier_record IN
        SELECT
            id,
            numeroDossier,
            numeroNature,
            createdAt,
            posteComptableId,
            natureDocumentId
        FROM dossiers
        WHERE numeroDossier IS NOT NULL
        AND numeroDossier NOT LIKE 'DOSS-ACGE-%'
        ORDER BY createdAt
    LOOP
        -- Générer le nouveau numéro de dossier
        new_numero_dossier := generate_new_numero_dossier(
            dossier_record.numeroNature,
            dossier_record.createdAt,
            dossier_record.posteComptableId,
            dossier_record.natureDocumentId,
            dossier_record.numeroDossier
        );

        -- Vérifier l'unicité du nouveau numéro
        IF NOT EXISTS (SELECT 1 FROM dossiers WHERE numeroDossier = new_numero_dossier) THEN
            -- Mettre à jour le dossier
            UPDATE dossiers
            SET numeroDossier = new_numero_dossier,
                updatedAt = NOW()
            WHERE id = dossier_record.id;

            updated_count := updated_count + 1;
            RAISE NOTICE '✅ Dossier % mis à jour: % -> %', dossier_record.id, dossier_record.numeroDossier, new_numero_dossier;
        ELSE
            -- Si le numéro existe déjà, ajouter un suffixe unique
            new_numero_dossier := new_numero_dossier || '-ALT' || updated_count;
            UPDATE dossiers
            SET numeroDossier = new_numero_dossier,
                updatedAt = NOW()
            WHERE id = dossier_record.id;

            updated_count := updated_count + 1;
            RAISE NOTICE '⚠️ Dossier % mis à jour avec suffixe: % -> %', dossier_record.id, dossier_record.numeroDossier, new_numero_dossier;
        END IF;
    END LOOP;

    RAISE NOTICE '🎉 Migration terminée. % dossiers mis à jour.', updated_count;
END $$;

-- Mettre à jour les numéros de dossier dans la table folders (si elle existe)
DO $$
DECLARE
    folder_record RECORD;
    new_numero_dossier TEXT;
    updated_count INTEGER := 0;
BEGIN
    -- Vérifier si la table folders existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'folders' AND table_schema = 'public') THEN
        RAISE NOTICE '🚀 Début de la migration des numéros de dossier dans folders...';

        -- Parcourir tous les dossiers de la table folders
        FOR folder_record IN
            SELECT
                id,
                numeroDossier,
                numeroNature,
                createdAt,
                posteComptableId,
                natureDocumentId
            FROM folders
            WHERE numeroDossier IS NOT NULL
            AND numeroDossier NOT LIKE 'DOSS-ACGE-%'
            ORDER BY createdAt
        LOOP
            -- Générer le nouveau numéro de dossier
            new_numero_dossier := generate_new_numero_dossier(
                folder_record.numeroNature,
                folder_record.createdAt,
                folder_record.posteComptableId,
                folder_record.natureDocumentId,
                folder_record.numeroDossier
            );

            -- Vérifier l'unicité du nouveau numéro
            IF NOT EXISTS (SELECT 1 FROM folders WHERE numeroDossier = new_numero_dossier) THEN
                -- Mettre à jour le dossier
                UPDATE folders
                SET numeroDossier = new_numero_dossier,
                    updatedAt = NOW()
                WHERE id = folder_record.id;

                updated_count := updated_count + 1;
                RAISE NOTICE '✅ Folder % mis à jour: % -> %', folder_record.id, folder_record.numeroDossier, new_numero_dossier;
            ELSE
                -- Si le numéro existe déjà, ajouter un suffixe unique
                new_numero_dossier := new_numero_dossier || '-ALT' || updated_count;
                UPDATE folders
                SET numeroDossier = new_numero_dossier,
                    updatedAt = NOW()
                WHERE id = folder_record.id;

                updated_count := updated_count + 1;
                RAISE NOTICE '⚠️ Folder % mis à jour avec suffixe: % -> %', folder_record.id, folder_record.numeroDossier, new_numero_dossier;
            END IF;
        END LOOP;

        RAISE NOTICE '🎉 Migration folders terminée. % dossiers mis à jour.', updated_count;
    ELSE
        RAISE NOTICE 'ℹ️ Table folders non trouvée, migration ignorée.';
    END IF;
END $$;

-- Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS generate_new_numero_dossier(
    TEXT, TIMESTAMP WITH TIME ZONE, UUID, UUID, TEXT
);

-- Rapport final
SELECT
    'Rapport de migration des numéros de dossier' as info,
    COUNT(*) as total_dossiers,
    COUNT(CASE WHEN numeroDossier LIKE 'DOSS-ACGE-%' THEN 1 END) as nouveaux_format,
    COUNT(CASE WHEN numeroDossier NOT LIKE 'DOSS-ACGE-%' THEN 1 END) as anciens_format
FROM dossiers
WHERE numeroDossier IS NOT NULL;

-- Vérifier quelques exemples
SELECT
    'Exemples de numéros de dossier mis à jour' as info,
    numeroDossier,
    numeroNature,
    createdAt
FROM dossiers
WHERE numeroDossier LIKE 'DOSS-ACGE-%'
ORDER BY createdAt DESC
LIMIT 5;
