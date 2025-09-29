'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { useRouter } from 'next/navigation'
import { CompactPageLayout, PageHeader, ContentSection, EmptyState } from '@/components/shared/compact-page-layout'
import CompactStats from '@/components/shared/compact-stats'
import { AdminGuard } from '@/components/auth/role-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/ui/loading-states'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react'
import { Role } from '@/types'
import { UserForm } from '@/components/users/user-form'
import { MainLayout } from '@/components/layout/main-layout'

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

function UsersPageContent() {
  const { user, getAccessToken } = useSupabaseAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        setError('Erreur lors du chargement des utilisateurs')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    console.log('🚀 Début handleSubmit:', data)
    setIsLoading(true)
    setError('')

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      console.log('🔑 Vérification de l\'authentification...')
      // Vérifier que l'utilisateur est connecté
      const accessToken = await getAccessToken()
      console.log('🔑 Token récupéré:', accessToken ? 'Oui' : 'Non')
      
      if (!accessToken) {
        console.log('❌ Pas de token, arrêt')
        setError('Non authentifié')
        return
      }

      console.log('📡 Envoi de la requête:', { url, method, data })
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Inclure les cookies d'authentification
        body: JSON.stringify(data),
      })

      console.log('📡 Réponse reçue:', response.status, response.statusText)

      if (response.ok) {
        console.log('✅ Succès, fermeture du dialog')
        setIsDialogOpen(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        const responseData = await response.json()
        console.log('❌ Erreur:', responseData)
        setError(responseData.error || 'Erreur lors de l\'opération')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      console.log('🗑️ Suppression utilisateur:', userId)
      
      // Vérifier l'authentification
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError('Non authentifié')
        return
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include' // Inclure les cookies d'authentification
      })

      console.log('🗑️ Réponse suppression:', response.status)

      if (response.ok) {
        fetchUsers()
      } else {
        const responseData = await response.json()
        setError(responseData.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  if (user?.role !== 'ADMIN') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                Accès refusé
              </CardTitle>
              <CardDescription>
                Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/dashboard')}>
                Retour au dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-title-bold text-primary">
              Gestion des Utilisateurs
            </h1>
            <p className="text-primary text-sm sm:text-base">
              Gérez les utilisateurs et leurs permissions
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? 'Modifiez les informations de l\'utilisateur'
                    : 'Créez un nouvel utilisateur avec ses permissions'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <UserForm
                user={editingUser}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingUser(null)
                }}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              {users.length} utilisateur(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <LoadingState
                  isLoading={true}
                  message="Chargement..."
                  size="lg"
                  color="primary"
                  showText={true}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">{userItem.name}</TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {userItem.role === 'ADMIN' && <Shield className="w-4 h-4 text-muted-foreground" />}
                          {userItem.role === 'SECRETAIRE' && <User className="w-4 h-4 text-muted-foreground" />}
                          {userItem.role === 'CONTROLEUR_BUDGETAIRE' && <Shield className="w-4 h-4 text-muted-foreground" />}
                          {userItem.role === 'ORDONNATEUR' && <UserCheck className="w-4 h-4 text-muted-foreground" />}
                          {userItem.role === 'AGENT_COMPTABLE' && <User className="w-4 h-4 text-muted-foreground" />}
                          {userItem.role}
                        </div>
                      </TableCell>
                      <TableCell>
                        {userItem.createdAt 
                          ? new Date(userItem.createdAt).toLocaleDateString('fr-FR')
                          : 'Date inconnue'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(userItem)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {userItem.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(userItem.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UsersPageContent />
    </AdminGuard>
  )
}
