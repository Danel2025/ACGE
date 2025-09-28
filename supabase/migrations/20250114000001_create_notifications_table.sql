-- Créer le type enum pour les types de notifications
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'INFO', 'WARNING', 'ERROR', 'SUCCESS', 'VALIDATION', 'REJECTION', 'APPROVAL', 'SYSTEM'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Créer le type enum pour les priorités
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM (
    'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
  action_url TEXT,
  action_label TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Les utilisateurs peuvent voir leurs propres notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- Les utilisateurs peuvent marquer leurs propres notifications comme lues
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id);

-- Les admins peuvent insérer des notifications pour n'importe quel utilisateur
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'ADMIN');

-- Les admins peuvent supprimer n'importe quelle notification
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.jwt()->>'role' = 'ADMIN');

-- Créer des fonctions RPC pour la gestion des notifications
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(user_id_param TEXT)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
  WHERE user_id = user_id_param AND is_read = FALSE
  RETURNING 1 INTO updated_count;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques de notifications d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_notification_stats(user_id_param TEXT)
RETURNS TABLE (
  totalNotifications BIGINT,
  unreadCount BIGINT,
  highPriorityCount BIGINT,
  urgentCount BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS totalNotifications,
    COUNT(CASE WHEN NOT is_read THEN 1 END)::BIGINT AS unreadCount,
    COUNT(CASE WHEN priority = 'HIGH' AND NOT is_read THEN 1 END)::BIGINT AS highPriorityCount,
    COUNT(CASE WHEN priority = 'URGENT' AND NOT is_read THEN 1 END)::BIGINT AS urgentCount
  FROM public.notifications
  WHERE user_id = user_id_param AND (expires_at IS NULL OR expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to the authenticated role for RPC functions
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_as_read(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notification_stats(TEXT) TO authenticated;
