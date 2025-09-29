# CompactStats - Composant Réutilisable

Un composant React hautement personnalisable pour afficher des statistiques dans des cartes compactes et ergonomiques.

## 🚀 Fonctionnalités

- ✅ **Entièrement personnalisable** : Tailles, couleurs, variantes
- ✅ **Responsive** : Support de 1 à 6 colonnes
- ✅ **États de chargement** : Squelettes animés intégrés
- ✅ **Interactions** : Callbacks et actions au clic
- ✅ **Tooltips** : Support des infobulles
- ✅ **Badges** : Indicateurs visuels personnalisables
- ✅ **Animations** : Transitions fluides
- ✅ **Accessibilité** : Support des screen readers
- ✅ **TypeScript** : Typage complet

## 📦 Installation

Le composant est déjà intégré dans le projet. Importez-le simplement :

```tsx
import CompactStats, { type StatItem } from '@/components/shared/compact-stats'
```

## 🔧 Utilisation de Base

```tsx
import { Users, FileText, TrendingUp } from 'lucide-react'

const stats: StatItem[] = [
  {
    label: "Utilisateurs",
    value: 1234,
    icon: <Users className="h-5 w-5 text-blue-600" />,
    className: "bg-blue-100",
    subtitle: "Actifs ce mois-ci"
  },
  {
    label: "Documents",
    value: 567,
    icon: <FileText className="h-5 w-5 text-green-600" />,
    className: "bg-green-100",
    subtitle: "Partagés aujourd'hui"
  }
]

<CompactStats
  stats={stats}
  columns={3}
  size="md"
  variant="default"
/>
```

## ⚙️ Props Principales

### CompactStatsProps

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `stats` | `StatItem[]` | **Requis** | Tableau des statistiques à afficher |
| `columns` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` | Nombre de colonnes |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Taille des cartes |
| `variant` | `'default' \| 'compact' \| 'detailed' \| 'minimal'` | `'default'` | Style d'affichage |
| `colorScheme` | `'default' \| 'colorful' \| 'monochrome' \| 'pastel'` | `'default'` | Schéma de couleurs |
| `loading` | `boolean` | `false` | État de chargement global |
| `disabled` | `boolean` | `false` | Composant désactivé |
| `animated` | `boolean` | `true` | Animations activées |
| `showTooltips` | `boolean` | `false` | Affichage des tooltips |
| `onStatClick` | `(stat: StatItem, index: number) => void` | - | Callback au clic |
| `customColors` | `object` | - | Couleurs personnalisées |

### StatItem Interface

| Propriété | Type | Description |
|-----------|------|-------------|
| `label` | `string` | **Requis** - Libellé principal |
| `value` | `string \| number \| ReactNode` | **Requis** - Valeur à afficher |
| `icon` | `ReactNode` | **Requis** - Icône à afficher |
| `className` | `string` | Classes CSS pour l'icône |
| `subtitle` | `string` | Sous-titre optionnel |
| `onClick` | `() => void` | Action au clic |
| `loading` | `boolean` | État de chargement individuel |
| `tooltip` | `string` | Texte d'infobulle |
| `color` | `string` | Couleur personnalisée |
| `disabled` | `boolean` | Élément désactivé |
| `badge` | `string` | Badge à afficher |

## 🎨 Tailles Disponibles

### xs (Très compact)
- Icônes: 12x12px
- Padding: 8px
- Texte: 12px
- Usage: Tablettes, espaces réduits

### sm (Compact)
- Icônes: 16x16px
- Padding: 10px
- Texte: 12px
- Usage: Dashboards denses

### md (Standard) - Défaut
- Icônes: 20x20px
- Padding: 12px
- Texte: 14px
- Usage: Recommandé pour la plupart des cas

### lg (Large)
- Icônes: 24x24px
- Padding: 16px
- Texte: 16px
- Usage: Présentations, grandes interfaces

## 🎭 Variantes

### default
Style standard avec ombres et animations.

### compact
Version épurée sans ombres au survol.

### detailed
Bordures plus épaisses pour un look plus sophistiqué.

### minimal
Style minimaliste sans bordures ni ombres.

## 🌈 Schémas de Couleurs

### default
Fond gris neutre avec effets de survol subtils.

### colorful
Dégradés colorés avec animations vibrantes.

### monochrome
Style sobre avec nuances de gris.

### pastel
Dégradés pastels doux et apaisants.

## 📱 Responsive Design

Le composant s'adapte automatiquement aux différentes tailles d'écran :

- **Mobile** : 1-2 colonnes maximum
- **Tablette** : 2-3 colonnes
- **Desktop** : 3-6 colonnes selon la configuration

## 🔄 États de Chargement

```tsx
// Chargement global
<CompactStats stats={stats} loading={true} columns={4} />

