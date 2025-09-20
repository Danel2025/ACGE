'use client'

import { memo } from 'react'
import { 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  CheckCircle, 
  XCircle, 
  ArrowRight 
} from 'lucide-react'

// Composants d'icônes mémorisés pour éviter les re-renders
export const OptimizedAlertTriangle = memo(AlertTriangle)
export const OptimizedEye = memo(Eye)
export const OptimizedEyeOff = memo(EyeOff)
export const OptimizedMail = memo(Mail)
export const OptimizedLock = memo(Lock)
export const OptimizedCheckCircle = memo(CheckCircle)
export const OptimizedXCircle = memo(XCircle)
export const OptimizedArrowRight = memo(ArrowRight)

// Export groupé pour faciliter l'import
export const LoginIcons = {
  AlertTriangle: OptimizedAlertTriangle,
  Eye: OptimizedEye,
  EyeOff: OptimizedEyeOff,
  Mail: OptimizedMail,
  Lock: OptimizedLock,
  CheckCircle: OptimizedCheckCircle,
  XCircle: OptimizedXCircle,
  ArrowRight: OptimizedArrowRight,
}
