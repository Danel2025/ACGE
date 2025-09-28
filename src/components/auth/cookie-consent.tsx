'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Cookie, Shield, Info } from 'lucide-react'

interface CookieConsentProps {
  isOpen: boolean
  onAccept: (rememberChoice: boolean) => void
  onDecline: () => void
}

export function CookieConsent({ isOpen, onAccept, onDecline }: CookieConsentProps) {
  const [rememberChoice, setRememberChoice] = useState(false)

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Cookie className="h-5 w-5 text-primary" />
            <AlertDialogTitle className="text-lg font-title-semibold">
              Consentement aux cookies
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Pour votre sécurité, nous devons obtenir votre consentement avant de vous reconnecter automatiquement via les cookies. Si vous refusez, vous devrez vous reconnecter à chaque visite pour des raisons de sécurité.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Protection contre l'accès non autorisé sur navigateurs partagés
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              Vous pouvez modifier ce choix à tout moment
            </span>
          </div>
        </div>

        <div className="my-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-choice"
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked as boolean)}
            />
            <label
              htmlFor="remember-choice"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Se souvenir de mon choix pour cette session
            </label>
          </div>
        </div>

        <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
          <AlertDialogCancel
            onClick={onDecline}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Refuser
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onAccept(rememberChoice)}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Accepter les cookies
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook pour gérer le consentement aux cookies
export function useCookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement pour cette session
    const sessionConsent = sessionStorage.getItem('cookie-consent')
    const persistentConsent = localStorage.getItem('cookie-consent-persistent')

    if (sessionConsent === 'accepted' || persistentConsent === 'accepted') {
      setHasConsent(true)
    } else if (sessionConsent === 'declined-temp') {
      setHasConsent(false)
    } else {
      setHasConsent(null)
    }
  }, [])

  const requestConsent = () => {
    if (hasConsent === null) {
      setShowConsent(true)
      return false // Pas de consentement, demander
    }
    return hasConsent // Retourner le consentement existant
  }

  const handleAccept = (rememberChoice: boolean) => {
    setHasConsent(true)
    setShowConsent(false)

    // Sauvegarder le consentement
    sessionStorage.setItem('cookie-consent', 'accepted')
    if (rememberChoice) {
      localStorage.setItem('cookie-consent-persistent', 'accepted')
    }
  }

  const handleDecline = () => {
    setHasConsent(false)
    setShowConsent(false)

    // Sauvegarder le refus pour cette tentative seulement (pas de persistence)
    sessionStorage.setItem('cookie-consent', 'declined-temp')
  }

  const clearConsent = () => {
    setHasConsent(null)
    sessionStorage.removeItem('cookie-consent')
    localStorage.removeItem('cookie-consent-persistent')
  }

  return {
    showConsent,
    hasConsent,
    requestConsent,
    handleAccept,
    handleDecline,
    clearConsent,
  }
}