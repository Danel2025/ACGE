# Configuration Turbopack pour le Développement

## 🚀 Scripts Disponibles

### Script de base avec Turbopack
```bash
npm run dev
```
- Utilise Turbopack par défaut
- Port: 3000
- Optimisations de base activées

### Script avec options expérimentales
```bash
npm run dev:turbo
```
- Turbopack avec options expérimentales
- Performances maximales
- Port: 3000

### Script rapide sur port alternatif
```bash
npm run dev:fast
```
- Turbopack expérimental
- Port: 3001 (évite les conflits)
- Idéal pour tests parallèles

### Script optimisé personnalisé
```bash
npm run dev:optimized
```
- Script TypeScript personnalisé
- Vérification automatique des variables d'environnement
- Gestion d'erreurs avancée

## ⚡ Avantages de Turbopack

### Performance
- **Démarrage 10x plus rapide** que Webpack
- **Hot Reload instantané** pour les modifications
- **Compilation incrémentale** optimisée

### Optimisations Actives
- Cache intelligent des modules
- Compilation parallèle
- Optimisation des imports

## 🔧 Configuration

### Fichier `next.config.ts`
```typescript
experimental: {
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}
```

### Fichier `turbo.json`
- Configuration du pipeline de build
- Cache optimisé
- Dépendances globales

## 🛠️ Variables d'Environnement

### Variables Turbopack
```bash
TURBO_FORCE=true
NEXT_TURBO=1
```

### Variables de Développement
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

## 📊 Monitoring

### Métriques de Performance
- Temps de démarrage initial
- Temps de recompilation
- Utilisation mémoire

### Logs Turbopack
```bash
# Activer les logs détaillés
DEBUG=turbo:* npm run dev
```

## 🔍 Dépannage

### Problèmes Courants

1. **Cache corrompu**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Modules non trouvés**
   ```bash
   npm install
   npm run dev
   ```

3. **Port déjà utilisé**
   ```bash
   npm run dev:fast  # Utilise le port 3001
   ```

### Optimisations Supplémentaires

1. **Exclure les fichiers inutiles**
   ```typescript
   // next.config.ts
   experimental: {
     turbo: {
       resolveAlias: {
         // Exclusions personnalisées
       }
     }
   }
   ```

2. **Optimiser les imports**
   ```typescript
   // Utiliser des imports spécifiques
   import { Button } from '@/components/ui/button'
   // Au lieu de
   import { Button } from '@/components/ui'
   ```

## 🎯 Bonnes Pratiques

1. **Utiliser des imports spécifiques**
2. **Éviter les imports globaux**
3. **Optimiser les images et assets**
4. **Utiliser le cache Turbopack**
5. **Monitorer les performances**

## 📈 Comparaison des Performances

| Métrique | Webpack | Turbopack | Amélioration |
|----------|---------|-----------|--------------|
| Démarrage initial | 15s | 1.5s | 10x |
| Hot reload | 2s | 0.2s | 10x |
| Rebuild complet | 30s | 3s | 10x |
