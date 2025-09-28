# 🔍 Guide des Suggestions de Recherche - ACGE

## 📋 **Vue d'ensemble**

Le système de suggestions de recherche ACGE offre une expérience utilisateur améliorée avec autocomplétion intelligente dans toutes les barres de recherche du projet.

---

## ✨ **Fonctionnalités**

### **1. Suggestions Intelligentes**
- **Documents** : Titre, description, nom de fichier
- **Dossiers** : Nom, description, nombre de documents
- **Tags** : Nom du tag, nombre d'utilisations
- **Utilisateurs** : Nom, email

### **2. Interface Utilisateur**
- **Debouncing** : 300ms pour éviter les requêtes excessives
- **Navigation clavier** : Flèches haut/bas, Entrée, Échap
- **Sélection souris** : Clic pour sélectionner
- **Indicateurs visuels** : Icônes, badges, métadonnées

### **3. Performance**
- **Cache intelligent** : Évite les requêtes répétées
- **Limitation** : Maximum 8-10 suggestions par requête
- **Nettoyage automatique** : Cache limité à 100 entrées

---

## 🏗️ **Architecture**

### **Composants Principaux**

```
src/
├── components/ui/search-suggestions.tsx    # Composant principal
├── hooks/use-search-suggestions.ts         # Hook de gestion
├── app/api/search/suggestions/route.ts     # API endpoint
└── components/shared/content-toolbar.tsx   # Intégration
```

### **Flux de Données**

```
Utilisateur tape → Hook debounce → API → Cache → Suggestions → UI
```

---

## 🚀 **Utilisation**

### **1. Dans une Barre de Recherche**

```tsx
import { SearchSuggestions } from '@/components/ui/search-suggestions'
import { useSearchSuggestions } from '@/hooks/use-search-suggestions'

function MySearchComponent() {
  const [query, setQuery] = useState('')
  const { suggestions, isLoading } = useSearchSuggestions(query)

  const handleSelect = (suggestion: SearchSuggestion) => {
    // Logique de sélection
    console.log('Sélectionné:', suggestion)
  }

  return (
    <SearchSuggestions
      value={query}
      onChange={setQuery}
      onSelect={handleSelect}
      suggestions={suggestions}
      isLoading={isLoading}
      placeholder="Rechercher..."
    />
  )
}
```

### **2. Dans ContentToolbar (Automatique)**

```tsx
<ContentToolbar
  searchQuery={searchQuery}
  onSearchQueryChange={setSearchQuery}
  onSearchSelect={handleSearchSelect}
  enableSuggestions={true} // Activé par défaut
  // ... autres props
/>
```

### **3. Configuration du Hook**

```tsx
const { suggestions, isLoading, error } = useSearchSuggestions(query, {
  debounceMs: 300,        // Délai de debouncing
  minQueryLength: 2,      // Longueur minimale
  maxSuggestions: 8       // Nombre max de suggestions
})
```

---

## 🔧 **API Endpoint**

### **GET /api/search/suggestions**

**Paramètres :**
- `q` : Requête de recherche (requis, min 2 caractères)
- `limit` : Nombre max de suggestions (défaut: 10)
- `type` : Type de contenu ('all', 'documents', 'folders', 'tags', 'users')

**Exemple :**
```bash
GET /api/search/suggestions?q=document&limit=5&type=documents
```

**Réponse :**
```json
{
  "suggestions": [
    {
      "id": "doc-123",
      "text": "Document de test",
      "type": "document",
      "metadata": {
        "title": "Document de test",
        "description": "Description du document",
        "fileType": "PDF",
        "fileSize": 1024000
      }
    }
  ]
}
```

---

## 🎨 **Personnalisation**

### **1. Types de Suggestions**

```tsx
export interface SearchSuggestion {
  id: string
  text: string
  type: 'document' | 'folder' | 'tag' | 'user'
  metadata?: {
    title?: string
    description?: string
    fileType?: string
    fileSize?: number
    documentCount?: number
    tagCount?: number
  }
}
```

### **2. Styles CSS**

Les suggestions utilisent les classes Tailwind CSS :
- `.bg-popover` : Arrière-plan
- `.border` : Bordure
- `.shadow-lg` : Ombre
- `.hover:bg-accent` : Effet hover

### **3. Icônes et Badges**

Chaque type a son icône et badge :
- **Document** : `FileText` + badge bleu
- **Dossier** : `FolderOpen` + badge violet
- **Tag** : `Tag` + badge jaune
- **Utilisateur** : `User` + badge violet clair

---

## 🔍 **Tests**

### **Page de Test Interactive**

Accédez à `/test-search-suggestions.html` pour tester :

1. **Test API** : Vérification de l'endpoint
2. **Test Interactif** : Saisie en temps réel
3. **Tests Rapides** : Requêtes prédéfinies
4. **Statut** : Vérification des composants

### **Tests Automatisés**

```bash
# Test de l'API
curl "http://localhost:3000/api/search/suggestions?q=test&limit=5"

# Test avec différents types
curl "http://localhost:3000/api/search/suggestions?q=admin&type=users"
```

---

## 🛠️ **Dépannage**

### **Problèmes Courants**

1. **Suggestions ne s'affichent pas**
   - Vérifier la longueur minimale (2 caractères)
   - Vérifier la connexion à la base de données
   - Vérifier les logs de l'API

2. **Performance lente**
   - Réduire `maxSuggestions`
   - Augmenter `debounceMs`
   - Vérifier les index de base de données

3. **Erreurs de cache**
   - Le cache se nettoie automatiquement
   - Redémarrer l'application si nécessaire

### **Logs de Debug**

```typescript
// Activer les logs dans le hook
const { suggestions, isLoading, error } = useSearchSuggestions(query, {
  debug: true // Affiche les logs dans la console
})
```

---

## 📈 **Optimisations Futures**

### **1. Recherche Avancée**
- Recherche floue (fuzzy search)
- Recherche par synonymes
- Recherche par contexte

### **2. Intelligence Artificielle**
- Suggestions basées sur l'historique
- Apprentissage des préférences utilisateur
- Prédiction de recherche

### **3. Performance**
- Indexation Elasticsearch
- Cache Redis
- Pagination des suggestions

---

## 🔗 **Intégrations**

### **Pages avec Suggestions**

- ✅ **Header Global** : Recherche globale
- ✅ **Page Documents** : Recherche de fichiers
- ✅ **Page Dossiers** : Recherche de dossiers
- ✅ **Barres d'outils** : Recherche contextuelle

### **Navigation Intelligente**

- **Document** → Page documents avec filtre
- **Dossier** → Page dossiers avec dossier ouvert
- **Tag** → Page documents avec tag sélectionné
- **Utilisateur** → Page documents filtrée par auteur

---

## 📝 **Notes de Développement**

### **Conventions**

- **Debouncing** : 300ms par défaut
- **Longueur minimale** : 2 caractères
- **Limite par défaut** : 8 suggestions
- **Cache TTL** : 1 minute

### **Sécurité**

- Validation des entrées côté serveur
- Limitation du nombre de requêtes
- Sanitisation des données de sortie

### **Accessibilité**

- Navigation clavier complète
- ARIA labels appropriés
- Support des lecteurs d'écran
