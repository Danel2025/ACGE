-- Migration: Ajouter des contraintes uniques pour éviter les doublons
-- Date: 2025-01-14
-- Description: Prévenir les notifications dupliquées et améliorer la persistance

-- Ajouter une contrainte unique sur (user_id, title, message, created_at)
-- pour éviter les notifications exactement identiques
ALTER TABLE public.notifications 
ADD CONSTRAINT unique_notification_content 
UNIQUE (user_id, title, message, created_at);

-- Ajouter un index pour améliorer les performances des requêtes de déduplication
CREATE INDEX IF NOT EXISTS idx_notifications_deduplication 
ON public.notifications(user_id, title, message, created_at);

-- Créer une fonction pour nettoyer les notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour nettoyer les notifications anciennes (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour dédupliquer les notifications
CREATE OR REPLACE FUNCTION deduplicate_notifications()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Créer une vue pour les statistiques des notifications
CREATE OR REPLACE VIEW notifications_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority_count,
  COUNT(*) FILTER (WHERE priority = 'URGENT') as urgent_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_count,
  MAX(created_at) as last_notification_at
FROM public.notifications
GROUP BY user_id;

-- Créer une fonction pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_notification_stats(p_user_id TEXT)
RETURNS TABLE (
  total_notifications BIGINT,
  unread_count BIGINT,
  high_priority_count BIGINT,
  urgent_count BIGINT,
  recent_count BIGINT,
  last_notification_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(stats.total_notifications, 0),
    COALESCE(stats.unread_count, 0),
    COALESCE(stats.high_priority_count, 0),
    COALESCE(stats.urgent_count, 0),
    COALESCE(stats.recent_count, 0),
    stats.last_notification_at
  FROM notifications_stats stats
  WHERE stats.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Exécuter le nettoyage initial
SELECT deduplicate_notifications();
SELECT cleanup_expired_notifications();
SELECT cleanup_old_notifications();
