'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ModalWrapper } from '@/components/ui/modal-wrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Share2, 
  User, 
  Shield, 
  Trash2, 
  Eye,
  Edit,
  Crown,
  UserPlus,
  AlertTriangle,
  Check,
  X,
  Globe,
  Lock,
  Info
 } from 'lucide-react'
import { DocumentItem } from '@/types/document'

interface ShareItem {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  permission: 'READ' | 'WRITE' | 'ADMIN'
  createdAt: string
}

interface DocumentShareModalProps {
  document: DocumentItem
  isOpen: boolean
  onClose: () => void
  onShared?: () => void
}

const PERMISSIONS = [
  { value: 'READ', label: 'Lecture', icon: Eye, color: 'bg-blue-100 text-blue-800' },
  { value: 'WRITE', label: 'Écriture', icon: Edit, color: 'bg-green-100 text-green-800' },
  { value: 'ADMIN', label: 'Administration', icon: Crown, color: 'bg-purple-100 text-purple-800' }
] as const

export function DocumentShareModal({ document, isOpen, onClose, onShared }: DocumentShareModalProps) {
  const [shares, setShares] = useState<ShareItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPermissions, setShowPermissions] = useState(false)
  
  // Formulaire de partage
  const [userEmail, setUserEmail] = useState('')
  const [permission, setPermission] = useState<'READ' | 'WRITE' | 'ADMIN'>('READ')
  const [isSharing, setIsSharing] = useState(false)
  
  // Recherche d'utilisateurs
  const [userSearchResults, setUserSearchResults] = useState<Array<{id: string, name: string, email: string}>>([])
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchShares()
    }
  }, [isOpen, document.id])

  const fetchShares = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/documents/${document.id}/share`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares || [])
      } else {
        setError('Erreur lors du chargement des partages')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail.trim()) return

    setIsSharing(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/documents/${document.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: userEmail.trim(),
          permission: permission.toUpperCase()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Document partagé avec succès !')
        setUserEmail('')
        setPermission('READ')
        await fetchShares()
        onShared?.()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors du partage')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsSharing(false)
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/share?shareId=${shareId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Partage supprimé avec succès')
        await fetchShares()
        onShared?.()
      } else {
        setError('Erreur lors de la suppression du partage')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserSearchResults([])
      setShowUserSuggestions(false)
      return
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setUserSearchResults(data.users || [])
        setShowUserSuggestions(true)
      }
    } catch (err) {
      console.error('Erreur recherche utilisateurs:', err)
    }
  }

  const handleUserEmailChange = (value: string) => {
    setUserEmail(value)
    searchUsers(value)
  }

  const selectUser = (user: {email: string, name: string}) => {
    setUserEmail(user.email)
    setShowUserSuggestions(false)
  }

  const getPermissionConfig = (perm: string) => {
    return PERMISSIONS.find(p => p.value === perm) || PERMISSIONS[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ModalWrapper isOpen={isOpen} onOpenChange={onClose}>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-4xl mx-auto max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Share2 className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Partager le document</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPermissions(!showPermissions)}
                className="hidden sm:flex"
              >
                <Info className="h-4 w-4" />
                <span className="ml-1">Permissions</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du document - Version compacte */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-title-medium text-blue-900 break-all">{document.title}</h3>
                <p className="text-sm text-blue-800 break-all">
                  Propriétaire : {document.author?.name || 'Inconnu'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {document.isPublic ? (
                  <Badge variant="outline" className="gap-1 bg-green-50 text-green-800 border-green-200">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Privé
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Informations sur les permissions - Version compacte avec toggle */}
          <div className={`transition-all duration-300 overflow-hidden ${
            showPermissions ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h5 className="font-title-medium mb-3 text-blue-900">Niveaux de permission</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Lecture :</strong> Peut voir et télécharger le document
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Edit className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Écriture :</strong> Peut modifier les métadonnées et ajouter des versions
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Administration :</strong> Peut gérer les partages et supprimer le document
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton d'infos pour mobile */}
          <div className="sm:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPermissions(!showPermissions)}
              className="w-full"
            >
              <Info className="h-4 w-4 mr-2" />
              {showPermissions ? 'Masquer les permissions' : 'Afficher les permissions'}
            </Button>
          </div>

          {/* Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Formulaire de partage */}
          <div className="space-y-4">
            <h4 className="font-title-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Partager avec un nouvel utilisateur
            </h4>
            
            <form onSubmit={handleShare} className="space-y-3">
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 relative">
                  <Label htmlFor="email">Email de l'utilisateur</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com ou nom d'utilisateur"
                    value={userEmail}
                    onChange={(e) => handleUserEmailChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}
                    onFocus={() => userSearchResults.length > 0 && setShowUserSuggestions(true)}
                    required
                    className="w-full"
                  />
                  
                  {/* Suggestions d'utilisateurs */}
                  {showUserSuggestions && userSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {userSearchResults.map(user => (
                        <Button
                          key={user.id}
                          type="button"
                          variant="ghost"
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 h-auto justify-start"
                          onClick={() => selectUser(user)}
                        >
                          <User className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            <p className="text-xs text-primary break-all">{user.email}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="permission">Permission</Label>
                  <Select value={permission} onValueChange={(value) => setPermission(value as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSIONS.map(perm => (
                        <SelectItem key={perm.value} value={perm.value}>
                          <div className="flex items-center gap-2">
                            <perm.icon className="h-4 w-4" />
                            {perm.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" disabled={isSharing || !userEmail.trim()} className="w-full sm:w-auto">
                {isSharing ? 'Partage en cours...' : 'Partager'}
              </Button>
            </form>
          </div>

          <Separator />

          {/* Liste des partages existants */}
          <div className="space-y-4">
            <h4 className="font-title-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Utilisateurs ayant accès ({shares.length})
            </h4>

            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-primary">Chargement...</p>
              </div>
            ) : shares.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                {/* Vue de table pour écrans moyens et grands */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Permission</TableHead>
                        <TableHead>Partagé le</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shares.map((share) => {
                        const permConfig = getPermissionConfig(share.permission)
                        return (
                          <TableRow key={share.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{share.user.name}</p>
                                  <p className="text-sm text-primary break-all">{share.user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={permConfig.color}>
                                <permConfig.icon className="h-3 w-3 mr-1" />
                                {permConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-primary">
                                {formatDate(share.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveShare(share.id)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Vue de cartes pour écrans petits */}
                <div className="md:hidden space-y-3 p-4">
                  {shares.map((share) => {
                    const permConfig = getPermissionConfig(share.permission)
                    return (
                      <div key={share.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{share.user.name}</p>
                              <p className="text-xs text-primary break-all">{share.user.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveShare(share.id)}
                            className="text-destructive hover:text-destructive/80 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <Badge className={permConfig.color}>
                            <permConfig.icon className="h-3 w-3 mr-1" />
                            {permConfig.label}
                          </Badge>
                          <span className="text-xs text-primary">
                            {formatDate(share.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-primary">
                <Share2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun partage pour ce document</p>
                <p className="text-sm">Ajoutez des utilisateurs ci-dessus pour commencer à partager</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </ModalWrapper>
  )
}
