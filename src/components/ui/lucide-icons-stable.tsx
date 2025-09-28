'use client'

/**
 * Composants d'icônes Lucide React stabilisés pour éviter les problèmes HMR avec Turbopack
 * Ce fichier sert de wrapper pour contourner les problèmes connus de Next.js 15 + Turbopack + HMR
 * Voir: https://github.com/vercel/next.js/issues/74167
 */

import { forwardRef } from 'react'
import { LucideProps } from 'lucide-react'

// Cache pour les icônes déjà chargées
const iconCache = new Map<string, React.ComponentType<LucideProps>>()

// Import statique sécurisé pour éviter les problèmes HMR avec Turbopack
const importIcon = (iconName: string): React.ComponentType<LucideProps> => {
  // Vérifier le cache d'abord
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!
  }

  try {
    // Import statique des icônes les plus communes
    const iconMap: Record<string, React.ComponentType<LucideProps>> = {
      euro: require('lucide-react').Euro,
      // Ajouter d'autres icônes au besoin
    }

    if (iconMap[iconName]) {
      iconCache.set(iconName, iconMap[iconName])
      return iconMap[iconName]
    }

    // Fallback pour les icônes non listées - utiliser require direct sans template string
    let IconComponent: React.ComponentType<LucideProps>

    switch (iconName) {
      case 'alert-triangle': {
        const { AlertTriangle } = require('lucide-react')
        IconComponent = AlertTriangle
        break
      }
      case 'arrow-left': {
        const { ArrowLeft } = require('lucide-react')
        IconComponent = ArrowLeft
        break
      }
      case 'arrow-right': {
        const { ArrowRight } = require('lucide-react')
        IconComponent = ArrowRight
        break
      }
      case 'calendar': {
        const { Calendar } = require('lucide-react')
        IconComponent = Calendar
        break
      }
      case 'check-circle': {
        const { CheckCircle } = require('lucide-react')
        IconComponent = CheckCircle
        break
      }
      case 'clock': {
        const { Clock } = require('lucide-react')
        IconComponent = Clock
        break
      }
      case 'folder-open': {
        const { FolderOpen } = require('lucide-react')
        IconComponent = FolderOpen
        break
      }
      case 'hash': {
        const { Tag } = require('lucide-react')
        IconComponent = Tag
        break
      }
      case 'info': {
        const { Info } = require('lucide-react')
        IconComponent = Info
        break
      }
      case 'mail': {
        const { Mail } = require('lucide-react')
        IconComponent = Mail
        break
      }
      case 'refresh-cw': {
        const { RefreshCw } = require('lucide-react')
        IconComponent = RefreshCw
        break
      }
      case 'settings': {
        const { Settings } = require('lucide-react')
        IconComponent = Settings
        break
      }
      case 'target': {
        const { Target } = require('lucide-react')
        IconComponent = Target
        break
      }
      case 'x-circle': {
        const { XCircle } = require('lucide-react')
        IconComponent = XCircle
        break
      }
      default: {
        // Fallback vers FileText pour les icônes non supportées
        const { FileText } = require('lucide-react')
        IconComponent = FileText
      }
    }

    iconCache.set(iconName, IconComponent)
    return IconComponent
  } catch (error) {
    console.warn(`Failed to load Lucide icon: ${iconName}`, error)
    // Fallback vers une icône générique
    const { FileText } = require('lucide-react')
    iconCache.set(iconName, FileText)
    return FileText
  }
}

// Wrapper générique pour les icônes avec gestion d'erreur
const createStableIcon = (iconName: string) => {
  return forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
    try {
      const IconComponent = importIcon(iconName)
      return <IconComponent {...props} ref={ref} />
    } catch (error) {
      // Fallback silencieux vers FileText si l'icône ne peut pas être chargée
      const { FileText } = require('lucide-react')
      return <FileText {...props} ref={ref} />
    }
  })
}

// Icônes les plus utilisées dans l'application - stabilisées
export const Search = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Search: SearchIcon } = require('lucide-react')
  return <SearchIcon {...props} ref={ref} />
})
Search.displayName = 'Search'

