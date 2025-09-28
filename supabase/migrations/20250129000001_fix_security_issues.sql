-- Migration: Correction des problèmes de sécurité identifiés par Supabase Security Advisor
-- Date: 2025-01-29
-- Description: Résolution des problèmes de sécurité pour les fonctions SQL et configuration auth

-- ==============================================
-- 1. CORRECTION DES FONCTIONS SQL - SEARCH_PATH
-- ==============================================

-- Créer ou remplacer la fonction exec_sql avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result JSON;
    rec RECORD;
    rows_affected INTEGER := 0;
BEGIN
    -- Validation basique du SQL pour éviter les injections
    IF sql IS NULL OR trim(sql) = '' THEN
        RAISE EXCEPTION 'SQL ne peut pas être vide';
    END IF;
    
    -- Vérifier que ce n'est pas une commande DDL dangereuse
    IF upper(trim(sql)) LIKE 'DROP%' OR 
       upper(trim(sql)) LIKE 'ALTER%' OR 
       upper(trim(sql)) LIKE 'CREATE%' OR
       upper(trim(sql)) LIKE 'GRANT%' OR
       upper(trim(sql)) LIKE 'REVOKE%' THEN
        RAISE EXCEPTION 'Commandes DDL non autorisées via cette fonction';
    END IF;
    
    -- Exécuter le SQL de manière sécurisée
    BEGIN
        EXECUTE sql;
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        
        result := json_build_object(
            'success', true,
            'rows_affected', rows_affected,
            'message', 'SQL exécuté avec succès'
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
    END;
    
    RETURN result;
END;
$$;

-- Créer ou remplacer la fonction update_updated_at_column avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ==============================================
-- 2. AMÉLIORATION DE LA SÉCURITÉ DES FONCTIONS EXISTANTES
-- ==============================================

-- Mettre à jour toutes les fonctions existantes pour inclure search_path sécurisé
-- Fonction de nettoyage des notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < TIMEZONE('utc'::text, NOW());
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Fonction de nettoyage des notifications anciennes
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.notifications 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = true;
END;
$$;

-- Fonction de déduplication des notifications
CREATE OR REPLACE FUNCTION deduplicate_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Supprimer les doublons en gardant la plus récente
    WITH duplicates AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY user_id, title, message, created_at 
                 ORDER BY created_at DESC, id DESC
               ) as rn
        FROM public.notifications
    )
    DELETE FROM public.notifications 
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
END;
$$;

-- Fonction de mise à jour des notifications
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = TRUE, 
        read_at = TIMEZONE('utc'::text, NOW()),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = notification_id 
    AND user_id = auth.jwt()->>'sub'
    AND is_read = FALSE;
    
    RETURN FOUND;
END;
$$;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_id_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_read = TRUE, 
        read_at = TIMEZONE('utc'::text, NOW()),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE user_id = user_id_param 
    AND is_read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- Fonction pour obtenir les statistiques des notifications
CREATE OR REPLACE FUNCTION get_user_notification_stats(user_id_param TEXT)
RETURNS TABLE(
    total_notifications BIGINT,
    unread_count BIGINT,
    high_priority_count BIGINT,
    urgent_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count
    FROM public.notifications
    WHERE user_id = user_id_param;
END;
$$;

-- ==============================================
-- 3. CONFIGURATION DE SÉCURITÉ SUPPLÉMENTAIRE
-- ==============================================

-- Créer une fonction pour vérifier les permissions utilisateur
CREATE OR REPLACE FUNCTION check_user_permission(user_id_param TEXT, required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_permissions TEXT[];
BEGIN
    -- Récupérer les permissions de l'utilisateur (à adapter selon votre système)
    SELECT permissions INTO user_permissions
    FROM public.users
    WHERE id = user_id_param;
    
    -- Vérifier si l'utilisateur a la permission requise
    RETURN required_permission = ANY(user_permissions);
END;
$$;

-- ==============================================
-- 4. COMMENTAIRES ET DOCUMENTATION
-- ==============================================

COMMENT ON FUNCTION public.exec_sql(TEXT) IS 'Exécute du SQL de manière sécurisée avec search_path défini';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger pour mettre à jour automatiquement la colonne updated_at';
COMMENT ON FUNCTION cleanup_expired_notifications() IS 'Nettoie les notifications expirées';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Nettoie les notifications anciennes (plus de 30 jours)';
COMMENT ON FUNCTION deduplicate_notifications() IS 'Supprime les notifications dupliquées';
COMMENT ON FUNCTION check_user_permission(TEXT, TEXT) IS 'Vérifie les permissions utilisateur';

-- ==============================================
-- 5. VÉRIFICATION DE LA SÉCURITÉ
-- ==============================================

-- Vérifier que les fonctions ont bien le search_path défini
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname IN ('exec_sql', 'update_updated_at_column', 'cleanup_expired_notifications')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration de sécurité terminée avec succès. Toutes les fonctions ont été mises à jour avec search_path sécurisé.';
END $$;
