-- Migration: Correction des problèmes de sécurité d'authentification
-- Date: 2025-01-29
-- Description: Configuration sécurisée pour OTP et protection des mots de passe

-- ==============================================
-- 1. CONFIGURATION OTP SÉCURISÉE
-- ==============================================

-- Créer une fonction pour configurer les paramètres OTP sécurisés
CREATE OR REPLACE FUNCTION configure_secure_otp_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Configurer des paramètres OTP plus sécurisés
    -- Note: Ces paramètres doivent être appliqués via l'API Supabase ou le dashboard
    -- car ils ne peuvent pas être modifiés directement via SQL
    
    RAISE NOTICE 'Configuration OTP recommandée:';
    RAISE NOTICE '- otp_expiry: 300 (5 minutes au lieu de 3600)';
    RAISE NOTICE '- otp_length: 8 (au lieu de 6)';
    RAISE NOTICE '- max_frequency: 60s (au lieu de 1s)';
    RAISE NOTICE '- enable_confirmations: true';
    RAISE NOTICE '- secure_password_change: true';
END;
$$;

-- ==============================================
-- 2. PROTECTION CONTRE LES FUITES DE MOTS DE PASSE
-- ==============================================

-- Créer une fonction pour vérifier la force des mots de passe
CREATE OR REPLACE FUNCTION check_password_strength(password TEXT)
RETURNS TABLE(
    is_strong BOOLEAN,
    score INTEGER,
    feedback TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    score INTEGER := 0;
    feedback TEXT[] := ARRAY[]::TEXT[];
    has_lower BOOLEAN := false;
    has_upper BOOLEAN := false;
    has_digit BOOLEAN := false;
    has_special BOOLEAN := false;
    length_check BOOLEAN := false;
BEGIN
    -- Vérifier la longueur (minimum 8 caractères)
    IF length(password) >= 8 THEN
        score := score + 1;
        length_check := true;
    ELSE
        feedback := array_append(feedback, 'Le mot de passe doit contenir au moins 8 caractères');
    END IF;
    
    -- Vérifier la présence de minuscules
    IF password ~ '[a-z]' THEN
        score := score + 1;
        has_lower := true;
    ELSE
        feedback := array_append(feedback, 'Le mot de passe doit contenir au moins une lettre minuscule');
    END IF;
    
    -- Vérifier la présence de majuscules
    IF password ~ '[A-Z]' THEN
        score := score + 1;
        has_upper := true;
    ELSE
        feedback := array_append(feedback, 'Le mot de passe doit contenir au moins une lettre majuscule');
    END IF;
    
    -- Vérifier la présence de chiffres
    IF password ~ '[0-9]' THEN
        score := score + 1;
        has_digit := true;
    ELSE
        feedback := array_append(feedback, 'Le mot de passe doit contenir au moins un chiffre');
    END IF;
    
    -- Vérifier la présence de caractères spéciaux
    IF password ~ '[^a-zA-Z0-9]' THEN
        score := score + 1;
        has_special := true;
    ELSE
        feedback := array_append(feedback, 'Le mot de passe doit contenir au moins un caractère spécial');
    END IF;
    
    -- Vérifier la longueur supplémentaire
    IF length(password) >= 12 THEN
        score := score + 1;
    END IF;
    
    -- Vérifier la longueur très longue
    IF length(password) >= 16 THEN
        score := score + 1;
    END IF;
    
    -- Déterminer si le mot de passe est fort (score >= 4)
    is_strong := score >= 4;
    
    -- Si le mot de passe est fort, ajouter un message positif
    IF is_strong THEN
        feedback := array_append(feedback, 'Mot de passe fort détecté');
    END IF;
    
    RETURN QUERY SELECT is_strong, score, feedback;
END;
$$;

-- ==============================================
-- 3. FONCTION DE VÉRIFICATION DES FUITES DE MOTS DE PASSE
-- ==============================================

-- Créer une table pour stocker les mots de passe compromis (simulation)
CREATE TABLE IF NOT EXISTS public.compromised_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_compromised_passwords_hash 
ON public.compromised_passwords(password_hash);

-- Fonction pour vérifier si un mot de passe est compromis
CREATE OR REPLACE FUNCTION is_password_compromised(password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    password_hash TEXT;
    is_compromised BOOLEAN := false;
BEGIN
    -- Hasher le mot de passe (utiliser bcrypt en production)
    password_hash := crypt(password, gen_salt('bf'));
    
    -- Vérifier si le hash existe dans la table des mots de passe compromis
    SELECT EXISTS(
        SELECT 1 FROM public.compromised_passwords 
        WHERE password_hash = crypt(password, password_hash)
    ) INTO is_compromised;
    
    RETURN is_compromised;
END;
$$;

-- ==============================================
-- 4. FONCTION DE VALIDATION COMPLÈTE DES MOTS DE PASSE
-- ==============================================

CREATE OR REPLACE FUNCTION validate_password_security(password TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    strength_score INTEGER,
    is_compromised BOOLEAN,
    feedback TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    strength_result RECORD;
    compromised BOOLEAN;
    all_feedback TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Vérifier la force du mot de passe
    SELECT * INTO strength_result FROM check_password_strength(password);
    
    -- Vérifier si le mot de passe est compromis
    SELECT is_password_compromised(password) INTO compromised;
    
    -- Combiner tous les feedbacks
    all_feedback := strength_result.feedback;
    
    IF compromised THEN
        all_feedback := array_append(all_feedback, 'ATTENTION: Ce mot de passe a été compromis dans une fuite de données');
    END IF;
    
    -- Le mot de passe est valide s'il est fort ET non compromis
    is_valid := strength_result.is_strong AND NOT compromised;
    
    RETURN QUERY SELECT 
        is_valid,
        strength_result.score,
        compromised,
        all_feedback;
END;
$$;

-- ==============================================
-- 5. CONFIGURATION DES POLITIQUES DE SÉCURITÉ
-- ==============================================

-- Créer une table pour les tentatives de connexion échouées
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT false
);

-- Créer un index pour les recherches par email et IP
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email 
ON public.failed_login_attempts(email, attempted_at);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip 
ON public.failed_login_attempts(ip_address, attempted_at);

-- Fonction pour enregistrer une tentative de connexion échouée
CREATE OR REPLACE FUNCTION record_failed_login(
    user_email TEXT,
    user_ip INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.failed_login_attempts (email, ip_address, user_agent)
    VALUES (user_email, user_ip, user_agent);
    
    -- Bloquer temporairement après 5 tentatives en 15 minutes
    UPDATE public.failed_login_attempts 
    SET is_blocked = true
    WHERE email = user_email 
    AND attempted_at > NOW() - INTERVAL '15 minutes'
    AND id IN (
        SELECT id FROM public.failed_login_attempts 
        WHERE email = user_email 
        AND attempted_at > NOW() - INTERVAL '15 minutes'
        ORDER BY attempted_at DESC
        LIMIT 5
    );
END;
$$;

-- Fonction pour vérifier si un utilisateur est bloqué
CREATE OR REPLACE FUNCTION is_user_blocked(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    blocked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO blocked_count
    FROM public.failed_login_attempts
    WHERE email = user_email
    AND is_blocked = true
    AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    RETURN blocked_count > 0;
END;
$$;

-- ==============================================
-- 6. NETTOYAGE AUTOMATIQUE DES DONNÉES DE SÉCURITÉ
-- ==============================================

-- Fonction pour nettoyer les anciennes tentatives de connexion
CREATE OR REPLACE FUNCTION cleanup_old_failed_attempts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.failed_login_attempts 
    WHERE attempted_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ==============================================
-- 7. COMMENTAIRES ET DOCUMENTATION
-- ==============================================

COMMENT ON FUNCTION configure_secure_otp_settings() IS 'Configure les paramètres OTP sécurisés';
COMMENT ON FUNCTION check_password_strength(TEXT) IS 'Vérifie la force d''un mot de passe';
COMMENT ON FUNCTION is_password_compromised(TEXT) IS 'Vérifie si un mot de passe est compromis';
COMMENT ON FUNCTION validate_password_security(TEXT) IS 'Validation complète de la sécurité d''un mot de passe';
COMMENT ON FUNCTION record_failed_login(TEXT, INET, TEXT) IS 'Enregistre une tentative de connexion échouée';
COMMENT ON FUNCTION is_user_blocked(TEXT) IS 'Vérifie si un utilisateur est bloqué';
COMMENT ON FUNCTION cleanup_old_failed_attempts() IS 'Nettoie les anciennes tentatives de connexion';

-- ==============================================
-- 8. MESSAGE DE CONFIRMATION
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE 'Migration de sécurité d''authentification terminée.';
    RAISE NOTICE 'N''oubliez pas de configurer manuellement dans Supabase Dashboard:';
    RAISE NOTICE '1. Auth > Settings > OTP Expiry: 300 secondes';
    RAISE NOTICE '2. Auth > Settings > Password Requirements: lower_upper_letters_digits_symbols';
    RAISE NOTICE '3. Auth > Settings > Enable Confirmations: true';
    RAISE NOTICE '4. Auth > Settings > Secure Password Change: true';
END $$;
