-- Migration: Créer la table notifications avec une structure propre
-- Date: 2025-01-23
-- Description: Créer un système de notifications moderne et flexible pour l'application ACGE

-- Créer le type enum pour les types de notifications
CREATE TYPE notification_type AS ENUM (
    'INFO',           -- Information générale
    'WARNING',        -- Avertissement
    'ERROR',          -- Erreur
    'SUCCESS',        -- Succès
    'VALIDATION',     -- Demande de validation
    'REJECTION',      -- Rejet de dossier
    'APPROVAL',       -- Approbation de dossier
    'SYSTEM'          -- Notification système
);

-- Créer le type enum pour les priorités
CREATE TYPE notification_priority AS ENUM (
    'LOW',            -- Priorité faible
    'MEDIUM',         -- Priorité moyenne
    'HIGH',           -- Priorité élevée
    'URGENT'          -- Priorité urgente
);

-- Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'INFO',
    priority notification_priority NOT NULL DEFAULT 'MEDIUM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT, -- URL vers la page concernée
    action_label TEXT, -- Label du bouton d'action
    metadata JSONB, -- Données supplémentaires (ex: dossier_id, document_id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- Créer un index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Permettre l'accès à la table pour le service role
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.notifications TO postgres;

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.jwt()->>'sub' = user_id);

-- Politique RLS : les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.jwt()->>'sub' = user_id);

-- Politique RLS : le service role peut insérer des notifications
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Politique RLS : le service role peut supprimer des notifications
CREATE POLICY "Service role can delete notifications" ON public.notifications
    FOR DELETE USING (auth.jwt()->>'role' = 'service_role');

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_id_param TEXT)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < TIMEZONE('utc'::text, NOW());
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des notifications d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_notification_stats(user_id_param TEXT)
RETURNS TABLE(
    total_notifications BIGINT,
    unread_count BIGINT,
    high_priority_count BIGINT,
    urgent_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
        COUNT(*) FILTER (WHERE priority = 'HIGH' AND is_read = FALSE) as high_priority_count,
        COUNT(*) FILTER (WHERE priority = 'URGENT' AND is_read = FALSE) as urgent_count
    FROM public.notifications 
    WHERE user_id = user_id_param
    AND (expires_at IS NULL OR expires_at > TIMEZONE('utc'::text, NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.notifications IS 'Système de notifications pour l''application ACGE';
COMMENT ON COLUMN public.notifications.user_id IS 'ID de l''utilisateur destinataire de la notification';
COMMENT ON COLUMN public.notifications.title IS 'Titre de la notification';
COMMENT ON COLUMN public.notifications.message IS 'Message détaillé de la notification';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification (INFO, WARNING, ERROR, etc.)';
COMMENT ON COLUMN public.notifications.priority IS 'Priorité de la notification (LOW, MEDIUM, HIGH, URGENT)';
COMMENT ON COLUMN public.notifications.is_read IS 'Indique si la notification a été lue';
COMMENT ON COLUMN public.notifications.read_at IS 'Date et heure de lecture de la notification';
COMMENT ON COLUMN public.notifications.expires_at IS 'Date d''expiration de la notification (optionnel)';
COMMENT ON COLUMN public.notifications.action_url IS 'URL vers la page concernée par la notification';
COMMENT ON COLUMN public.notifications.action_label IS 'Label du bouton d''action';
COMMENT ON COLUMN public.notifications.metadata IS 'Données supplémentaires au format JSON';
