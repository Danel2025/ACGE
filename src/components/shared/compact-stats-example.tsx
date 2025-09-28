'use client'

import CompactStats, { type StatItem, type CompactStatsProps } from './compact-stats'
import { Users, FileText, TrendingUp, Activity, DollarSign, AlertTriangle } from 'lucide-react'

/**
 * Exemples d'utilisation du composant CompactStats réutilisable
 */
export function CompactStatsExamples() {
  // Données d'exemple
  const basicStats: StatItem[] = [
    {
      label: "Utilisateurs",
      value: 1234,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      className: "bg-blue-100",
      subtitle: "Utilisateurs actifs",
      tooltip: "Nombre total d'utilisateurs inscrits"
    },
    {
      label: "Documents",
      value: 567,
      icon: <FileText className="h-5 w-5 text-green-600" />,
      className: "bg-green-100",
      subtitle: "Fichiers partagés"
    },
    {
      label: "Croissance",
      value: "+23%",
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      className: "bg-purple-100",
      subtitle: "Ce mois-ci",
      badge: "Tendance"
    },
    {
      label: "Activité",
      value: 89,
      icon: <Activity className="h-5 w-5 text-orange-600" />,
      className: "bg-orange-100",
      subtitle: "Actions aujourd'hui"
    }
  ]

  const financialStats: StatItem[] = [
    {
      label: "Revenus",
      value: "€45,231",
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      className: "bg-green-100",
      subtitle: "Ce mois-ci",
      onClick: () => console.log('Revenus cliqué')
    },
    {
      label: "Dépenses",
      value: "€12,450",
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      className: "bg-red-100",
      subtitle: "Budget dépassé",
      color: "red"
    },
    {
      label: "Bénéfice",
      value: "€32,781",
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      className: "bg-emerald-100",
      subtitle: "Net ce mois-ci",
      badge: "Excellent"
    }
  ]

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-title-bold mb-4">Composant CompactStats - Exemples</h2>

        {/* Exemple basique */}
        <div className="mb-8">
          <h3 className="text-lg font-title-semibold mb-3">Configuration de base</h3>
          <CompactStats
            stats={basicStats}
            columns={4}
            size="md"
            variant="default"
            animated={true}
            showTooltips={true}
          />
        </div>

        {/* Exemple financier */}
        <div className="mb-8">
          <h3 className="text-lg font-title-semibold mb-3">Données financières</h3>
          <CompactStats
            stats={financialStats}
            columns={3}
            size="lg"
            variant="detailed"
            colorScheme="colorful"
            animated={true}
          />
        </div>

        {/* Exemple compact */}
        <div className="mb-8">
          <h3 className="text-lg font-title-semibold mb-3">Version compacte</h3>
          <CompactStats
            stats={basicStats}
            columns={6}
            size="sm"
            variant="compact"
            colorScheme="monochrome"
          />
        </div>

        {/* Exemple minimal */}
        <div className="mb-8">
          <h3 className="text-lg font-title-semibold mb-3">Version minimale</h3>
          <CompactStats
            stats={basicStats.slice(0, 2)}
            columns={2}
            size="xs"
            variant="minimal"
            colorScheme="pastel"
          />
        </div>

        {/* Exemple avec callback */}
        <div className="mb-8">
          <h3 className="text-lg font-title-semibold mb-3">Avec interactions</h3>
          <CompactStats
            stats={basicStats}
            columns={4}
            onStatClick={(stat, index) => {
              console.log(`Stat ${index} cliquée:`, stat.label, stat.value)
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Exemple d'usage avancé avec customisation complète
export function AdvancedCompactStatsExample() {
  const advancedStats: StatItem[] = [
    {
      label: "Performance",
      value: "98.5%",
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      className: "bg-blue-100",
      subtitle: "Temps de réponse",
      tooltip: "Performance moyenne du système",
      badge: "Excellent",
      color: "blue"
    },
    {
      label: "Disponibilité",
      value: "99.9%",
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      className: "bg-green-100",
      subtitle: "Uptime mensuel",
      tooltip: "Disponibilité du service",
      color: "green",
      onClick: () => console.log('Disponibilité cliquée')
    }
  ]

  return (
    <CompactStats
      stats={advancedStats}
      columns={2}
      size="lg"
      variant="detailed"
      colorScheme="colorful"
      animated={true}
      showTooltips={true}
      customColors={{
        primary: "blue",
        secondary: "gray",
        accent: "purple",
        background: "slate"
      }}
      onStatClick={(stat, index) => {
        console.log(`Stat avancée ${index} cliquée:`, stat)
      }}
    />
  )
}
