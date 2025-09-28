'use client'

import React, { useState, useEffect } from 'react'
import { CompactPageLayout, PageHeader, ContentSection } from '@/components/shared/compact-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Mail,
  Phone,
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Ticket,
  BookOpen,
  Users,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  FileText,
  Zap,
  Headphones,
  Calendar,
  Filter,
  Eye,
  RefreshCw,
  HelpCircle,
 } from 'lucide-react'

const supportCategories = [
  { value: 'technical', label: 'Problème technique', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  { value: 'account', label: 'Gestion de compte', icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  { value: 'billing', label: 'Facturation', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  { value: 'feature', label: 'Demande de fonctionnalité', icon: CheckCircle, color: 'bg-purple-100 text-purple-700' },
  { value: 'other', label: 'Autre', icon: CheckCircle, color: 'bg-gray-100 text-gray-700' },
]

const priorityLevels = [
  { value: 'high', label: 'Urgent', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'low', label: 'Faible', color: 'bg-green-100 text-green-700' },
]

// Base de connaissances pour l'auto-assistance
const knowledgeBase = [
  {
    category: 'Connexion',
    articles: [
      {
        title: 'Mot de passe oublié',
        description: 'Comment réinitialiser votre mot de passe',
        solution: 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Un email de réinitialisation vous sera envoyé.',
        tags: ['connexion', 'mot de passe', 'sécurité']
      },
      {
        title: 'Compte verrouillé',
        description: 'Mon compte est verrouillé après plusieurs tentatives',
        solution: 'Contactez l\'administrateur système ou attendez 30 minutes pour une nouvelle tentative.',
        tags: ['connexion', 'sécurité', 'bloqué']
      }
    ]
  },
  {
    category: 'Dossiers',
    articles: [
      {
        title: 'Création de dossier échoue',
        description: 'Impossible de créer un nouveau dossier',
        solution: 'Vérifiez que tous les champs obligatoires sont remplis et que vous avez les permissions nécessaires.',
        tags: ['dossiers', 'création', 'erreur']
      },
      {
        title: 'Documents non visibles',
        description: 'Les documents uploadés n\'apparaissent pas',
        solution: 'Actualisez la page et vérifiez la taille des fichiers (max 10MB).',
        tags: ['documents', 'upload', 'visibilité']
      }
    ]
  },
  {
    category: 'Technique',
    articles: [
      {
        title: 'Page ne se charge pas',
        description: 'La page reste blanche ou ne se charge pas',
        solution: 'Videz le cache de votre navigateur et rechargez la page. Utilisez Ctrl+F5.',
        tags: ['technique', 'chargement', 'navigateur']
      },
      {
        title: 'Erreur 500',
        description: 'Erreur interne du serveur',
        solution: 'Cette erreur est temporaire. Réessayez dans quelques minutes.',
        tags: ['erreur', 'serveur', '500']
      }
    ]
  }
]

// FAQ Support
const supportFAQ = [
  {
    question: 'Quels sont les horaires de support ?',
    answer: 'Notre équipe est disponible 24h/24, 7j/7 pour les problèmes urgents. Pour les demandes standards, nous répondons sous 24h.'
  },
  {
    question: 'Comment suivre l\'état de ma demande ?',
    answer: 'Vous recevrez un numéro de ticket par email. Utilisez notre système de suivi pour consulter l\'état de votre demande.'
  },
  {
    question: 'Puis-je rouvrir un ticket fermé ?',
    answer: 'Oui, vous pouvez rouvrir un ticket fermé en répondant au dernier email reçu ou en créant une nouvelle demande liée.'
  },
  {
    question: 'Quels types de fichiers puis-je joindre ?',
    answer: 'Vous pouvez joindre des captures d\'écran (PNG, JPG) et des documents (PDF, DOC, TXT) jusqu\'à 10MB.'
  }
]

// Tickets de support (simulation)
const supportTickets = [
  {
    id: 'TKT-2024-001',
    subject: 'Problème de connexion',
    category: 'technical',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2024-01-15',
    lastUpdate: '2024-01-16',
    assignedTo: 'Jean Dupont'
  },
  {
    id: 'TKT-2024-002',
    subject: 'Demande de nouvelle fonctionnalité',
    category: 'feature',
    priority: 'medium',
    status: 'open',
    createdAt: '2024-01-14',
    lastUpdate: '2024-01-14',
    assignedTo: null
  },
  {
    id: 'TKT-2024-003',
    subject: 'Question sur les permissions',
    category: 'account',
    priority: 'low',
    status: 'resolved',
    createdAt: '2024-01-13',
    lastUpdate: '2024-01-15',
    assignedTo: 'Marie Martin'
  }
]

// Statistiques du support
const supportStats = {
  totalTickets: 147,
  resolvedToday: 23,
  avgResolutionTime: '4h 32min',
  satisfactionRate: 94
}

// Composant de recherche dans la base de connaissances
function KnowledgeSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    if (query.length > 2) {
      const filtered = knowledgeBase.flatMap(category =>
        category.articles.filter(article =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.description.toLowerCase().includes(query.toLowerCase()) ||
          article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        ).map(article => ({ ...article, category: category.category }))
      )
      setResults(filtered)
    } else {
      setResults([])
    }
  }, [query])

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Rechercher dans la base..."
          className="pl-10 h-12 bg-white border-gray-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultats de recherche</h3>
          <div className="space-y-4">
            {results.map((article, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-medium text-gray-900 mb-1">{article.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{article.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{article.category}</Badge>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    Voir la solution
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant FAQ Support
function SupportFAQ() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {supportFAQ.map((faq, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Button
            variant="ghost"
            className="w-full justify-between text-left p-4 h-auto hover:bg-gray-50"
            onClick={() => setExpanded(expanded === `faq-${index}` ? null : `faq-${index}`)}
          >
            <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expanded === `faq-${index}` ? 'rotate-90' : ''}`} />
          </Button>
          {expanded === `faq-${index}` && (
            <div className="px-4 pb-4">
              <div className="border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Composant Tableau de bord des tickets
function TicketsDashboard() {
  const [filter, setFilter] = useState('all')

  const filteredTickets = supportTickets.filter(ticket =>
    filter === 'all' || ticket.status === filter
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
      resolved: { label: 'Résolu', color: 'bg-green-100 text-green-700' },
      closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-700' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
      medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
      low: { label: 'Faible', color: 'bg-green-100 text-green-700' }
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="space-y-8">
      {/* Statistiques compactes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Ticket className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supportStats.totalTickets}</p>
          <p className="text-xs text-gray-600">Tickets totaux</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supportStats.resolvedToday}</p>
          <p className="text-xs text-gray-600">Résolus aujourd'hui</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supportStats.avgResolutionTime}</p>
          <p className="text-xs text-gray-600">Temps moyen</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{supportStats.satisfactionRate}%</p>
          <p className="text-xs text-gray-600">Satisfaction</p>
        </div>
      </div>

      {/* Filtres et liste des tickets */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Mes tickets de support</h2>
            <div className="flex items-center space-x-3">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouverts</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolus</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{ticket.subject}</h3>
                    <Badge variant="outline" className="text-xs">{ticket.id}</Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Créé le {ticket.createdAt}</span>
                    {ticket.assignedTo && (
                      <span>Assigné à {ticket.assignedTo}</span>
                    )}
                    <div className="flex space-x-2">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="ml-4">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Chat de support en temps réel
function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg">
          <Headphones className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat de support en temps réel</DialogTitle>
        </DialogHeader>
        <div className="h-64 p-4 bg-muted rounded-lg mb-4">
          <div className="space-y-3">
            <div className="bg-white p-2 rounded-lg max-w-xs">
              <p className="text-sm">Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
              <span className="text-xs text-muted-foreground">Support - Il y a 1 min</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Input placeholder="Tapez votre message..." className="flex-1" />
          <Button>Envoyer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SupportPage() {
  const [formData, setFormData] = useState({
    category: '',
    priority: '',
    subject: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState('new-ticket')

  // Debug: Vérifier que la page se charge correctement
  useEffect(() => {
    console.log('Page Support chargée avec activeTab:', activeTab)
  }, [activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simuler l'envoi du formulaire
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isSubmitted) {
    return (
      <CompactPageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Demande envoyée !</CardTitle>
              <CardDescription>
                Votre demande de support a été transmise à notre équipe.
                Vous recevrez un numéro de ticket par email sous peu.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <Button onClick={() => setIsSubmitted(false)} className="w-full">
                Envoyer une nouvelle demande
              </Button>
              <Button variant="outline" className="w-full">
                <Ticket className="h-4 w-4 mr-2" />
                Suivre mes tickets
              </Button>
            </CardContent>
          </Card>
        </div>
      </CompactPageLayout>
    )
  }

  return (
    <CompactPageLayout>
      {/* Header avec police Outfit */}
      <div className="mb-8">
        <h1 className="font-title-bold text-3xl text-primary mb-2">Support ACGE</h1>
        <p className="text-gray-600">Obtenez l'aide dont vous avez besoin</p>
      </div>

      {/* Navigation par onglets Shadcn UI */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full mb-8">
          <TabsList className="flex h-12 w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="new-ticket" className="min-w-0 flex-1 px-3 py-2 text-sm font-medium whitespace-nowrap">
              Nouvelle demande
            </TabsTrigger>
            <TabsTrigger value="my-tickets" className="min-w-0 flex-1 px-3 py-2 text-sm font-medium whitespace-nowrap">
              Mes tickets
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="min-w-0 flex-1 px-3 py-2 text-sm font-medium whitespace-nowrap">
              Base de connaissances
            </TabsTrigger>
            <TabsTrigger value="faq" className="min-w-0 flex-1 px-3 py-2 text-sm font-medium whitespace-nowrap">
              FAQ
            </TabsTrigger>
            <TabsTrigger value="contact" className="min-w-0 flex-1 px-3 py-2 text-sm font-medium whitespace-nowrap">
              Contact
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="new-ticket" className="space-y-8 mt-0">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center font-title-medium">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Créer une demande de support
                </CardTitle>
                <CardDescription>
                  Décrivez votre problème pour un traitement rapide
                </CardDescription>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">Catégorie</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center">
                              <category.icon className="mr-2 h-4 w-4" />
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority" className="text-sm font-medium text-gray-700 mb-2 block">Priorité</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionnez une priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityLevels.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${priority.color.split(' ')[0]}`} />
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-2 block">Sujet</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Résumé de votre problème"
                    className="h-11"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Décrivez votre problème en détail..."
                    className="min-h-[120px] resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="votre@email.com"
                      className="h-11"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 mb-2 block">Téléphone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+241 XX XX XX XX"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-medium">
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-5 w-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Envoyer la demande
                      </>
                    )}
                  </Button>
                </div>
              </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="my-tickets" className="mt-0">
          <TicketsDashboard />
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-8 mt-0">
          <div className="max-w-7xl mx-auto">
            {/* Header section avec illustration */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl mb-6">
                <BookOpen className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="font-title-bold text-3xl text-primary mb-3">Base de connaissances</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Trouvez rapidement des solutions à vos problèmes grâce à nos guides détaillés et tutoriels
              </p>
            </div>

            <KnowledgeSearch />

            {/* Catégories avec design moderne */}
            <div className="grid gap-8 md:grid-cols-3 mt-16">
              {knowledgeBase.map((category, categoryIndex) => (
                <Card key={category.category} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${
                          categoryIndex === 0 ? 'bg-blue-50' :
                          categoryIndex === 1 ? 'bg-green-50' : 'bg-purple-50'
                        }`}>
                          <BookOpen className={`h-6 w-6 ${
                            categoryIndex === 0 ? 'text-blue-600' :
                            categoryIndex === 1 ? 'text-green-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="font-title-semibold text-lg">{category.category}</CardTitle>
                          <CardDescription className="text-sm">
                            {category.articles.length} article{category.articles.length > 1 ? 's' : ''} disponible{category.articles.length > 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        categoryIndex === 0 ? 'bg-blue-100 text-blue-700' :
                        categoryIndex === 1 ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {category.articles.length}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4 mb-6">
                      {category.articles.slice(0, 4).map((article, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-white/60 hover:bg-white transition-colors group/item">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            categoryIndex === 0 ? 'bg-blue-400' :
                            categoryIndex === 1 ? 'bg-green-400' : 'bg-purple-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">{article.title}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">{article.description}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover/item:opacity-100 transition-opacity h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {category.articles.length > 4 && (
                      <Button
                        variant="outline"
                        className="w-full group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors"
                      >
                        <span className="text-sm">Voir tous les articles</span>
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Section d'aide rapide */}
            <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h3 className="font-title-semibold text-xl text-gray-900 mb-2">Besoin d'aide immédiate ?</h3>
                <p className="text-gray-600">Nos experts sont là pour vous accompagner</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-primary hover:bg-primary/90">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Démarrer un chat
                </Button>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler le support
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-8 mt-0">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-title-bold text-2xl text-primary mb-2">Questions fréquemment posées</h2>
              <p className="text-gray-600">Trouvez rapidement les réponses aux questions les plus courantes</p>
            </div>
            <SupportFAQ />
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-8 mt-0">
          <div className="max-w-6xl mx-auto">
            {/* Header avec design moderne */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl mb-8 shadow-lg">
                <Headphones className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="font-title-bold text-3xl text-primary mb-4">Nous contacter</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Choisissez le canal de support qui vous convient le mieux. Notre équipe est là pour vous aider 24h/24 et 7j/7.
              </p>
            </div>

            {/* Grille de canaux de contact avec design premium */}
            <div className="grid gap-8 md:grid-cols-3 mb-16">
              {/* Email */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                <CardContent className="relative p-8 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="font-title-semibold text-xl text-gray-900 mb-3">Email</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">Pour les demandes standards et détaillées</p>
                  <div className="space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                      <p className="font-mono text-sm text-gray-700">support@acge.gabon</p>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer un email
                    </Button>
                  </div>
                  <div className="mt-4 text-xs text-blue-600 font-medium">Réponse sous 24h</div>
                </CardContent>
              </Card>

              {/* Téléphone */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                <CardContent className="relative p-8 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="font-title-semibold text-xl text-gray-900 mb-3">Téléphone</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">Support téléphonique personnalisé</p>
                  <div className="space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                      <p className="font-mono text-sm text-gray-700">+241 XX XX XX XX</p>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all">
                      <Phone className="h-4 w-4 mr-2" />
                      Appeler maintenant
                    </Button>
                  </div>
                  <div className="mt-4 text-xs text-green-600 font-medium">Support immédiat</div>
                </CardContent>
              </Card>

              {/* Chat en ligne */}
              <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
                <CardContent className="relative p-8 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="h-10 w-10 text-purple-600" />
                  </div>
                  <h3 className="font-title-semibold text-xl text-gray-900 mb-3">Chat en ligne</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">Support instantané et interactif</p>
                  <div className="space-y-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-700 font-medium">En ligne</span>
                      </div>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Démarrer le chat
                    </Button>
                  </div>
                  <div className="mt-4 text-xs text-purple-600 font-medium">Réponse instantanée</div>
                </CardContent>
              </Card>
            </div>

            {/* Section d'informations supplémentaires */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-100">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="font-title-semibold text-lg text-gray-900 mb-4">Horaires de support</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">Lundi - Vendredi</span>
                      <span className="font-medium text-gray-900">8h00 - 18h00</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">Samedi</span>
                      <span className="font-medium text-gray-900">9h00 - 17h00</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">Dimanche</span>
                      <span className="font-medium text-red-600">Fermé</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-title-semibold text-lg text-gray-900 mb-4">Temps de réponse</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">Chat en ligne</span>
                      <span className="font-medium text-green-600">Instantané</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">Téléphone</span>
                      <span className="font-medium text-blue-600">Immédiat</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">Email</span>
                      <span className="font-medium text-orange-600">24h maximum</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section d'urgence */}
            <div className="mt-12 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-8 border border-red-100">
              <div className="flex items-center justify-center space-x-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-title-semibold text-lg text-gray-900 mb-2">Support d'urgence</h3>
                  <p className="text-gray-600 mb-4">Pour les problèmes critiques nécessitant une intervention immédiate</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                      <Phone className="h-4 w-4 mr-2" />
                      +241 XX XX XX XX (Urgence)
                    </Button>
                    <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                      <Mail className="h-4 w-4 mr-2" />
                      urgent@acge.gabon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

        {/* Chat de support flottant */}
        <SupportChat />
      </CompactPageLayout>
  )
}