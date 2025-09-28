'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { CompactPageLayout, PageHeader, ContentSection } from '@/components/shared/compact-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Search,
  ChevronRight,
  Play,
  Lightbulb,
  Clock,
  MessageCircle,
  Mail,
  Phone,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  FolderOpen,
  Upload,
  Eye,
  Edit,
  Save,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react'

// Données FAQ organisées par catégories avec illustrations
const faqData = [
  {
    category: 'Connexion',
    icon: 'menu-navigation',
    questions: [
      {
        question: 'Comment me connecter à ACGE ?',
        answer: 'Utilisez vos identifiants fournis par l\'administrateur. Cliquez sur "Se connecter" et saisissez votre email et mot de passe.',
        illustration: 'menu-navigation',
        steps: [
          'Accédez à la page de connexion',
          'Saisissez votre email professionnel',
          'Entrez votre mot de passe',
          'Cliquez sur "Se connecter"'
        ]
      },
      {
        question: 'J\'ai oublié mon mot de passe',
        answer: 'Cliquez sur "Mot de passe oublié" sur la page de connexion. Un email de réinitialisation vous sera envoyé.',
        illustration: 'form-filling',
        steps: [
          'Sur la page de connexion, cliquez sur "Mot de passe oublié"',
          'Saisissez votre email professionnel',
          'Vérifiez votre boîte de réception',
          'Cliquez sur le lien de réinitialisation'
        ]
      }
    ]
  },
  {
    category: 'Dossiers',
    icon: 'open-dossier',
    questions: [
      {
        question: 'Comment créer un nouveau dossier ?',
        answer: 'Allez dans "Dossiers" > "Nouveau dossier", remplissez le formulaire et ajoutez les pièces justificatives.',
        illustration: 'form-filling',
        steps: [
          'Accédez au menu "Dossiers"',
          'Cliquez sur "Nouveau dossier"',
          'Remplissez les informations générales',
          'Ajoutez les pièces justificatives',
          'Soumettez pour validation'
        ]
      },
      {
        question: 'Comment suivre l\'état d\'un dossier ?',
        answer: 'Consultez la liste des dossiers et utilisez les filtres pour voir le statut de chaque dossier.',
        illustration: 'pending-list',
        steps: [
          'Ouvrez la liste des dossiers',
          'Utilisez les filtres par statut',
          'Consultez l\'historique du dossier',
          'Vérifiez les commentaires des valideurs'
        ]
      }
    ]
  },
  {
    category: 'Documents',
    icon: 'document-upload',
    questions: [
      {
        question: 'Quels formats de fichiers sont acceptés ?',
        answer: 'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG. Taille maximale : 10MB par fichier.',
        illustration: 'file-selection',
        steps: [
          'Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, JPG, PNG',
          'Taille maximale : 10MB par fichier',
          'Les fichiers sont scannés automatiquement',
          'Vérifiez la qualité avant upload'
        ]
      },
      {
        question: 'Comment organiser mes documents ?',
        answer: 'Créez des dossiers thématiques et sous-dossiers pour une meilleure organisation.',
        illustration: 'document-categorization',
        steps: [
          'Créez des dossiers thématiques',
          'Nommez vos fichiers de manière descriptive',
          'Utilisez les métadonnées pour le classement',
          'Archivez régulièrement les anciens documents'
        ]
      }
    ]
  }
]

// Questions populaires basées sur l'historique
const popularQuestions = [
  'Comment créer un dossier comptable ?',
  'Quelles sont les étapes de validation ?',
  'Comment uploader des documents ?',
  'Comment modifier un dossier en cours ?',
  'Quels sont mes rôles et permissions ?'
]

