'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CompactPageLayout, PageHeader, EmptyState, ContentSection } from '@/components/shared/compact-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  FileText,
  Plus,
  Upload,
  Download,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  Target,
  RefreshCw,
} from 'lucide-react'
import { UploadWithTrigger, UploadWithTriggerRef } from '@/components/upload/upload-with-trigger'


const getStatutBadge = (statut: string) => {
  const statusMap = {
    'BROUILLON': { variant: 'secondary' as const, label: 'Brouillon' },
    'EN_ATTENTE': { variant: 'outline' as const, label: 'En attente' },
    'VALIDÉ_CB': { variant: 'default' as const, label: 'Validé CB' },
    'REJETÉ_CB': { variant: 'destructive' as const, label: 'Rejeté CB' },
    'VALIDÉ_ORDONNATEUR': { variant: 'default' as const, label: 'Validé Ordonnateur' },
    'PAYÉ': { variant: 'default' as const, label: 'Payé' },
    'TERMINÉ': { variant: 'default' as const, label: 'Terminé' }
  }

  const status = statusMap[statut as keyof typeof statusMap] || { variant: 'secondary' as const, label: statut }
  return <Badge variant={status.variant}>{status.label}</Badge>
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DossierDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dossierId = params.id as string

  // États
  const [dossier, setDossier] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const uploadTriggerRef = useRef<UploadWithTriggerRef>(null)

  // Charger les détails du dossier
  useEffect(() => {
    const fetchDossier = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/dossiers/${dossierId}`)
        if (!response.ok) {
          throw new Error('Dossier non trouvé')
        }

        const data = await response.json()
        if (data.success) {
          setDossier(data.dossier)
        } else {
          throw new Error(data.error || 'Erreur lors du chargement')
        }
      } catch (err) {
        console.error('Erreur chargement dossier:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    if (dossierId) {
      fetchDossier()
    }
  }, [dossierId])

  // Charger les documents du dossier
  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true)

      const response = await fetch(`/api/dossiers/${dossierId}/documents`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des documents')
      }

      const data = await response.json()
      console.log('📄 Documents récupérés:', data)
      if (data.success) {
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error('Erreur chargement documents:', err)
    } finally {
      setDocumentsLoading(false)
    }
  }

  useEffect(() => {
    if (dossierId) {
      fetchDocuments()
    }
  }, [dossierId])


  // Retirer un document du dossier
  const handleRemoveDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce document du dossier ?')) {
      return
    }

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchDocuments()
      } else {
        const error = await response.json()
        alert('Erreur: ' + (error.error || 'Erreur inconnue'))
      }
    } catch (err) {
      console.error('Erreur retrait document:', err)
      alert('Erreur lors du retrait du document')
    }
  }

  // Télécharger un document
  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)

        // Vérifier que l'élément est bien un enfant du body avant de le supprimer
        if (a.parentNode === document.body) {
          document.body.removeChild(a)
        }
      } else {
        alert('Erreur lors du téléchargement')
      }
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      alert('Erreur lors du téléchargement')
    }
  }

  if (isLoading) {
    return (
      <CompactPageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </CompactPageLayout>
    )
  }

  if (error || !dossier) {
    return (
      <CompactPageLayout>
        <PageHeader title="Erreur" />
        <ContentSection>
          <div className="text-center py-8">
            <p className="text-red-600">{error || 'Dossier non trouvé'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </ContentSection>
      </CompactPageLayout>
    )
  }

  return (
    <CompactPageLayout>
      <PageHeader
        title={`Dossier ${dossier.numeroDossier}`}
        subtitle={dossier.objetOperation}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        }
      />

      {/* Stats avec boxes horizontales */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="bg-card border rounded-lg p-3 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">Documents</span>
            </div>
            <span className="text-xl font-bold flex-shrink-0">{documents.length}</span>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-3 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">Statut</span>
            </div>
            <div className="flex-shrink-0">{getStatutBadge(dossier.statut)}</div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-3 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">Créé le</span>
            </div>
            <span className="text-sm flex-shrink-0">{new Date(dossier.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>


      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({documents.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={documentsLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${documentsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>

              <UploadWithTrigger
                ref={uploadTriggerRef}
                onSuccess={fetchDocuments}
                folderId={dossierId}
                trigger={
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Nouveau document
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {documentsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{document.title}</div>
                        <div className="text-sm text-gray-600">{document.file_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.file_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(document.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadDocument(document.id, document.file_name)}>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveDocument(document.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Retirer du dossier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Aucun document"
              description="Ce dossier ne contient aucun document pour le moment"
              action={{
                label: "Ajouter un document",
                onClick: () => {
                  // Déclencher l'ouverture de la modal via le ref
                  if (uploadTriggerRef.current) {
                    uploadTriggerRef.current.openModal();
                  }
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </CompactPageLayout>
  )
}