export const FileText = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { FileText: FileTextIcon } = require('lucide-react')
  return <FileTextIcon {...props} ref={ref} />
})
FileText.displayName = 'FileText'

export const Folder = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Folder: FolderIcon } = require('lucide-react')
  return <FolderIcon {...props} ref={ref} />
})
Folder.displayName = 'Folder'

export const Tag = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Tag: TagIcon } = require('lucide-react')
  return <TagIcon {...props} ref={ref} />
})
Tag.displayName = 'Tag'

export const User = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { User: UserIcon } = require('lucide-react')
  return <UserIcon {...props} ref={ref} />
})
User.displayName = 'User'

export const Plus = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Plus: PlusIcon } = require('lucide-react')
  return <PlusIcon {...props} ref={ref} />
})
Plus.displayName = 'Plus'

export const X = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { X: XIcon } = require('lucide-react')
  return <XIcon {...props} ref={ref} />
})
X.displayName = 'X'

export const Check = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Check: CheckIcon } = require('lucide-react')
  return <CheckIcon {...props} ref={ref} />
})
Check.displayName = 'Check'

export const Upload = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Upload: UploadIcon } = require('lucide-react')
  return <UploadIcon {...props} ref={ref} />
})
Upload.displayName = 'Upload'

export const Download = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Download: DownloadIcon } = require('lucide-react')
  return <DownloadIcon {...props} ref={ref} />
})
Download.displayName = 'Download'

export const Edit = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Edit: EditIcon } = require('lucide-react')
  return <EditIcon {...props} ref={ref} />
})
Edit.displayName = 'Edit'

export const Trash2 = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Trash2: Trash2Icon } = require('lucide-react')
  return <Trash2Icon {...props} ref={ref} />
})
Trash2.displayName = 'Trash2'

export const Eye = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Eye: EyeIcon } = require('lucide-react')
  return <EyeIcon {...props} ref={ref} />
})
Eye.displayName = 'Eye'

export const EyeOff = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { EyeOff: EyeOffIcon } = require('lucide-react')
  return <EyeOffIcon {...props} ref={ref} />
})
EyeOff.displayName = 'EyeOff'

export const MoreHorizontal = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { MoreHorizontal: MoreHorizontalIcon } = require('lucide-react')
  return <MoreHorizontalIcon {...props} ref={ref} />
})
MoreHorizontal.displayName = 'MoreHorizontal'

export const Euro = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Euro: EuroIcon } = require('lucide-react')
  return <EuroIcon {...props} ref={ref} />
})
Euro.displayName = 'Euro'

export const ArrowLeft = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { ArrowLeft: ArrowLeftIcon } = require('lucide-react')
  return <ArrowLeftIcon {...props} ref={ref} />
})
ArrowLeft.displayName = 'ArrowLeft'

export const ArrowRight = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { ArrowRight: ArrowRightIcon } = require('lucide-react')
  return <ArrowRightIcon {...props} ref={ref} />
})
ArrowRight.displayName = 'ArrowRight'

export const Calendar = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Calendar: CalendarIcon } = require('lucide-react')
  return <CalendarIcon {...props} ref={ref} />
})
Calendar.displayName = 'Calendar'

export const AlertTriangle = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { AlertTriangle: AlertTriangleIcon } = require('lucide-react')
  return <AlertTriangleIcon {...props} ref={ref} />
})
AlertTriangle.displayName = 'AlertTriangle'

export const Info = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Info: InfoIcon } = require('lucide-react')
  return <InfoIcon {...props} ref={ref} />
})
Info.displayName = 'Info'

export const Settings = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
  const { Settings: SettingsIcon } = require('lucide-react')
  return <SettingsIcon {...props} ref={ref} />
})
Settings.displayName = 'Settings'

// Export pour l'utilisation générique avec nom d'icône dynamique
export const DynamicLucideIcon = createStableIcon

// Réexporter les types pour la compatibilité
export type { LucideProps } from 'lucide-react'