// Guides étape par étape avec illustrations visuelles
const stepByStepGuides = [
  {
    id: 'create-dossier',
    title: 'Créer un dossier comptable',
    description: 'Guide visuel complet pour créer votre premier dossier',
    illustration: 'dossier-creation',
    steps: [
      {
        text: 'Accédez au menu "Dossiers" et cliquez sur "Nouveau"',
        illustration: 'menu-navigation',
        tip: 'Utilisez la barre de navigation latérale'
      },
      {
        text: 'Renseignez les informations générales (numéro, objet, montant)',
        illustration: 'form-filling',
        tip: 'Le numéro de dossier est généré automatiquement'
      },
      {
        text: 'Ajoutez les pièces justificatives requises',
        illustration: 'document-upload',
        tip: 'Formats acceptés : PDF, DOC, XLS, JPG (max 10MB)'
      },
      {
        text: 'Sélectionnez le budget concerné',
        illustration: 'budget-selection',
        tip: 'Vérifiez la disponibilité budgétaire'
      },
      {
        text: 'Soumettez pour validation',
        illustration: 'submit-validation',
        tip: 'Le dossier sera envoyé au Contrôleur Budgétaire'
      }
    ],
    estimatedTime: '5 minutes',
    difficulty: 'Facile'
  },
  {
    id: 'validate-dossier',
    title: 'Valider un dossier (CB)',
    description: 'Processus de validation par le Contrôleur Budgétaire',
    illustration: 'validation-process',
    steps: [
      {
        text: 'Consultez la liste des dossiers en attente',
        illustration: 'pending-list',
        tip: 'Filtrez par statut "En attente de validation"'
      },
      {
        text: 'Ouvrez le dossier à examiner',
        illustration: 'open-dossier',
        tip: 'Vérifiez toutes les informations saisies'
      },
      {
        text: 'Vérifiez la conformité des pièces',
        illustration: 'document-check',
        tip: 'Contrôlez la qualité et la lisibilité'
      },
      {
        text: 'Validez ou rejetez avec motif',
        illustration: 'approve-reject',
        tip: 'Motif obligatoire en cas de rejet'
      },
      {
        text: 'Ajoutez des commentaires si nécessaire',
        illustration: 'add-comments',
        tip: 'Communication avec le secrétaire'
      }
    ],
    estimatedTime: '3 minutes',
    difficulty: 'Moyen'
  },
  {
    id: 'upload-documents',
    title: 'Téléverser des documents',
    description: 'Guide pour ajouter des pièces justificatives',
    illustration: 'document-upload-process',
    steps: [
      {
        text: 'Ouvrez le dossier concerné',
        illustration: 'open-dossier',
        tip: 'Accédez à l\'onglet "Documents"'
      },
      {
        text: 'Cliquez sur "Ajouter un document"',
        illustration: 'add-button',
        tip: 'Ou faites glisser le fichier'
      },
      {
        text: 'Sélectionnez le fichier sur votre ordinateur',
        illustration: 'file-selection',
        tip: 'Vérifiez le format et la taille'
      },
      {
        text: 'Ajoutez une description et classez le document',
        illustration: 'document-categorization',
        tip: 'Catégories : Facture, Contrat, Rapport...'
      },
      {
        text: 'Validez l\'ajout du document',
        illustration: 'validation-success',
        tip: 'Le document est maintenant visible'
      }
    ],
    estimatedTime: '2 minutes',
    difficulty: 'Facile'
  }
]

