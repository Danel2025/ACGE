# 🔥 Supabase Realtime - Documentation ACGE

## Vue d'ensemble

L'application ACGE utilise **Supabase Realtime** pour des mises à jour automatiques en temps réel des dossiers comptables. Les utilisateurs reçoivent des notifications instantanées quand des dossiers changent de statut, sans avoir à rafraîchir manuellement.

## Architecture

### 1. Context Provider (`realtime-context.tsx`)

Gère la connexion WebSocket globale à Supabase Realtime.

**Fonctionnalités** :
- Connexion automatique quand l'utilisateur est connecté
- Gestion de la présence (qui est en ligne)
- Abonnement aux changements de base de données
- Broadcast d'événements personnalisés

**API** :
```typescript
const {
  isConnected,           // Statut de connexion
  connectionStatus,      // 'connecting' | 'connected' | 'disconnected'
  subscribeToDossierChanges,    // S'abonner aux changements de dossiers
  subscribeToNotifications,     // S'abonner aux notifications
  broadcastEvent                // Envoyer un événement personnalisé
} = useRealtime()
```

### 2. Hook personnalisé (`use-realtime-dossiers.ts`)

Simplifie l'écoute des changements de dossiers avec filtrage automatique par rôle.

**Utilisation** :
```typescript
const { updates, lastUpdate, isConnected } = useRealtimeDossiers({
  // Filtrer par statut de dossier
  filterByStatus: ['EN_ATTENTE_CB', 'VALIDE_CB'],

  // Callback quand un nouveau dossier est créé
  onNewDossier: (dossier) => {
    console.log('Nouveau dossier:', dossier)
    refreshData()
  },

  // Callback quand un dossier est mis à jour
  onUpdateDossier: (dossier) => {
    console.log('Dossier mis à jour:', dossier)
    refreshData()
  },

  // Callback quand un dossier est supprimé
  onDeleteDossier: (dossierId) => {
    console.log('Dossier supprimé:', dossierId)
    refreshData()
  }
})
```

### 3. Filtrage automatique par rôle

Le hook filtre automatiquement les notifications selon le rôle de l'utilisateur :

| Rôle | Statuts écoutés |
|------|----------------|
| **ADMIN** | Tous les statuts |
| **SECRETAIRE** | `BROUILLON`, `REJETE_CB`, `REJETE_ORDONNATEUR`, `REJETE_AC` |
| **CONTROLEUR_BUDGETAIRE** | `EN_ATTENTE_CB`, `REJETE_CB` |
| **ORDONNATEUR** | `VALIDE_CB`, `EN_ATTENTE_ORDONNANCEMENT`, `REJETE_ORDONNATEUR` |
| **AGENT_COMPTABLE** | `ORDONNE`, `EN_ATTENTE_COMPTABILISATION`, `REJETE_AC` |

## Implémentations par Dashboard

### Dashboard CB (`cb-dashboard/page.tsx`)

✅ Implémenté avec :
- Notifications automatiques pour nouveaux dossiers en attente CB
- Badge "En temps réel" dans l'en-tête
- Auto-refresh de la liste quand un dossier change

```typescript
const { isConnected } = useRealtimeDossiers({
  filterByStatus: ['EN_ATTENTE_CB', 'VALIDE_CB', 'REJETE_CB'],
  onNewDossier: (dossier) => {
    loadDossiers()
    toast.success('Nouveau dossier disponible')
  },
  onUpdateDossier: () => loadDossiers()
})
```

### Dashboard Ordonnateur (`ordonnateur-dashboard/page.tsx`)

✅ Implémenté avec :
- Notifications pour dossiers validés CB
- Auto-refresh quand un dossier passe en attente d'ordonnancement

```typescript
const { isConnected } = useRealtimeDossiers({
  filterByStatus: ['VALIDE_CB', 'EN_ATTENTE_ORDONNANCEMENT', 'ORDONNE'],
  onNewDossier: (dossier) => {
    loadDossiers()
    toast.success('Nouveau dossier à ordonner')
  },
  onUpdateDossier: () => loadDossiers()
})
```

### Dashboard Agent Comptable (`ac-dashboard/page.tsx`)

✅ Implémenté avec :
- Notifications pour dossiers ordonnés
- Auto-refresh pour comptabilisation

```typescript
const { isConnected } = useRealtimeDossiers({
  filterByStatus: ['ORDONNE', 'EN_ATTENTE_COMPTABILISATION', 'VALIDE_DEFINITIVEMENT'],
  onNewDossier: (dossier) => {
    loadDossiers()
    toast.success('Nouveau dossier à traiter')
  },
  onUpdateDossier: () => loadDossiers()
})
```

## Composants UI

### Badge de statut (`realtime-status-badge.tsx`)

Affiche le statut de connexion Realtime :

```typescript
import { RealtimeStatusBadge } from '@/components/realtime/realtime-status-badge'

<RealtimeStatusBadge
  showDisconnected={true}  // Afficher même si déconnecté
  size="md"                // 'sm' | 'md' | 'lg'
/>
```

**États affichés** :
- 🟢 **En temps réel** : Connecté et actif
- 🟡 **Connexion...** : En cours de connexion
- ⚫ **Hors ligne** : Déconnecté

## Configuration Supabase

### Prérequis

1. Activer Realtime sur les tables Supabase :
```sql
-- Dans le dashboard Supabase > Database > Tables > dossiers
-- Activer "Enable Realtime"
```

2. Variables d'environnement :
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme
```

### Row Level Security (RLS)

Les notifications respectent automatiquement les politiques RLS de Supabase. Si un utilisateur n'a pas accès à un dossier, il ne recevra pas de notification pour ce dossier.

## Avantages

✅ **Expérience utilisateur améliorée** : Plus besoin de rafraîchir manuellement
✅ **Notifications instantanées** : Latence < 100ms
✅ **Sécurisé** : Respecte les permissions de la base de données
✅ **Économique** : Gratuit jusqu'à 200 connexions simultanées
✅ **Scalable** : Géré par l'infrastructure Supabase

## Performances

- **Latence moyenne** : ~50-100ms
- **Reconnexion automatique** : En cas de perte de connexion
- **Heartbeat** : Envoyé toutes les 25 secondes pour maintenir la connexion
- **Batch updates** : Les changements multiples sont groupés

## Dépannage

### La connexion ne s'établit pas

1. Vérifier que Realtime est activé sur la table `dossiers`
2. Vérifier les variables d'environnement Supabase
3. Vérifier la console navigateur pour les erreurs WebSocket

### Les notifications ne s'affichent pas

1. Vérifier que le filtre `filterByStatus` correspond aux statuts attendus
2. Vérifier que l'utilisateur a les permissions RLS appropriées
3. Vérifier que le hook `useRealtimeDossiers` est correctement appelé

### Performance dégradée

1. Limiter le nombre d'abonnements simultanés
2. Utiliser `clearUpdates()` pour nettoyer l'historique
3. Éviter les rechargements inutiles dans les callbacks

## Évolutions futures

🔮 **Fonctionnalités possibles** :
- [ ] Chat en temps réel entre rôles
- [ ] Indicateur "Qui est en train de modifier ce dossier"
- [ ] Notifications de typing indicators
- [ ] Synchronisation de présence avancée
- [ ] Broadcast d'événements personnalisés

## Ressources

- [Documentation Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Documentation WebSockets](https://developer.mozilla.org/fr/docs/Web/API/WebSockets_API)
- [Guide Realtime Protocol](https://supabase.com/docs/guides/realtime/protocol)