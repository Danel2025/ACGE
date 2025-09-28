# Visualiseur de Documents - Documentation

## Vue d'ensemble

Ce package contient une suite complète de composants pour la visualisation de documents avec des fonctionnalités avancées et une architecture modulaire.

## Composants Principaux

### 1. DocumentViewer (Simple)
Visualiseur de base avec contrôles essentiels.

```tsx
import { DocumentViewer } from '@/components/documents'

<DocumentViewer
  document={document}
  isOpen={isOpen}
  onClose={onClose}
  onNext={hasNext ? goToNext : undefined}
  onPrevious={hasPrevious ? goToPrevious : undefined}
  hasNext={hasNext}
  hasPrevious={hasPrevious}
/>
```

**Fonctionnalités :**
- Support multi-format (PDF, images, vidéos, audio, texte)
- Contrôles de zoom et rotation pour les images
- Contrôles de lecture pour les médias
- Raccourcis clavier
- Mode plein écran

### 2. AdvancedDocumentViewer
Visualiseur avec navigation entre documents et miniatures.

```tsx
import { AdvancedDocumentViewer } from '@/components/documents'

<AdvancedDocumentViewer
  documents={documents}
  currentIndex={currentIndex}
  isOpen={isOpen}
  onClose={onClose}
  onDocumentChange={handleDocumentChange}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onShare={handleShare}
  onDownload={handleDownload}
/>
```

**Fonctionnalités :**
- Navigation entre documents
- Miniatures en barre latérale
- Paramètres personnalisables
- Actions sur les documents

### 3. GalleryViewer
Vue en galerie avec barre latérale de navigation.

```tsx
import { GalleryViewer } from '@/components/documents'

<GalleryViewer
  documents={documents}
  isOpen={isOpen}
  onClose={onClose}
  onDocumentSelect={handleDocumentSelect}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onShare={handleShare}
  onDownload={handleDownload}
/>
```

**Fonctionnalités :**
- Vue en grille ou liste
- Recherche et filtrage
- Tri des documents
- Miniatures avec préchargement

### 4. UltimateDocumentViewer
Visualiseur complet avec toutes les fonctionnalités.

```tsx
import { UltimateDocumentViewer } from '@/components/documents'

<UltimateDocumentViewer
  documents={documents}
  currentIndex={currentIndex}
  isOpen={isOpen}
  onClose={onClose}
  onDocumentChange={handleDocumentChange}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onShare={handleShare}
  onDownload={handleDownload}
/>
```

**Fonctionnalités :**
- Toutes les fonctionnalités des autres visualiseurs
- Annotations interactives
- Panneau de métadonnées
- Monitoring des performances
- Cache intelligent

## Composants d'Ancrage

### DocumentAnnotations
Système d'annotations interactives.

```tsx
import { DocumentAnnotations } from '@/components/documents'

<DocumentAnnotations
  documentId={document.id}
  isVisible={showAnnotations}
  onToggle={() => setShowAnnotations(!showAnnotations)}
  onAnnotationAdd={handleAnnotationAdd}
  onAnnotationUpdate={handleAnnotationUpdate}
  onAnnotationDelete={handleAnnotationDelete}
/>
```

**Types d'annotations :**
- Texte
- Surlignage
- Flèches
- Formes géométriques
- Épinglettes

### DocumentMetadataPanel
Panneau de métadonnées éditable.

```tsx
import { DocumentMetadataPanel } from '@/components/documents'

<DocumentMetadataPanel
  document={document}
  isVisible={showMetadata}
  onToggle={() => setShowMetadata(!showMetadata)}
  onUpdate={handleMetadataUpdate}
  onDownload={handleDownload}
  onShare={handleShare}
/>
```

### DocumentThumbnails
Navigation par miniatures.

```tsx
import { DocumentThumbnails } from '@/components/documents'

<DocumentThumbnails
  documents={documents}
  currentIndex={currentIndex}
  onDocumentSelect={handleDocumentSelect}
  isVisible={showThumbnails}
  onToggle={() => setShowThumbnails(!showThumbnails)}
  onDownload={handleDownload}
/>
```

### PerformanceMonitor
Monitoring des performances en temps réel.

```tsx
import { PerformanceMonitor } from '@/components/documents'

<PerformanceMonitor
  isVisible={showPerformance}
  onToggle={() => setShowPerformance(!showPerformance)}
  onClearCache={handleClearCache}
  onOptimize={handleOptimize}
/>
```

## Hooks

### useDocumentViewer
Hook principal pour la gestion de l'état du visualiseur.