const roleInfo = [
  {
    role: 'SECRETAIRE',
    title: 'Secrétaire',
    description: 'Création et gestion des dossiers comptables',
    permissions: ['Créer des dossiers', 'Uploader des documents', 'Gérer les dossiers rejetés'],
    color: 'bg-green-100 text-green-700',
    icon: 'form-filling',
    illustration: 'document-upload',
    workflow: [
      'Créer un nouveau dossier comptable',
      'Remplir les informations générales',
      'Uploader les pièces justificatives',
      'Soumettre pour validation'
    ]
  },
  {
    role: 'CONTROLEUR_BUDGETAIRE',
    title: 'Contrôleur Budgétaire',
    description: 'Validation des dossiers avant ordonnancement',
    permissions: ['Valider les dossiers', 'Rejeter avec motif', 'Consulter les statistiques'],
    color: 'bg-blue-100 text-blue-700',
    icon: 'approve-reject',
    illustration: 'document-check',
    workflow: [
      'Consulter les dossiers en attente',
      'Vérifier la conformité des documents',
      'Valider ou rejeter avec motif',
      'Transmettre aux services suivants'
    ]
  },
  {
    role: 'ORDONNATEUR',
    title: 'Ordonnateur',
    description: 'Ordonnancement des dépenses validées',
    permissions: ['Ordonnancer les dépenses', 'Suivre les paiements', 'Gérer les ordonnances'],
    color: 'bg-purple-100 text-purple-700',
    icon: 'budget-selection',
    illustration: 'submit-validation',
    workflow: [
      'Recevoir les dossiers validés',
      'Vérifier les budgets disponibles',
      'Émettre les ordonnances de paiement',
      'Suivre l\'exécution des paiements'
    ]
  },
  {
    role: 'AGENT_COMPTABLE',
    title: 'Agent Comptable',
    description: 'Comptabilisation finale des dossiers',
    permissions: ['Comptabiliser les dossiers', 'Générer les écritures', 'Clôturer les dossiers'],
    color: 'bg-orange-100 text-orange-700',
    icon: 'document-categorization',
    illustration: 'add-comments',
    workflow: [
      'Recevoir les ordonnances exécutées',
      'Comptabiliser les écritures',
      'Générer les journaux comptables',
      'Clôturer les dossiers'
    ]
  },
  {
    role: 'ADMIN',
    title: 'Administrateur',
    description: 'Gestion globale du système',
    permissions: ['Gérer les utilisateurs', 'Configurer le système', 'Accès à toutes les fonctionnalités'],
    color: 'bg-red-100 text-red-700',
    icon: 'menu-navigation',
    illustration: 'add-button',
    workflow: [
      'Gérer les utilisateurs et rôles',
      'Configurer les paramètres système',
      'Superviser les processus',
      'Maintenir la sécurité'
    ]
  }
]

// Hook personnalisé pour la recherche intelligente
function useSmartSearch() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (query.length > 2) {
      const filtered = popularQuestions.filter(q =>
        q.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [query])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setShowSuggestions(false)
    return searchQuery
  }

  return {
    query,
    setQuery,
    suggestions,
    showSuggestions,
    handleSearch,
    setShowSuggestions
  }
}


// Composant de recherche intelligente épuré
function SmartSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const { query, setQuery, suggestions, showSuggestions, handleSearch, setShowSuggestions } = useSmartSearch()

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher dans l'aide..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch(handleSearch(query))}
          />
        </div>
        <Button onClick={() => onSearch(handleSearch(query))}>
          Rechercher
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-md bg-background z-10">
          <div className="p-2 space-y-1">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                className="w-full text-left p-2 hover:bg-muted rounded text-sm transition-colors"
                onClick={() => {
                  setQuery(suggestion)
                  setShowSuggestions(false)
                  onSearch(handleSearch(suggestion))
                }}
              >
                <Search className="inline h-3 w-3 mr-2" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Composant FAQ avec illustrations
