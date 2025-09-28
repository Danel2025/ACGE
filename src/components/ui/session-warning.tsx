'use client'

import { useState, useEffect } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle } from 'lucide-react'

interface SessionWarningProps {
  timeUntilExpiration: number
  onExtendSession: () => void
  onLogout: () => void
  warningThreshold?: number // en secondes, défaut: 60 secondes
}

export function SessionWarning({ 
  timeUntilExpiration, 
  onExtendSession, 
  onLogout, 
  warningThreshold = 60 
}: SessionWarningProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeUntilExpiration)

  useEffect(() => {
    // Afficher l'avertissement quand il reste moins de warningThreshold secondes
    if (timeUntilExpiration <= warningThreshold * 1000 && timeUntilExpiration > 0) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [timeUntilExpiration, warningThreshold])

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000
        if (newTime <= 0) {
          onLogout()
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, onLogout])

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleExtendSession = () => {
    onExtendSession()
    setIsOpen(false)
  }

  const handleLogout = () => {
    onLogout()
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Session sur le point d'expirer
          </AlertDialogTitle>
          <AlertDialogDescription>
            Votre session va expirer dans <strong>{formatTime(timeLeft)}</strong>.
            <br />
            Voulez-vous prolonger votre session ou vous déconnecter ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            Se déconnecter
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession} className="bg-primary">
            <Clock className="h-4 w-4 mr-2" />
            Prolonger la session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
