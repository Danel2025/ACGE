import { useState, useCallback } from 'react'
import { Notification } from '@/types'
import { downloadFile } from '@/lib/download-utils'

interface UseNotificationActionsProps {
  notifications: Notification[]
  onRefresh: () => Promise<void>
}

export function useNotificationActions({ notifications, onRefresh }: UseNotificationActionsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Export CSV
  const exportToCSV = useCallback(async (selectedIds?: string[]) => {
    setIsExporting(true)
    try {
      const notificationsToExport = selectedIds 
        ? notifications.filter(n => selectedIds.includes(n.id))
        : notifications

      const headers = ['Titre', 'Message', 'Type', 'Priorité', 'Statut', 'Date de création', 'Date de lecture']
      const csvContent = [
        headers.join(','),
        ...notificationsToExport.map(notification => [
          `"${notification.title.replace(/"/g, '""')}"`,
          `"${notification.message.replace(/"/g, '""')}"`,
          `"${notification.type}"`,
          `"${notification.priority}"`,
          `"${notification.is_read ? 'Lue' : 'Non lue'}"`,
          `"${new Date(notification.created_at).toLocaleString('fr-FR')}"`,
          `"${notification.read_at ? new Date(notification.read_at).toLocaleString('fr-FR') : ''}"`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const fileName = `notifications_${new Date().toISOString().split('T')[0]}.csv`
      await downloadFile(blob, fileName)
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [notifications])

  // Export PDF (simulation - dans un vrai projet, utiliser une lib comme jsPDF)
  const exportToPDF = useCallback(async (selectedIds?: string[]) => {
    setIsExporting(true)
    try {
      const notificationsToExport = selectedIds 
        ? notifications.filter(n => selectedIds.includes(n.id))
        : notifications

      // Simulation d'export PDF - dans un vrai projet, utiliser jsPDF
      const pdfContent = `
        RAPPORT DE NOTIFICATIONS
        Généré le ${new Date().toLocaleString('fr-FR')}
        
        ${notificationsToExport.map((notification, index) => `
        ${index + 1}. ${notification.title}
           Type: ${notification.type}
           Priorité: ${notification.priority}
           Statut: ${notification.is_read ? 'Lue' : 'Non lue'}
           Date: ${new Date(notification.created_at).toLocaleString('fr-FR')}
           Message: ${notification.message}
        `).join('\n')}
      `

      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const fileName = `notifications_${new Date().toISOString().split('T')[0]}.txt`
      await downloadFile(blob, fileName)
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [notifications])

  // Suppression en lot
  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    setIsDeleting(true)
    try {
      // TODO: Implémenter l'API de suppression en lot
      console.log('Suppression des notifications:', notificationIds)
      
      // Simulation d'une suppression
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Rafraîchir les notifications
      await onRefresh()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [onRefresh])

  // Marquer en lot comme lu
  const markAsReadBulk = useCallback(async (notificationIds: string[], markAsRead: (id: string) => Promise<boolean>) => {
    try {
      const promises = notificationIds.map(id => markAsRead(id))
      await Promise.all(promises)
    } catch (error) {
      console.error('Erreur lors du marquage en lot:', error)
      throw error
    }
  }, [])

  return {
    isExporting,
    isDeleting,
    exportToCSV,
    exportToPDF,
    deleteNotifications,
    markAsReadBulk
  }
}