// Chargement individuel
const statsWithLoading: StatItem[] = [
  {
    label: "Données",
    value: 1234,
    icon: <Activity className="h-5 w-5" />,
    loading: false
  },
  {
    label: "En cours",
    value: 0,
    icon: <Loader className="h-5 w-5" />,
    loading: true
  }
]
```

## 🖱️ Interactions

```tsx
<CompactStats
  stats={stats}
  onStatClick={(stat, index) => {
    console.log(`Stat ${index} cliquée:`, stat.label)
    // Votre logique ici
  }}
/>
```

## 💡 Exemples Avancés

### Dashboard Analytics
```tsx
const analyticsStats: StatItem[] = [
  {
    label: "Visiteurs",
    value: "12,543",
    icon: <Users className="h-5 w-5 text-blue-600" />,
    className: "bg-blue-100",
    subtitle: "Aujourd'hui",
    badge: "Live"
  },
  {
    label: "Conversion",
    value: "3.24%",
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
    className: "bg-green-100",
    subtitle: "Taux de conversion"
  }
]

<CompactStats
  stats={analyticsStats}
  columns={5}
  size="sm"
  variant="compact"
  colorScheme="colorful"
  showTooltips={true}
/>
```

### KPI Financiers
```tsx
const financialKPIs: StatItem[] = [
  {
    label: "MRR",
    value: "$45,231",
    icon: <DollarSign className="h-5 w-5 text-green-600" />,
    className: "bg-green-100",
    subtitle: "Revenus mensuels récurrents",
    tooltip: "Monthly Recurring Revenue"
  },
  {
    label: "Churn Rate",
    value: "2.1%",
    icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
    className: "bg-red-100",
    subtitle: "Taux d'attrition",
    badge: "Attention"
  }
]

<CompactStats
  stats={financialKPIs}
  columns={2}
  size="lg"
  variant="detailed"
  colorScheme="default"
/>
```

## ⚠️ Bonnes Pratiques

1. **Limitez à 6 colonnes maximum** pour la lisibilité
2. **Utilisez des icônes cohérentes** dans la même section
3. **Préférez les valeurs numériques courtes** pour une meilleure lisibilité
4. **Ajoutez des tooltips** pour les métriques complexes
5. **Testez sur mobile** pour vérifier le responsive design

## 🔧 Personnalisation Avancée

```tsx
<CompactStats
  stats={stats}
  columns={4}
  size="md"
  variant="default"
  colorScheme="colorful"
  customColors={{
    primary: "indigo",
    secondary: "gray",
    accent: "purple",
    background: "slate"
  }}
  onStatClick={(stat, index) => {
    // Logique personnalisée
  }}
  animated={true}
  showTooltips={true}
/>
```

## 🎯 Performance

- ✅ **Optimisé** avec React.memo et forwardRef
- ✅ **Léger** : Taille bundle minimale
- ✅ **Efficace** : Pas de re-renders inutiles
- ✅ **Accessible** : Support des screen readers

---

*Pour plus d'exemples, consultez le fichier `compact-stats-example.tsx`*.
