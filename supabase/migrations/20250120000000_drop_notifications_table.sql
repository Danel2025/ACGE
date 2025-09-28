-- Suppression de la table notifications et de toutes ses dépendances
-- Migration pour supprimer complètement le système de notifications

-- Supprimer les politiques RLS liées aux notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Supprimer les index liés aux notifications
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_read_at;

-- Supprimer la table notifications
DROP TABLE IF EXISTS notifications;

-- Supprimer le type enum notification_type s'il existe
DROP TYPE IF EXISTS notification_type;