```tsx
import { useDocumentViewer } from '@/hooks/use-document-viewer'

const {
  state,
  currentDocument,
  hasNext,
  hasPrevious,
  goToNext,
  goToPrevious,
  goToDocument,
  openViewer,
  closeViewer,
  togglePlayPause,
  setZoom,
  setRotation,
  // ... autres méthodes
} = useDocumentViewer({
  documents,
  initialIndex: 0,
  onDocumentChange: (document, index) => {
    console.log('Document changé:', document.title)
  }
})
```

### useDocumentCache
Hook pour la gestion du cache des documents.

```tsx
import { useDocumentCache } from '@/hooks/use-document-cache'

const {
  loadDocument,
  preloadDocuments,
  clear,
  stats,
  isFull
} = useDocumentCache({
  maxSize: 200 * 1024 * 1024, // 200MB
  maxAge: 30 * 60 * 1000, // 30 minutes
  maxEntries: 100
})
```

## Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Escape` | Fermer le visualiseur |
| `←` / `→` | Navigation entre documents |
| `Space` | Lecture/Pause (médias) |
| `M` | Activer/Désactiver le son |
| `Ctrl+F` | Mode plein écran |
| `Ctrl+A` | Basculer les annotations |
| `Ctrl+M` | Basculer les métadonnées |
| `Ctrl+T` | Basculer les miniatures |
| `Ctrl+P` | Basculer le monitoring |
| `Ctrl++` | Zoom avant |
| `Ctrl+-` | Zoom arrière |
| `Ctrl+0` | Zoom par défaut |
| `Ctrl+R` | Rotation |

## Types Supportés

### Images
- JPEG, PNG, GIF, WebP, SVG
- Contrôles : zoom, rotation, plein écran

### Documents
- PDF (via iframe)
- Contrôles : zoom, navigation

### Médias
- Vidéos : MP4, WebM, OGG
- Audio : MP3, WAV, OGG
- Contrôles : lecture, pause, volume, plein écran

### Texte
- TXT, MD, HTML, CSS, JS
- Affichage via iframe

## Configuration

### Options du Cache
```tsx
const cacheOptions = {
  maxSize: 200 * 1024 * 1024, // Taille maximale en bytes
  maxAge: 30 * 60 * 1000,     // Âge maximal en millisecondes
  maxEntries: 100             // Nombre maximum d'entrées
}
```

### Options du Visualiseur
```tsx
const viewerSettings = {
  showAnnotations: false,
  showMetadata: false,
  showThumbnails: true,
  showPerformance: false,
  isFullscreen: false,
  theme: 'auto' // 'light' | 'dark' | 'auto'
}
```

## Performance

### Optimisations Incluses
- Cache intelligent avec LRU
- Préchargement des documents adjacents
- Lazy loading des miniatures
- Nettoyage automatique de la mémoire
- Monitoring des performances en temps réel

### Métriques Surveillées
- Temps de chargement
- Utilisation mémoire
- Taux de succès du cache
- Nombre de requêtes réseau
- Nombre d'erreurs

## Exemple d'Utilisation Complète

```tsx
import { UltimateDocumentViewer } from '@/components/documents'

function MyDocumentPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const handleDocumentChange = (index: number, document: DocumentItem) => {
    setCurrentIndex(index)
    console.log('Document actuel:', document.title)
  }

  const handleEdit = (document: DocumentItem) => {
    // Logique d'édition
  }

  const handleDelete = (document: DocumentItem) => {
    // Logique de suppression
  }

  const handleShare = (document: DocumentItem) => {
    // Logique de partage
  }

  const handleDownload = (document: DocumentItem) => {
    // Logique de téléchargement
  }

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Ouvrir le visualiseur
      </button>

      <UltimateDocumentViewer
        documents={documents}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onDocumentChange={handleDocumentChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShare={handleShare}
        onDownload={handleDownload}
      />
    </div>
  )
}
```

## Migration depuis l'Ancien Composant

Pour migrer depuis l'ancien `DocumentPreviewModal` :

```tsx
// Ancien code
import { DocumentPreviewModal } from '@/components/documents/document-preview-modal'

// Nouveau code
import { DocumentPreviewModal } from '@/components/documents'

// L'API reste compatible, mais vous pouvez maintenant utiliser les composants avancés
import { UltimateDocumentViewer } from '@/components/documents'
```

## Support et Contribution

Pour signaler des bugs ou proposer des améliorations, veuillez créer une issue sur le repository du projet.

## Licence

Ce code est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
