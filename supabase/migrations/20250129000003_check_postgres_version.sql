-- Migration: Vérification et documentation de la version Postgres
-- Date: 2025-01-29
-- Description: Vérification de la version Postgres et recommandations de sécurité

-- ==============================================
-- 1. VÉRIFICATION DE LA VERSION POSTGRES
-- ==============================================

-- Créer une fonction pour vérifier la version Postgres et les correctifs de sécurité
CREATE OR REPLACE FUNCTION check_postgres_security_status()
RETURNS TABLE(
    version TEXT,
    version_number NUMERIC,
    is_latest BOOLEAN,
    security_recommendations TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_version TEXT;
    version_parts TEXT[];
    major_version INTEGER;
    minor_version INTEGER;
    patch_version INTEGER;
    version_numeric NUMERIC;
    recommendations TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Récupérer la version actuelle
    SELECT version() INTO current_version;
    
    -- Extraire les numéros de version
    version_parts := string_to_array(split_part(current_version, ' ', 2), '.');
    major_version := version_parts[1]::INTEGER;
    minor_version := version_parts[2]::INTEGER;
    patch_version := version_parts[3]::INTEGER;
    
    -- Créer un numéro de version pour comparaison
    version_numeric := major_version * 10000 + minor_version * 100 + patch_version;
    
    -- Vérifier si la version est récente (Postgres 15+ recommandé)
    is_latest := major_version >= 15;
    
    -- Ajouter des recommandations basées sur la version
    IF major_version < 13 THEN
        recommendations := array_append(recommendations, 'CRITIQUE: Mise à jour vers Postgres 13+ requise pour les correctifs de sécurité');
    ELSIF major_version < 15 THEN
        recommendations := array_append(recommendations, 'RECOMMANDÉ: Mise à jour vers Postgres 15+ pour les dernières fonctionnalités de sécurité');
    ELSIF major_version < 16 THEN
        recommendations := array_append(recommendations, 'OPTIONNEL: Mise à jour vers Postgres 16+ pour les améliorations de performance');
    ELSE
        recommendations := array_append(recommendations, 'EXCELLENT: Version Postgres récente et sécurisée');
    END IF;
    
    -- Vérifier les extensions de sécurité
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        recommendations := array_append(recommendations, 'RECOMMANDÉ: Installer l''extension pgcrypto pour le chiffrement');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        recommendations := array_append(recommendations, 'RECOMMANDÉ: Installer l''extension pg_stat_statements pour le monitoring');
    END IF;
    
    RETURN QUERY SELECT 
        current_version,
        version_numeric,
        is_latest,
        recommendations;
END;
$$;

-- ==============================================
-- 2. VÉRIFICATION DES CONFIGURATIONS DE SÉCURITÉ
-- ==============================================

-- Fonction pour vérifier les configurations de sécurité Postgres
CREATE OR REPLACE FUNCTION check_postgres_security_config()
RETURNS TABLE(
    setting_name TEXT,
    current_value TEXT,
    recommended_value TEXT,
    is_secure BOOLEAN,
    description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH security_settings AS (
        SELECT 
            'ssl' as setting_name,
            current_setting('ssl') as current_value,
            'on' as recommended_value,
            current_setting('ssl') = 'on' as is_secure,
            'SSL doit être activé pour chiffrer les connexions' as description
        UNION ALL
        SELECT 
            'log_statement',
            current_setting('log_statement'),
            'all',
            current_setting('log_statement') = 'all',
            'Journalisation de toutes les requêtes SQL pour audit'
        UNION ALL
        SELECT 
            'log_connections',
            current_setting('log_connections'),
            'on',
            current_setting('log_connections') = 'on',
            'Journalisation des connexions pour audit'
        UNION ALL
        SELECT 
            'log_disconnections',
            current_setting('log_disconnections'),
            'on',
            current_setting('log_disconnections') = 'on',
            'Journalisation des déconnexions pour audit'
        UNION ALL
        SELECT 
            'shared_preload_libraries',
            current_setting('shared_preload_libraries'),
            'pg_stat_statements',
            current_setting('shared_preload_libraries') LIKE '%pg_stat_statements%',
            'Extension de monitoring des performances'
    )
    SELECT * FROM security_settings;
END;
$$;

-- ==============================================
-- 3. VÉRIFICATION DES PERMISSIONS ET RÔLES
-- ==============================================

-- Fonction pour vérifier les permissions de sécurité
CREATE OR REPLACE FUNCTION check_security_permissions()
RETURNS TABLE(
    role_name TEXT,
    is_superuser BOOLEAN,
    can_create_role BOOLEAN,
    can_create_db BOOLEAN,
    can_login BOOLEAN,
    security_risk TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.rolname as role_name,
        r.rolsuper as is_superuser,
        r.rolcreaterole as can_create_role,
        r.rolcreatedb as can_create_db,
        r.rolcanlogin as can_login,
        CASE 
            WHEN r.rolsuper THEN 'ÉLEVÉ: Rôle superutilisateur'
            WHEN r.rolcreaterole AND r.rolcreatedb THEN 'MOYEN: Peut créer rôles et bases'
            WHEN r.rolcreaterole OR r.rolcreatedb THEN 'FAIBLE: Peut créer rôles ou bases'
            ELSE 'FAIBLE: Permissions limitées'
        END as security_risk
    FROM pg_roles r
    WHERE r.rolcanlogin = true
    ORDER BY 
        CASE 
            WHEN r.rolsuper THEN 1
            WHEN r.rolcreaterole AND r.rolcreatedb THEN 2
            WHEN r.rolcreaterole OR r.rolcreatedb THEN 3
            ELSE 4
        END;
END;
$$;

-- ==============================================
-- 4. RAPPORT DE SÉCURITÉ COMPLET
-- ==============================================

-- Fonction pour générer un rapport de sécurité complet
CREATE OR REPLACE FUNCTION generate_security_report()
RETURNS TABLE(
    report_section TEXT,
    findings TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    version_info RECORD;
    config_info RECORD;
    findings TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Section 1: Version Postgres
    SELECT * INTO version_info FROM check_postgres_security_status();
    
    findings := ARRAY[
        'Version: ' || version_info.version,
        'Version numérique: ' || version_info.version_number,
        'Dernière version: ' || CASE WHEN version_info.is_latest THEN 'Oui' ELSE 'Non' END
    ];
    
    findings := array_cat(findings, version_info.security_recommendations);
    
    RETURN QUERY SELECT 'VERSION POSTGRES' as report_section, findings;
    
    -- Section 2: Configuration de sécurité
    findings := ARRAY[]::TEXT[];
    
    FOR config_info IN 
        SELECT * FROM check_postgres_security_config()
    LOOP
        findings := array_append(findings, 
            config_info.setting_name || ': ' || 
            config_info.current_value || ' (' || 
            CASE WHEN config_info.is_secure THEN 'SÉCURISÉ' ELSE 'ATTENTION' END || ') - ' ||
            config_info.description
        );
    END LOOP;
    
    RETURN QUERY SELECT 'CONFIGURATION SÉCURITÉ' as report_section, findings;
    
    -- Section 3: Permissions
    findings := ARRAY[]::TEXT[];
    
    FOR config_info IN 
        SELECT * FROM check_security_permissions()
    LOOP
        findings := array_append(findings, 
            'Rôle: ' || config_info.role_name || 
            ' - Risque: ' || config_info.security_risk
        );
    END LOOP;
    
    RETURN QUERY SELECT 'PERMISSIONS UTILISATEURS' as report_section, findings;
END;
$$;

-- ==============================================
-- 5. FONCTION DE MAINTENANCE SÉCURITÉ
-- ==============================================

-- Fonction pour effectuer des vérifications de sécurité régulières
CREATE OR REPLACE FUNCTION perform_security_audit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    audit_result RECORD;
BEGIN
    -- Afficher le rapport de sécurité
    FOR audit_result IN 
        SELECT * FROM generate_security_report()
    LOOP
        RAISE NOTICE '=== % ===', audit_result.report_section;
        FOR i IN 1..array_length(audit_result.findings, 1) LOOP
            RAISE NOTICE '%', audit_result.findings[i];
        END LOOP;
    END LOOP;
    
    -- Vérifier les connexions actives suspectes
    IF EXISTS (
        SELECT 1 FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query NOT LIKE '%pg_stat_activity%'
        AND query NOT LIKE '%generate_security_report%'
        AND query NOT LIKE '%perform_security_audit%'
    ) THEN
        RAISE NOTICE 'ATTENTION: Activité suspecte détectée dans les connexions actives';
    END IF;
    
    RAISE NOTICE 'Audit de sécurité terminé à %', NOW();
END;
$$;

-- ==============================================
-- 6. COMMENTAIRES ET DOCUMENTATION
-- ==============================================

COMMENT ON FUNCTION check_postgres_security_status() IS 'Vérifie la version Postgres et les recommandations de sécurité';
COMMENT ON FUNCTION check_postgres_security_config() IS 'Vérifie les configurations de sécurité Postgres';
COMMENT ON FUNCTION check_security_permissions() IS 'Vérifie les permissions des utilisateurs';
COMMENT ON FUNCTION generate_security_report() IS 'Génère un rapport de sécurité complet';
COMMENT ON FUNCTION perform_security_audit() IS 'Effectue un audit de sécurité complet';

-- ==============================================
-- 7. EXÉCUTION DE L'AUDIT INITIAL
-- ==============================================

-- Exécuter l'audit de sécurité initial
DO $$
BEGIN
    PERFORM perform_security_audit();
END $$;
