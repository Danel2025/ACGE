import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = now.getTime() - targetDate.getTime()
  
  const minutes = Math.floor(diffInMs / (1000 * 60))
  const hours = Math.floor(diffInMs / (1000 * 60 * 60))
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  
  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
  if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
  if (weeks < 4) return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  if (months < 12) return `Il y a ${months} mois`
  
  return targetDate.toLocaleDateString('fr-FR')
}

export function getFileTypeLabel(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLSX'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPTX'
  if (mimeType.includes('image')) return 'IMG'
  if (mimeType.includes('text')) return 'TXT'
  if (mimeType.includes('video')) return 'VID'
  if (mimeType.includes('audio')) return 'AUD'
  
  return 'FICHIER'
}
