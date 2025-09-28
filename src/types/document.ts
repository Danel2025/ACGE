/**
 * Types partagés pour les documents dans l'application
 */

export interface DocumentAuthor {
  id: string
  name: string
  email: string
}

export interface DocumentFolder {
  id: string
  name: string
}

export interface DocumentTag {
  id: string
  name: string
}

export interface DocumentCounts {
  comments?: number
  shares?: number
}

export interface DocumentItem {
  id: string
  originalId?: string       // ID original UUID de la base de données
  title: string
  description?: string | null
  fileName?: string | null  // Correspond au champ file_name de Supabase
  fileSize?: number | null  // Correspond au champ file_size de Supabase
  fileType?: string | null  // Correspond au champ file_type de Supabase
  filePath?: string | null  // Correspond au champ file_path de Supabase
  category?: string | null  // Correspond au champ category de Supabase
  isPublic?: boolean        // Correspond au champ is_public de Supabase
  createdAt: string         // Correspond au champ created_at de Supabase
  updatedAt?: string        // Correspond au champ updated_at de Supabase
  tags?: DocumentTag[]      // Correspond au champ tags de Supabase
  folder?: DocumentFolder
  folderId?: string | null  // Correspond au champ folder_id de Supabase
  author: DocumentAuthor    // Correspond au champ author_id de Supabase
  authorId?: string         // Correspond au champ author_id de Supabase
  _count?: DocumentCounts
}

export interface DocumentPreviewProps {
  document: DocumentItem
  isOpen: boolean
  onClose: () => void
}

export interface DocumentEditProps {
  document: DocumentItem
  isOpen: boolean
  onClose: () => void
  onSave: (updatedDocument: DocumentItem) => void
}

export interface DocumentShareProps {
  document: DocumentItem
  isOpen: boolean
  onClose: () => void
  onShared: () => void
}
