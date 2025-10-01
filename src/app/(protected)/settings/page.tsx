'use client'

import { useState, useMemo, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { CompactPageLayout, PageHeader, ContentSection } from '@/components/shared/compact-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingState } from '@/components/ui/loading-states'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { Settings,
  Shield,
  Palette,
  Globe,
  Save,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  User,
  Search,
  X,
  ChevronRight,
  ExternalLink,
  Key
 } from 'lucide-react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import Link from 'next/link'

interface SettingItem {
  id: string
  title: string
  description: string
  section: string
  keywords: string[]
  available: boolean
  component?: React.ReactNode
  action?: () => void
}

export default function SettingsPage() {
  const { user } = useSupabaseAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('Apparence')
  const [sessionTimeoutUpdated, setSessionTimeoutUpdated] = useState(false)

  // États du formulaire
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // États pour les paramètres
  const [settings, setSettings] = useState({
    language: 'fr',
    timezone: 'Africa/Libreville',
    security: {
      sessionTimeout: 15,
      passwordExpiry: 90
    }
  })

  // Charger les paramètres depuis l'API
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings && data.settings.security) {
          setSettings(prev => ({
            ...prev,
            security: {
              ...prev.security,
              sessionTimeout: data.settings.security.sessionTimeout || 15,
              passwordExpiry: data.settings.security.passwordExpiry || 90
            }
          }))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    }
  }

  // Gestion de l'affichage des mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Définition de tous les paramètres disponibles
  const allSettings: SettingItem[] = [
    // Apparence
    {
      id: 'theme',
      title: 'Thème',
      description: 'Personnalisez l\'apparence de l\'application',
      section: 'Apparence',
      keywords: ['thème', 'apparence', 'couleur', 'mode', 'clair', 'sombre', 'système'],
      available: true,
      component: <ThemeSelector />
    },
    // Compte
    {
      id: 'edit-profile',
      title: 'Modifier le profil',
      description: 'Mettre à jour vos informations personnelles',
      section: 'Compte',
      keywords: ['profil', 'profile', 'modifier', 'informations', 'personnelles'],
      available: true,
      action: () => window.location.href = '/profile'
    },
    {
      id: 'change-password',
      title: 'Changer le mot de passe',
      description: 'Modifier votre mot de passe de sécurité',
      section: 'Compte',
      keywords: ['mot de passe', 'password', 'sécurité', 'changer'],
      available: true,
      action: () => setSelectedSection('Sécurité')
    },
    {
      id: 'session-timeout',
      title: 'Délai d\'expiration de session',
      description: 'Définir le délai d\'expiration de session',
      section: 'Sécurité',
      keywords: ['session', 'expiration', 'délai', 'timeout'],
      available: true,
      component: (
        <div className="flex items-center gap-2">
          <Select
            value={settings?.security?.sessionTimeout?.toString() || '15'}
            onValueChange={(value) => handleSecurityChange('sessionTimeout', parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
          {sessionTimeoutUpdated && (
            <CheckCircle className="h-4 w-4 text-green-500 animate-pulse" />
          )}
        </div>
      )
    },
    // Régional
    {
      id: 'language',
      title: 'Langue',
      description: 'Choisir la langue de l\'interface',
      section: 'Régional',
      keywords: ['langue', 'language', 'interface', 'locale'],
      available: true,
      component: (
        <Select
          value={settings.language}
          onValueChange={(value) => handleSettingsChange('language', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      id: 'timezone',
      title: 'Fuseau horaire',
      description: 'Définir votre fuseau horaire',
      section: 'Régional',
      keywords: ['fuseau', 'horaire', 'timezone', 'heure'],
      available: true,
      component: (
        <Select
          value={settings.timezone}
          onValueChange={(value) => handleSettingsChange('timezone', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Africa/Libreville">Libreville (GMT+1)</SelectItem>
            <SelectItem value="Europe/Paris">Paris (GMT+1/+2)</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ]

  // Filtrage des paramètres basé sur la recherche
  const filteredSettings = useMemo(() => {
    if (!searchQuery.trim()) return allSettings

    const query = searchQuery.toLowerCase()
    return allSettings.filter(setting => 
      setting.title.toLowerCase().includes(query) ||
      setting.description.toLowerCase().includes(query) ||
      setting.section.toLowerCase().includes(query) ||
      setting.keywords.some(keyword => keyword.toLowerCase().includes(query))
    )
  }, [searchQuery])

  // Groupement des paramètres par section
  const groupedSettings = useMemo(() => {
    const grouped: Record<string, SettingItem[]> = {}
    filteredSettings.forEach(setting => {
      if (!grouped[setting.section]) {
        grouped[setting.section] = []
      }
      grouped[setting.section].push(setting)
    })
    return grouped
  }, [filteredSettings])

  // Sections disponibles
  const sections = [
    { name: 'Apparence', icon: Palette, color: 'blue' },
    { name: 'Compte', icon: User, color: 'green' },
    { name: 'Sécurité', icon: Shield, color: 'red' },
    { name: 'Régional', icon: Globe, color: 'purple' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSettingsChange = (key: string, value: boolean | string) => {
    const newSettings = {
      ...settings,
      [key]: value
    }
    setSettings(newSettings)
    saveSettings(newSettings).then(() => {
      // Déclencher un événement pour notifier les autres composants seulement après sauvegarde
      window.dispatchEvent(new CustomEvent('settings-changed'))
    })
  }

  const handleSecurityChange = (key: string, value: boolean | number) => {
    const newSettings = {
      ...settings,
      security: {
        ...settings.security,
        [key]: value
      }
    }
    setSettings(newSettings)
    saveSettings(newSettings).then(() => {
      // Déclencher un événement pour notifier les autres composants seulement après sauvegarde
      window.dispatchEvent(new CustomEvent('settings-changed'))
      
      // Afficher un message de confirmation pour le délai d'expiration
      if (key === 'sessionTimeout') {
        setSessionTimeoutUpdated(true)
        setTimeout(() => setSessionTimeoutUpdated(false), 3000) // Masquer après 3 secondes
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validation des mots de passe
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        return
      }

      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Paramètres mis à jour avec succès')
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      setError('Erreur lors de la sauvegarde des paramètres')
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const getSectionIcon = (sectionName: string) => {
    switch (sectionName) {
      case 'Apparence': return Palette
      case 'Compte': return User
      case 'Sécurité': return Shield
      case 'Régional': return Globe
      default: return Settings
    }
  }

  const getSectionColor = (sectionName: string) => {
    switch (sectionName) {
      case 'Apparence': return 'blue'
      case 'Compte': return 'green'
      case 'Sécurité': return 'red'
      case 'Régional': return 'purple'
      default: return 'gray'
    }
  }

  // Charger les paramètres depuis l'API
  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true)
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  // Sauvegarder les paramètres
  const saveSettings = async (newSettings: any) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: newSettings }),
      })

      if (response.ok) {
        setSuccess('Paramètres mis à jour avec succès')
        setTimeout(() => setSuccess(''), 3000)
        return Promise.resolve() // Indique la réussite
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la sauvegarde')
        return Promise.reject(data.error || 'Erreur lors de la sauvegarde') // Indique l'échec
      }
    } catch (error) {
      setError('Erreur de connexion')
      return Promise.reject('Erreur de connexion') // Indique l'échec
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les paramètres au montage
  useEffect(() => {
    fetchSettings()
    loadSettings() // Charger aussi les paramètres de sécurité
  }, [])

  // Écouter les changements de paramètres via un événement personnalisé
  useEffect(() => {
    const handleSettingsChange = () => {
      console.log('🔄 Mise à jour des paramètres dans la page settings...')
      fetchSettings()
    }

    // Écouter l'événement de changement de paramètres
    window.addEventListener('settings-changed', handleSettingsChange)

    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange)
    }
  }, [])

  // Filtrer les sections visibles basées sur la sélection
  const visibleSections = useMemo(() => {
    if (searchQuery.trim()) {
      return Object.keys(groupedSettings)
    }
    return [selectedSection]
  }, [selectedSection, searchQuery, groupedSettings])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header amélioré */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-title-bold text-primary">
                Paramètres
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Gérez vos préférences et paramètres de compte
            </p>
          </div>
        </div>

        {/* Messages d'alerte améliorés */}
        {error && (
          <Alert variant="destructive" className="">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {sessionTimeoutUpdated && (
          <Alert className="">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>Délai d'expiration de session mis à jour avec succès !</AlertDescription>
          </Alert>
        )}

        {/* Layout responsive avec sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar responsive */}
          <div className="w-full lg:w-80 lg:flex-shrink-0" style={{animationDelay: '0.1s'}}>
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barre de recherche améliorée */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 transition-all duration-300 hover:border-primary/50 focus:scale-[1.02]"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 transition-all duration-300 hover:scale-110 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Navigation des sections améliorée */}
                <div className="space-y-2">
                  {sections.map((section, index) => {
                    const Icon = section.icon
                    const isActive = selectedSection === section.name
                    const hasResults = Object.keys(groupedSettings).includes(section.name)
                    const count = groupedSettings[section.name]?.length || 0
                    
                    return (
                      <Button
                        key={section.name}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start transition-all duration-300 transform hover:scale-[1.02] touch-target ${
                          isActive ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]' : 'hover:bg-accent hover:shadow-md'
                        } ${!hasResults && searchQuery ? 'opacity-50' : ''}`}
                        style={{animationDelay: `${(index + 1) * 0.1}s`}}
                        onClick={() => {
                          setSelectedSection(section.name)
                          setSearchQuery('') // Effacer la recherche quand on clique sur une section
                        }}
                        disabled={!hasResults && !!searchQuery}
                      >
                        <div className={`p-1.5 rounded-md mr-3 transition-all duration-300 ${
                          isActive ? 'bg-primary-foreground/20 scale-110' : 'bg-muted group-hover:scale-110'
                        }`}>
                          <Icon className={`h-4 w-4 transition-all duration-300 ${
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                          }`} />
                        </div>
                        <span className="font-medium">{section.name}</span>
                        {count > 0 && (
                          <Badge 
                            variant={isActive ? "secondary" : "outline"} 
                            className="ml-auto text-xs transition-all duration-300 hover:scale-110"
                          >
                            {count}
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </div>

                {/* Compteur de résultats */}
                {searchQuery && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {filteredSettings.length} résultat{filteredSettings.length > 1 ? 's' : ''} trouvé{filteredSettings.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal amélioré */}
          <div className="flex-1 " style={{animationDelay: '0.2s'}}>
            {Object.keys(groupedSettings).length === 0 ? (
              <Card className="transition-all duration-300 hover:shadow-lg ">
                <CardContent className="py-12 text-center">
                  <div className="animate-bounce mb-4">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                  </div>
                  <h3 className="text-lg font-title-semibold mb-2 " style={{animationDelay: '0.1s'}}>
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-muted-foreground " style={{animationDelay: '0.2s'}}>
                    Aucun paramètre ne correspond à "{searchQuery}"
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={clearSearch} 
                    className="mt-4 transition-all duration-300 hover:scale-105 "
                    style={{animationDelay: '0.3s'}}
                  >
                    Effacer la recherche
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {visibleSections.map((sectionName) => {
                  const settings = groupedSettings[sectionName]
                  if (!settings) return null
                  
                  const Icon = getSectionIcon(sectionName)
                  const color = getSectionColor(sectionName)
                  
                  return (
                    <Card key={sectionName} className=" transition-all duration-300 hover:shadow-lg">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 ">
                          <div className="p-2 bg-gradient-to-r from-primary/10 to-primary/20 rounded-md transition-all duration-300 hover:scale-110">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{sectionName}</CardTitle>
                            <CardDescription className="text-sm">
                              {sectionName === 'Apparence' && 'Personnalisez l\'apparence de l\'application'}
                              {sectionName === 'Compte' && 'Informations de votre compte'}
                              {sectionName === 'Sécurité' && 'Paramètres de sécurité de votre compte'}
                              {sectionName === 'Régional' && 'Paramètres régionaux et de langue'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {settings.map((setting, index) => (
                            <div 
                              key={setting.id} 
                              className="group flex items-center justify-between p-4 rounded-lg border hover:bg-accent hover:shadow-md transition-all duration-300 hover:scale-[1.01] "
                              style={{animationDelay: `${index * 0.1}s`}}
                            >
                              <div className="flex-1">
                                <p className="font-semibold">{setting.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {setting.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {!setting.available && (
                                  <Badge variant="secondary" className="text-xs ">
                                    Bientôt disponible
                                  </Badge>
                                )}
                                {setting.component && setting.component}
                                {setting.action && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105" 
                                    onClick={setting.action}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                                    Modifier
                                  </Button>
                                )}
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                                {/* Formulaire de changement de mot de passe pour la section Sécurité */}
                {selectedSection === 'Sécurité' && (
                  <Card className=" transition-all duration-300 hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 ">
                        <div className="p-2 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-md">
                          <Key className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        Changer le mot de passe
                      </CardTitle>
                      <CardDescription className="" style={{animationDelay: '0.1s'}}>
                        Modifiez votre mot de passe de sécurité
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2 " style={{animationDelay: '0.2s'}}>
                            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                            <div className="relative group">
                              <Input
                                id="currentPassword"
                                name="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                placeholder="Mot de passe actuel"
                                className="transition-all duration-300 hover:border-primary/50 focus:scale-[1.02]"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8 sm:h-7 sm:w-7 transition-all duration-300 hover:scale-110 touch-target"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2 " style={{animationDelay: '0.3s'}}>
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <div className="relative group">
                              <Input
                                id="newPassword"
                                name="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder="Nouveau mot de passe"
                                className="transition-all duration-300 hover:border-primary/50 focus:scale-[1.02]"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8 sm:h-7 sm:w-7 transition-all duration-300 hover:scale-110 touch-target"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 " style={{animationDelay: '0.4s'}}>
                          <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                          <div className="relative group">
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              placeholder="Confirmer le nouveau mot de passe"
                              className="transition-all duration-300 hover:border-primary/50 focus:scale-[1.02]"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-8 w-8 sm:h-7 sm:w-7 transition-all duration-300 hover:scale-110 touch-target"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 " style={{animationDelay: '0.5s'}}>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setSelectedSection('Apparence')}
                            className="transition-all duration-300 hover:scale-105"
                          >
                            Annuler
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                          >
                            {isLoading ? (
                              <>
                                <div className="mr-2 h-4 w-4">
                                  <LoadingState isLoading={true} size="sm" showText={false} />
                                </div>
                                Sauvegarde...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                                Sauvegarder
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
// Styles CSS simplifiés - Suppression des animations superficielles

