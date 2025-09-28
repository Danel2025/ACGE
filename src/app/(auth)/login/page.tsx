'use client'

import { useState, useEffect, useCallback, lazy, Suspense, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Eye, EyeOff, Mail, Lock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import Image from 'next/image'
import { WebVitals } from '@/components/analytics/web-vitals'
import { LCPOptimizer, LCPImage } from '@/components/optimization/lcp-optimizer'
import { CookieConsent, useCookieConsent } from '@/components/auth/cookie-consent'

// Lazy loading des composants non critiques
const ThemeToggle = lazy(() => import('@/components/ui/theme-toggle').then(mod => ({ default: mod.ThemeToggle })))
const ButtonLoading = lazy(() => import('@/components/ui/loading-states').then(mod => ({ default: mod.ButtonLoading })))

// Composant mémorisé pour éviter les re-renders
interface LoginFormProps {
  formData: { email: string; password: string }
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  error: string
  emailValid: boolean | null
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  capsLockOn: boolean
  setCapsLockOn: (capsLock: boolean) => void
  onRetryConsent?: () => void
}

const LoginForm = memo(function LoginForm({
  formData,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  emailValid,
  showPassword,
  setShowPassword,
  capsLockOn,
  setCapsLockOn,
  onRetryConsent
}: LoginFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          {error.includes('consentement aux cookies') && onRetryConsent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={onRetryConsent}
            >
              Réessayer avec consentement
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-title-semibold text-foreground">
          Identifiant
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className={`pl-10 h-12 border-input bg-background focus:border-primary focus:ring-primary rounded-lg transition-all duration-200 hover:border-primary/50 ${
              emailValid === true ? 'border-green-500 focus:border-green-500 focus:ring-green-500' :
              emailValid === false ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''
            }`}
            placeholder="votre@email.com"
            autoFocus
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          {emailValid !== null && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {emailValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          )}
        </div>
        {emailValid === false && (
          <p className="text-destructive text-xs">Veuillez entrer votre identifiant</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-title-semibold text-foreground">
          Mot de passe
        </Label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            className="pl-10 pr-12 h-12 border-input bg-background focus:border-primary focus:ring-primary rounded-lg transition-all duration-200 hover:border-primary/50"
            placeholder="Votre mot de passe"
            value={formData.password}
            onChange={handleInputChange}
            onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
            onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
            onBlur={() => setCapsLockOn(false)}
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 h-auto p-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {capsLockOn && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Verr. Maj activée</span>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={isLoading}
      >
        {isLoading ? (
          <Suspense fallback={<div className="flex items-center justify-center">Connexion...</div>}>
            <ButtonLoading
              isLoading={true}
              loadingText="Connexion en cours..."
              variant="login"
              size="sm"
              color="primary"
            >
              Connexion en cours...
            </ButtonLoading>
          </Suspense>
        ) : (
          <div className="flex items-center justify-center">
            <span>Se connecter</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        )}
      </Button>
    </form>
  )
})

export default function LoginPage() {
  const router = useRouter()
  const { login } = useSupabaseAuth()
  const { showConsent, hasConsent, requestConsent, handleAccept, handleDecline, clearConsent } = useCookieConsent()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const [pendingLogin, setPendingLogin] = useState<{email: string, password: string} | null>(null)

  // Validation email optimisée avec debounce
  const validateEmail = useCallback((email: string) => {
    if (email === '') {
      setEmailValid(null)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setEmailValid(emailRegex.test(email))
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateEmail(formData.email)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [formData.email, validateEmail])

  const performLogin = useCallback(async (email: string, password: string) => {
    try {
      const success = await login(email, password)

      if (success) {
        // Attendre que l'état utilisateur soit stabilisé
        await new Promise(resolve => setTimeout(resolve, 300))

        // Redirection simple vers la page d'accueil - la logique de redirection sera gérée par la page d'accueil
        console.log('✅ Connexion réussie, redirection vers la page d\'accueil')
        router.replace('/')
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
      setPendingLogin(null)
    }
  }, [login, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Vérifier le consentement aux cookies avant de se connecter
    const consent = requestConsent()
    if (consent === false) {
      // Consentement en attente, sauvegarder les données de connexion
      setPendingLogin({ email: formData.email, password: formData.password })
      setIsLoading(false)
      return
    }

    // Consentement donné ou existant, procéder à la connexion
    await performLogin(formData.email, formData.password)
  }

  // Gérer la réponse au consentement
  useEffect(() => {
    if (hasConsent === true && pendingLogin) {
      // Consentement accordé et connexion en attente
      setIsLoading(true)
      performLogin(pendingLogin.email, pendingLogin.password)
    } else if (hasConsent === false && pendingLogin) {
      // Consentement refusé temporairement
      setPendingLogin(null)
      setError('Connexion annulée - le consentement aux cookies est requis pour votre sécurité. Vous pouvez réessayer.')
    }
  }, [hasConsent, pendingLogin, performLogin])

  // Permettre de relancer le processus si le consentement a été refusé
  const handleRetryWithConsent = useCallback(() => {
    setError('')
    // Utiliser la fonction clearConsent du hook pour réinitialiser proprement
    clearConsent()
  }, [clearConsent])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <LCPOptimizer>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-background to-muted/20 dark:from-background dark:to-muted/10">
      {/* Bouton de thème en haut à droite - Lazy loaded */}
      <div className="absolute top-4 right-4 z-30">
        <Suspense fallback={<div className="w-9 h-9" />}>
          <ThemeToggle />
        </Suspense>
      </div>

      {/* Arrière-plan avec logo en blur et particules subtiles */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/logo-tresor-public.svg"
              alt="Logo Trésor Public Background"
              width={1000}
              height={1000}
              className="object-contain opacity-10 dark:opacity-5"
              priority
              loading="eager"
              sizes="100vw"
            />
          </div>
          {/* Effet de blur prononcé sur le backdrop */}
          <div className="absolute inset-0 backdrop-blur-md bg-background/10 dark:bg-background/20"></div>
          {/* Particules flottantes très discrètes */}
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-muted-foreground/20 dark:bg-muted-foreground/10 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-muted-foreground/15 dark:bg-muted-foreground/5 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-muted-foreground/10 dark:bg-muted-foreground/5 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
      </div>

      {/* Contenu principal - Centré verticalement sur desktop, scrollable sur mobile */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-8">
        <div className="relative z-10 w-full max-w-md mx-auto">
          {/* Logo et titre */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="mb-6 sm:mb-8 group relative">
              <LCPImage
                src="/logo-tresor-public.svg"
                alt="Logo Trésor Public Gabon"
                width={120}
                height={120}
                className="mx-auto transition-all duration-500 group-hover:scale-110 drop-shadow-lg sm:w-[150px] sm:h-[150px]"
                priority={true}
              />
            </div>
            <h1 className="text-4xl sm:text-5xl font-title-bold text-primary mb-3 sm:mb-4">ACGE</h1>
            <p className="text-lg sm:text-xl text-primary">Agence Comptable des Grandes Écoles</p>
          </div>

          {/* Formulaire */}
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="bg-gradient-to-r from-primary to-primary/90 p-6 sm:p-8 text-primary-foreground text-center">
              <h2 className="text-2xl sm:text-3xl font-title-bold text-primary-foreground">Connexion</h2>
              <p className="text-primary-foreground/90 mt-2 text-sm">Accédez à votre espace de gestion</p>
            </div>

            <div className="p-6 sm:p-8">
              <LoginForm
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                emailValid={emailValid}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                capsLockOn={capsLockOn}
                setCapsLockOn={setCapsLockOn}
                onRetryConsent={handleRetryWithConsent}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright en bas de page - Repositionné pour éviter le chevauchement */}
      <div className="relative z-20 py-4 px-4 text-center">
        <p className="text-muted-foreground text-sm">
          © Powered by <span className="font-semibold text-primary">GTF</span>
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          acge-gabon.com
        </p>
      </div>

      {/* Web Vitals tracking */}
      <WebVitals />

      {/* Cookie Consent Dialog */}
      <CookieConsent
        isOpen={showConsent}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      {/* Styles CSS simplifiés */}
      <style jsx>{`
        /* Animation de chargement uniquement */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
      </div>
    </LCPOptimizer>
  )
}