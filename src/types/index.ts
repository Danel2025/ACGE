// Types pour l'application GED basés sur le schéma Prisma

// Types de rôles comme chaînes (compatible SQLite)
export type Role = 'ADMIN' | 'SECRETAIRE' | 'CONTROLEUR_BUDGETAIRE' | 'ORDONNATEUR' | 'AGENT_COMPTABLE'

export type Permission = 'READ' | 'WRITE' | 'ADMIN' | 'VALIDATE' | 'ORDONNATE' | 'COMPTABILISE'

// Types pour les notifications
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'VALIDATION' | 'REJECTION' | 'APPROVAL' | 'SYSTEM'
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface User {
  id: string
  name: string | null
  email: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  title: string
  description: string | null
  fileName: string
  fileSize: number
  fileType: string
  filePath: string
  version: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  authorId: string
  folderId: string | null
  dossierId: string | null
  author: User
  tags: Tag[]
  shares: DocumentShare[]
  comments: Comment[]
}

export interface Tag {
  id: string
  name: string
  color: string | null
  createdAt: Date
  documents: Document[]
}

export interface DocumentShare {
  id: string
  permission: Permission
  createdAt: Date
  documentId: string
  userId: string
  document: Document
  user: User
}

export interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  documentId: string
  authorId: string
  document: Document
  author: User
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  isRead: boolean
  readAt: Date | null
  expiresAt: Date | null
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface NotificationStats {
  totalNotifications: number
  unreadCount: number
  highPriorityCount: number
  urgentCount: number
}


// Types pour les formulaires
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface DocumentFormData {
  title: string
  description?: string
  folderId?: string
  tags: string[]
  isPublic: boolean
}

// Types pour les props des composants
export interface DocumentCardProps {
  document: Document
  onEdit?: (document: Document) => void
  onDelete?: (document: Document) => void
  onShare?: (document: Document) => void
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}