function FAQSection() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {faqData.map((category) => (
        <div key={category.category} className="border border-border rounded-lg overflow-hidden">
          {/* Header de catégorie avec illustration */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SimpleIllustration type={category.icon} className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{category.category}</h3>
            </div>
          </div>

          {/* Questions de la catégorie */}
          <div className="p-4 space-y-4">
            {category.questions.map((faq, index) => {
              const questionId = `${category.category}-${index}`
              const isExpanded = expanded === questionId

              return (
                <div key={index} className="border border-border/50 rounded-lg overflow-hidden">
                  <button
                    className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : questionId)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-muted/50 rounded-lg">
                        <SimpleIllustration type={faq.illustration} className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-sm text-foreground hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                        <ChevronRight className={`inline h-4 w-4 ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      <div className="pt-4 space-y-4">
                        {/* Réponse principale */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">A</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>

                        {/* Étapes détaillées */}
                        {faq.steps && faq.steps.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground mb-2">Étapes détaillées :</h4>
                            {faq.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-medium">
                                  {stepIndex + 1}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Composant d'illustration SVG simple
function SimpleIllustration({ type, className = "w-8 h-8" }: { type: string; className?: string }) {
  const illustrations = {
    'menu-navigation': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="6" width="24" height="3" rx="1" fill="currentColor" opacity="0.6"/>
        <rect x="4" y="12" width="18" height="3" rx="1" fill="currentColor"/>
        <rect x="4" y="18" width="20" height="3" rx="1" fill="currentColor" opacity="0.4"/>
        <circle cx="26" cy="7.5" r="2" fill="currentColor" className="text-primary"/>
      </svg>
    ),
    'form-filling': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1"/>
        <circle cx="16" cy="22" r="2" fill="currentColor" className="text-primary"/>
      </svg>
    ),
    'document-upload': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4L8 12h6v8h4v-8h6L16 4z" fill="currentColor"/>
        <rect x="6" y="18" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="10" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="25" x2="18" y2="25" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
    'budget-selection': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 8v16M8 16h16" stroke="currentColor" strokeWidth="1"/>
        <circle cx="16" cy="16" r="2" fill="currentColor" className="text-primary"/>
        <text x="16" y="28" textAnchor="middle" fontSize="6" fill="currentColor">€</text>
      </svg>
    ),
    'submit-validation': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 12l2 2" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        <path d="M14 20l-2-2" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    'pending-list': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="10" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="1"/>
        <circle cx="24" cy="10" r="3" fill="currentColor" className="text-orange-500"/>
        <text x="24" y="11.5" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">2</text>
      </svg>
    ),
    'open-dossier': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 8h20v16H6z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 8L10 4h12l4 4" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1"/>
        <path d="M13 19l6-6M19 19l-6-6" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    'document-check': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="1"/>
        <path d="M10 22l3 3 6-6" stroke="currentColor" strokeWidth="2" className="text-green-500"/>
      </svg>
    ),
    'approve-reject': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" className="text-green-500"/>
        <path d="M9 16l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"/>
        <circle cx="20" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" className="text-red-500"/>
        <path d="M17 13l6 6M23 13l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"/>
      </svg>
    ),
    'add-comments': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C8.3 2 2 7.6 2 14c0 4.1 2.5 7.8 6.3 9.8L6 28l4.2-2.3c1.8.5 3.7.8 5.8.8 7.7 0 14-5.6 14-12S23.7 2 16 2z" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="20" cy="14" r="1.5" fill="currentColor"/>
        <path d="M10 20h12" stroke="currentColor" strokeWidth="1"/>
        <text x="26" y="12" textAnchor="middle" fontSize="8" fill="currentColor" className="text-primary">💬</text>
      </svg>
    ),
    'add-button': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="2" fill="currentColor" className="text-primary"/>
      </svg>
    ),
    'file-selection': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="6" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="12" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1"/>
        <line x1="12" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="1"/>
        <line x1="12" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1"/>
        <circle cx="22" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" className="text-blue-500"/>
        <path d="M19 9l6 6" stroke="currentColor" strokeWidth="1" className="text-blue-500"/>
      </svg>
    ),
    'document-categorization': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1"/>
        <line x1="10" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="1"/>
        <rect x="10" y="18" width="12" height="2" rx="1" fill="currentColor" className="text-primary" opacity="0.3"/>
        <text x="16" y="19.5" textAnchor="middle" fontSize="6" fill="currentColor" className="text-primary">Tag</text>
      </svg>
    ),
    'validation-success': (
      <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" className="text-green-500"/>
        <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"/>
        <path d="M14 16l2 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    )
  }

  return illustrations[type as keyof typeof illustrations] || (
    <div className={`${className} bg-muted rounded flex items-center justify-center`}>
      <HelpCircle className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}

// Composant Guides étape par étape avec illustrations visuelles
function StepByStepGuides() {
  return (
    <div className="space-y-8">
      {stepByStepGuides.map((guide) => (
        <div key={guide.id} className="border border-border rounded-lg overflow-hidden">
          {/* Header du guide */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <SimpleIllustration type={guide.illustration} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground">{guide.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {guide.estimatedTime}
                </div>
                <Badge variant={guide.difficulty === 'Facile' ? 'default' : 'secondary'}>
                  {guide.difficulty}
                </Badge>
              </div>
            </div>

            {/* Barre de progression visuelle */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Progression :</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(100 / guide.steps.length) * guide.steps.length}%` }}
                />
              </div>
              <span>{guide.steps.length} étapes</span>
            </div>
          </div>

          {/* Étapes du guide */}
          <div className="p-6 space-y-6">
            {guide.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 group">
                {/* Numéro d'étape avec illustration */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold mb-2 group-hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  <div className="w-px bg-border flex-1" style={{ minHeight: '40px' }} />
                </div>

                {/* Contenu de l'étape */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start gap-4">
                    {/* Illustration de l'étape */}
                    <div className="flex-shrink-0 p-2 bg-muted/50 rounded-lg">
                      <SimpleIllustration type={step.illustration} className="w-6 h-6" />
                    </div>

                    {/* Texte et tip */}
                    <div className="flex-1">
                      <p className="text-sm text-foreground mb-2 leading-relaxed">
                        {step.text}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-3 py-1">
                        <Lightbulb className="h-3 w-3 text-primary" />
                        <span>{step.tip}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions finales */}
          <div className="bg-muted/30 p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Guide terminé !</span>
              </div>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Voir le tutoriel vidéo
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Hook pour la personnalisation contextuelle
function useContextualHelp(userRole?: string) {
  const contextualContent = useMemo(() => {
    const baseContent = {
      guides: stepByStepGuides,
      faq: faqData,
      popularQuestions
    }

    // Filtrer le contenu selon le rôle de l'utilisateur
    if (userRole === 'SECRETAIRE') {
      return {
        ...baseContent,
        popularQuestions: [
          'Comment créer un dossier comptable ?',
          'Comment uploader des documents ?',
          'Comment suivre l\'état d\'un dossier ?',
          'Quels sont mes rôles et permissions ?'
        ],
        guides: stepByStepGuides.filter(guide =>
          guide.id === 'create-dossier' || guide.id === 'upload-documents'
        )
      }
    }

    if (userRole === 'CONTROLEUR_BUDGETAIRE') {
      return {
        ...baseContent,
        popularQuestions: [
          'Comment valider un dossier ?',
          'Comment rejeter un dossier avec motif ?',
          'Comment consulter les statistiques ?',
          'Quelles sont les étapes de validation ?'
        ],
        guides: stepByStepGuides.filter(guide =>
          guide.id === 'validate-dossier'
        )
      }
    }

    return baseContent
  }, [userRole])

  return contextualContent
}

// Composant Chatbot d'aide épuré
function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assistant virtuel ACGE</DialogTitle>
        </DialogHeader>
        <div className="h-64 p-4 bg-muted rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">
            💬 Bonjour ! Je suis votre assistant virtuel. Posez-moi vos questions sur l'utilisation d'ACGE.
          </p>
        </div>
        <div className="flex space-x-2">
          <Input placeholder="Tapez votre question..." className="flex-1" />
          <Button>Envoyer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function HelpPage() {
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [userRole, setUserRole] = useState<string>('SECRETAIRE') // À remplacer par le rôle réel de l'utilisateur

  // Utiliser les hooks personnalisés
  const contextualContent = useContextualHelp(userRole)

  const handleSearch = (query: string) => {
    // Simulation de recherche avec le contenu contextuel
    console.log('Recherche:', query)
    setSearchResults([])

    // Afficher un message de bienvenue personnalisé selon le rôle
    if (query.includes('rôle') || query.includes('permission')) {
      // Afficher les informations de rôle
      console.log('Affichage des informations de rôle pour:', userRole)
    }
  }

  return (
    <CompactPageLayout>
      {/* Header avec sélecteur de rôle pour démo */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Centre d'aide ACGE"
          subtitle="Trouvez rapidement l'aide dont vous avez besoin"
        />
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rôle:</span>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="SECRETAIRE">Secrétaire</option>
            <option value="CONTROLEUR_BUDGETAIRE">Contrôleur Budgétaire</option>
            <option value="ORDONNATEUR">Ordonnateur</option>
            <option value="AGENT_COMPTABLE">Agent Comptable</option>
            <option value="ADMIN">Administrateur</option>
          </select>
        </div>
      </div>


      {/* Recherche intelligente */}
      <ContentSection
        title="Recherche dans l'aide"
        subtitle="Tapez votre question pour trouver des réponses instantanées"
      >
        <SmartSearch onSearch={handleSearch} />
        {searchResults.length > 0 && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <p className="text-sm">Résultats de recherche pour votre requête...</p>
            </CardContent>
          </Card>
        )}
      </ContentSection>

      {/* Navigation par onglets */}
      <Tabs defaultValue="guides" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-6">
          <ContentSection title="Guides étape par étape">
            <StepByStepGuides />
          </ContentSection>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <ContentSection title="Foire aux questions">
            <FAQSection />
          </ContentSection>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <ContentSection
            title="Rôles et permissions"
            subtitle="Comprendre les différents rôles dans l'application et leurs responsabilités"
          >
            <div className="space-y-6">
              {roleInfo.map((role) => (
                <div key={role.role} className="border border-border rounded-lg overflow-hidden">
                  {/* Header du rôle avec illustration */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <SimpleIllustration type={role.icon} className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={role.color}>{role.title}</Badge>
                        </div>
                        <h4 className="font-semibold text-foreground">{role.description}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Contenu du rôle */}
                  <div className="p-4 space-y-4">
                    {/* Permissions */}
                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">P</span>
                        </div>
                        Permissions
                      </h5>
                      <ul className="space-y-1">
                        {role.permissions.map((permission, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Workflow */}
                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">W</span>
                        </div>
                        Workflow typique
                      </h5>
                      <div className="space-y-2">
                        {role.workflow.map((step, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Illustration du workflow */}
                    <div className="flex justify-center pt-2">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <SimpleIllustration type={role.illustration} className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ContentSection>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <ContentSection
            title="Besoin d'aide supplémentaire ?"
            subtitle="Notre équipe de support est là pour vous aider"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-6 border border-border rounded-lg">
                <Mail className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <h4 className="font-semibold mb-2">Email</h4>
                <p className="text-sm text-muted-foreground mb-4">support@acge.gabon</p>
                <Button variant="outline" size="sm" className="w-full">
                  Envoyer un email
                </Button>
              </div>

              <div className="text-center p-6 border border-border rounded-lg">
                <Phone className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h4 className="font-semibold mb-2">Téléphone</h4>
                <p className="text-sm text-muted-foreground mb-4">+241 XX XX XX XX</p>
                <Button variant="outline" size="sm" className="w-full">
                  Appeler
                </Button>
              </div>

              <div className="text-center p-6 border border-border rounded-lg">
                <MessageCircle className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                <h4 className="font-semibold mb-2">Chat en ligne</h4>
                <p className="text-sm text-muted-foreground mb-4">Support 24h/7j</p>
                <Button variant="outline" size="sm" className="w-full">
                  Démarrer le chat
                </Button>
              </div>
            </div>
          </ContentSection>
        </TabsContent>
      </Tabs>

      {/* Chatbot d'aide flottant */}
      <HelpChatbot />
    </CompactPageLayout>
  )
}
