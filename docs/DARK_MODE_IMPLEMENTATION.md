# Implémentation du Mode Dark - ACGE

## Vue d'ensemble

L'application ACGE dispose maintenant d'un système de thème complet avec support pour les modes clair, sombre et système. Cette implémentation utilise `next-themes` pour une gestion robuste des thèmes.

## Architecture

### 1. Configuration de base

#### next-themes
- **Package**: `next-themes`
- **Configuration**: Dans `src/app/layout.tsx`
- **Attribut**: `class` pour appliquer les classes CSS
- **Thème par défaut**: `light` (mode clair par défaut)

#### Variables CSS
- **Fichier**: `src/app/globals.css`
- **Variables light**: Définies dans `:root`
- **Variables dark**: Définies dans `.dark`
- **Système**: Utilise OKLCH pour une meilleure perception des couleurs

### 2. Composants créés

#### ThemeToggle (`src/components/ui/theme-toggle.tsx`)
- Bouton simple pour basculer entre light/dark
- Animation fluide entre les icônes soleil/lune
- Intégré dans le header

#### ThemeSelector (`src/components/ui/theme-selector.tsx`)
- Menu déroulant avec 3 options : Clair, Sombre, Système
- Affichage de l'option active avec une coche
- Utilisé dans la page paramètres

#### useThemeHook (`src/hooks/use-theme.ts`)
- Hook personnalisé pour la gestion du thème
- Fonctions utilitaires : `toggleTheme`, `setLightTheme`, etc.
- Gestion du montage pour éviter l'hydratation

### 3. Pages et intégration

#### Page Paramètres (`src/app/(protected)/settings/page.tsx`)
- Section dédiée à l'apparence
- Sélecteur de thème complet
- Autres paramètres (notifications, sécurité, compte)

#### Page de Test (`src/app/test-theme/page.tsx`)
- Démonstration de tous les composants
- Affichage de l'état du thème
- Instructions de test

## Utilisation

### Pour les développeurs

#### Utilisation du hook
```typescript
import { useThemeHook } from '@/hooks/use-theme'

function MonComposant() {
  const { theme, isDark, isLight, toggleTheme } = useThemeHook()
  
  return (
    <button onClick={toggleTheme}>
      Thème actuel: {theme}
    </button>
  )
}
```

#### Utilisation directe de next-themes
```typescript
import { useTheme } from 'next-themes'

function MonComposant() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Passer en mode sombre
    </button>
  )
}
```

### Pour les utilisateurs

#### Toggle rapide
- Bouton dans le header (icône soleil/lune)
- Bascule entre light et dark

#### Configuration avancée
- Menu utilisateur → Paramètres
- Section Apparence → Sélecteur de thème
- Options : Clair, Sombre, Système

## Variables CSS disponibles

### Mode Light (par défaut)
- `--background`: Blanc pur
- `--foreground`: Gris foncé pour la lisibilité
- `--primary`: Bleu doux (plus agréable)
- `--secondary`: Gris très clair

### Mode Dark
- `--background`: Bleu primaire (cohérent avec l'identité ACGE)
- `--foreground`: Blanc pur pour le contraste
- `--primary`: Blanc (inversé par rapport au mode light)
- `--secondary`: Bleu plus clair

### Composants
- `--card`: Arrière-plan des cartes
- `--border`: Bordures
- `--input`: Champs de saisie
- `--muted`: Éléments atténués

### Sidebar
- `--sidebar`: Arrière-plan de la sidebar
- `--sidebar-foreground`: Texte de la sidebar
- `--sidebar-border`: Bordures de la sidebar

## Bonnes pratiques

### 1. Utilisation des classes Tailwind
```tsx
// ✅ Bon
<div className="bg-background text-foreground border-border">

// ❌ Éviter
<div className="bg-white dark:bg-black text-black dark:text-white">
```

### 2. Gestion de l'hydratation
```tsx
// ✅ Bon - Utiliser le hook
const { mounted } = useThemeHook()
if (!mounted) return <Skeleton />

// ❌ Éviter - Accès direct
const { theme } = useTheme() // Peut causer des erreurs d'hydratation
```

### 3. Animations et transitions
```css
/* ✅ Bon - Transitions fluides */
.transition-theme {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

## Tests

### Page de test
- URL: `/test-theme`
- Démonstration complète de tous les composants
- Affichage de l'état du thème
- Instructions détaillées

### Tests manuels
1. Basculer entre les modes avec le toggle
2. Utiliser le sélecteur de thème
3. Tester la persistance (recharger la page)
4. Vérifier le mode système
5. Tester sur mobile

## Maintenance

### Ajout de nouvelles couleurs
1. Ajouter la variable dans `globals.css`
2. Définir les valeurs light et dark
3. Utiliser avec `hsl(var(--nom-variable))`

### Modification du comportement
1. Modifier `useThemeHook` pour la logique
2. Ajuster les composants UI si nécessaire
3. Tester sur la page `/test-theme`

## Dépannage

### Problèmes courants

#### Flash de contenu non stylé
- Vérifier `suppressHydrationWarning` dans le layout
- S'assurer que `mounted` est géré correctement

#### Thème ne persiste pas
- Vérifier la configuration de `next-themes`
- Contrôler les paramètres du navigateur

#### Couleurs incorrectes
- Vérifier les variables CSS dans `globals.css`
- S'assurer que les classes Tailwind utilisent les bonnes variables

## Évolutions futures

### Fonctionnalités prévues
- [ ] Thèmes personnalisés par utilisateur
- [ ] Thèmes saisonniers (Noël, etc.)
- [ ] Export/import des préférences
- [ ] Thèmes par organisation

### Améliorations techniques
- [ ] Optimisation des performances
- [ ] Support des thèmes CSS personnalisés
- [ ] Intégration avec les préférences système avancées
