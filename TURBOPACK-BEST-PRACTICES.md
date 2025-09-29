# Turbopack Best Practices - Next.js 15.5.4

Ce document décrit les meilleures pratiques pour éviter les erreurs HMR avec Turbopack dans Next.js 15.

## ✅ Configuration Optimale

### 1. **next.config.ts Configuration**

```typescript
experimental: {
  // CRITIQUE: Ajouter tous les packages avec imports modulaires
  optimizePackageImports: [
    'lucide-react',           // Icons
    '@radix-ui/react-*',      // UI Components
    'date-fns',               // Date utilities
    'react-hook-form',        // Forms
    '@hookform/resolvers',
    'sonner',                 // Notifications
    // Ajouter d'autres packages selon besoins
  ],
  optimizeCss: true,
  optimizeServerReact: true,
  memoryBasedWorkersCount: true,
}

turbopack: {
  resolveAlias: {
    '@': './src',
    // Autres alias personnalisés
  },
  resolveExtensions: [
    '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'
  ],
}
```

### 2. **Package.json Scripts**

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "dev:clean": "rimraf .next && rimraf node_modules/.cache && next dev --turbo",
    "dev:no-turbo": "next dev",  // Fallback si problèmes
    "build": "next build --turbo"
  }
}
```

## 🚫 Erreurs Courantes à Éviter

### 1. **Module Factory Deleted Error**

**Symptôme:**
```
Module factory is not available. It might have been deleted in an HMR update.
```

**Causes:**
- Import de packages sans `optimizePackageImports`
- Conflits entre webpack et Turbopack
- Imports dynamiques mal configurés
- Packages externes non déclarés dans `serverExternalPackages`

**Solutions:**
1. Ajouter le package à `optimizePackageImports`
2. Utiliser imports directs plutôt que dynamiques pour les icons
3. Vérifier que `serverExternalPackages` inclut tous les packages serveur

### 2. **Lucide React Specific Issues**

**❌ Éviter:**
```typescript
// Imports dynamiques pour tous les icons
const Icon = dynamic(() => import('lucide-react').then(mod => mod[iconName]))
```

**✅ Préférer:**
```typescript
// Imports directs et statiques
import { Upload, File, Image, Check, X } from 'lucide-react'
```

**Configuration requise:**
```typescript
experimental: {
  optimizePackageImports: ['lucide-react'],
}
```

### 3. **CSS Module Issues**

**Solution:**
```typescript
experimental: {
  optimizeCss: true,  // Active l'optimisation CSS pour Turbopack
}
```

## 🔧 Debugging HMR Issues

### 1. **Activer le tracing**

```bash
NEXT_TURBOPACK_TRACING=1 npm run dev
```

Génère des traces de performance dans `.next/trace`

### 2. **Vérifier la compilation**

```bash
# Voir les fichiers compilés
ls -la .next/cache/webpack/

# Nettoyer le cache si problèmes
npm run dev:clean
```

### 3. **Fallback sans Turbopack**

```bash
npm run dev:no-turbo
```

Si l'erreur disparaît, c'est un problème Turbopack spécifique.

## 📦 Packages Nécessitant Attention

### Packages à optimiser obligatoirement:
- `lucide-react` - Icons avec nombreux modules
- `@radix-ui/*` - Composants UI modulaires
- `date-fns` - Utilitaires date
- `lodash` - Utilitaires (si utilisé)

### Packages externes serveur:
```typescript
serverExternalPackages: [
  '@supabase/supabase-js',
  'pg',
  'mysql2',
  'sqlite3',
]
```

## 🎯 Performance Best Practices

### 1. **Lazy Loading Approprié**

```typescript
// ✅ Bon: Lazy load de composants lourds
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

// ❌ Éviter: Lazy load de petits composants ou icons
const SmallIcon = dynamic(() => import('lucide-react').then(m => m.Check))
```

### 2. **Tree Shaking Optimization**

```typescript
// ✅ Import sélectif
import { format, parseISO } from 'date-fns'

// ❌ Import global
import * as dateFns from 'date-fns'
```

## 🔄 Migration depuis Webpack

### Checklist:

- [ ] Remplacer `webpack` config par `turbopack` config
- [ ] Vérifier compatibilité des loaders webpack utilisés
- [ ] Ajouter packages à `optimizePackageImports`
- [ ] Tester en dev (`--turbo`)
- [ ] Tester le build (`next build --turbo`)
- [ ] Monitorer les performances
- [ ] Vérifier les erreurs HMR en console

### Loaders Webpack Supportés:

Turbopack supporte un sous-ensemble de loaders webpack:
- `@svgr/webpack`
- `babel-loader` (limité)
- `sass-loader`
- `postcss-loader`

## 📊 Monitoring

### Métriques à surveiller:

1. **Cold Start Time** - Temps de démarrage du serveur
2. **Fast Refresh Speed** - Vitesse HMR
3. **Initial Route Compile** - Compilation première route
4. **Memory Usage** - Utilisation mémoire

### Commandes utiles:

```bash
# Analyse bundle
npm run build:analyze

# Performance audit
npm run perf:audit

# Type checking séparé (plus rapide)
tsc --noEmit --watch
```

## 🐛 Issues Connues

### Next.js 15.5.4 + Turbopack:

1. **Module instantiation errors** avec Clerk, Sentry, PostHog
   - Workaround: Vérifier `optimizePackageImports`

2. **CSS ordering differences** vs webpack
   - Solution: Utiliser `optimizeCss: true`

3. **Source maps incomplets** en dev
   - Limitation connue, améliorations en cours

## 📚 Ressources

- [Next.js Turbopack Docs](https://nextjs.org/docs/app/api-reference/turbopack)
- [Turbopack Stable Announcement](https://nextjs.org/blog/turbopack-for-development-stable)
- [Next.js 15.5 Release](https://nextjs.org/blog/next-15-5)
- [GitHub Issues](https://github.com/vercel/next.js/issues?q=turbopack+hmr)

## 🎓 Résumé Rapide

**Pour éviter les erreurs HMR:**

1. ✅ Ajouter `lucide-react` à `optimizePackageImports`
2. ✅ Utiliser imports directs, éviter dynamic imports pour icons
3. ✅ Configurer `resolveExtensions` dans turbopack
4. ✅ Maintenir lucide-react à jour (>= 0.544.0)
5. ✅ Nettoyer cache régulièrement (`npm run dev:clean`)
6. ✅ Utiliser `optimizeCss` et `optimizeServerReact`
7. ✅ Déclarer packages serveur dans `serverExternalPackages`

**En cas de problème:**
1. Hard refresh (Ctrl+Shift+R)
2. Nettoyer cache (`.next` et `node_modules/.cache`)
3. Redémarrer serveur dev
4. Si persistant, utiliser fallback sans Turbopack

---

**Dernière mise à jour:** 2025-09-29
**Version Next.js:** 15.5.4
**Version lucide-react:** 0.544.0