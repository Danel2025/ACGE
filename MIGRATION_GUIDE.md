# 🚀 Guide de Migration Complet - ACGE

## Vue d'ensemble
Ce guide vous accompagne dans la migration complète du projet ACGE vers le nouveau compte `danelnexon01@icloud.com` pour Git et Vercel.

## 📋 Prérequis
- ✅ Accès au compte GitHub `danelnexon01@icloud.com`
- ✅ Accès au compte Vercel `danelnexon01@icloud.com`
- ✅ Projet ACGE actuel fonctionnel
- ✅ Sauvegarde des données importantes

## 🎯 Objectifs de la Migration
1. **Migrer le code** vers le nouveau dépôt GitHub
2. **Configurer Vercel** avec le nouveau compte
3. **Maintenir la fonctionnalité** complète
4. **Optimiser les performances** pendant la migration
5. **Assurer la sécurité** des données

## 📊 État Actuel du Projet

### Configuration Git
- **Repository actuel:** `https://github.com/Velaskez/ACGE.git`
- **Branche principale:** `master`
- **Branches disponibles:** 8 branches de fonctionnalités
- **État:** 17 fichiers modifiés (standardisation des loaders)

### Configuration Vercel
- **Domaine:** `acge-gabon.com`
- **Région:** `fra1` (France)
- **Framework:** Next.js 15.5.2
- **Variables d'environnement:** Configurées

### Base de Données
- **Supabase:** `wodyrsasfqfoqdydrfew.supabase.co`
- **Migrations:** 44 migrations disponibles
- **Sécurité:** RLS activé, politiques de sécurité

## 🛠️ Scripts de Migration Créés

### 1. Script Principal de Migration
```bash
node scripts/migration/migrate-to-new-account.js
```
**Fonctionnalités:**
- Sauvegarde complète du projet
- Commit des changements actuels
- Configuration Git pour le nouveau compte
- Génération des instructions détaillées

### 2. Script de Configuration Git
```bash
bash scripts/migration/setup-new-repository.sh
```
**Fonctionnalités:**
- Configuration des remotes Git
- Poussée du code vers le nouveau dépôt
- Migration de toutes les branches

### 3. Script d'Optimisation
```bash
node scripts/migration/optimize-before-migration.js
```
**Fonctionnalités:**
- Optimisation des fichiers de configuration
- Tests de build et linting
- Nettoyage du projet
- Génération de rapports

### 4. Script de Validation
```bash
node scripts/migration/validate-migration.js
```
**Fonctionnalités:**
- Vérification post-migration
- Tests de fonctionnalité
- Validation de la configuration

## 📝 Étapes de Migration

### Phase 1: Préparation (5 minutes)

1. **Exécuter l'optimisation**
   ```bash
   node scripts/migration/optimize-before-migration.js
   ```

2. **Vérifier l'état du projet**
   ```bash
   git status
   npm run build
   ```

3. **Créer la sauvegarde**
   ```bash
   node scripts/migration/migrate-to-new-account.js
   ```

### Phase 2: Migration Git (10 minutes)

1. **Créer le nouveau dépôt GitHub**
   - Se connecter à GitHub avec `danelnexon01@icloud.com`
   - Créer un nouveau dépôt nommé `ACGE`
   - Ne pas initialiser avec README, .gitignore ou licence

2. **Exécuter le script de migration Git**
   ```bash
   bash scripts/migration/setup-new-repository.sh
   ```

3. **Vérifier la migration**
   ```bash
   git remote -v
   git status
   ```

### Phase 3: Configuration Vercel (15 minutes)

1. **Se connecter à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Se connecter avec `danelnexon01@icloud.com`

2. **Importer le projet**
   - Cliquer sur "New Project"
   - Sélectionner le dépôt `danelnexon01/ACGE`
   - Configurer selon le guide Vercel

3. **Configurer les variables d'environnement**
   - Utiliser les variables fournies dans le script
   - Vérifier toutes les configurations

### Phase 4: Tests et Validation (10 minutes)

1. **Exécuter les tests de validation**
   ```bash
   node scripts/migration/validate-migration.js
   ```

2. **Tests manuels**
   - Tester l'authentification
   - Vérifier l'upload de fichiers
   - Tester toutes les fonctionnalités principales

3. **Tests de performance**
   - Vérifier les temps de chargement
   - Tester sur différents navigateurs

## 🔧 Configuration Détaillée

### Variables d'Environnement Vercel

#### Base de Données
```env
DATABASE_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
```

#### Authentification
```env
NEXTAUTH_URL=https://acge-gabon.com
NEXTAUTH_SECRET=votre_secret_production_securise_changez_ceci
```

#### Variables Publiques
```env
NEXT_PUBLIC_API_URL=https://acge-gabon.com
NEXT_PUBLIC_SUPABASE_URL=https://wodyrsasfqfoqdydrfew.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjIzNzYsImV4cCI6MjA3MDU5ODM3Nn0.RhB2OMRdddHXWt1lB6NfHxMl1In_U9CPK_hBOU1UlN4
```

#### Service
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyMjM3NiwiZXhwIjoyMDcwNTk4Mzc2fQ.gZZ3WTWHNLaYBztUXwx4d8uW56CGHlqznOuNvopkka0
```

### Configuration Vercel Avancée

#### Build Settings
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Framework:** Next.js

#### Functions
- **Timeout:** 30 secondes
- **Mémoire:** 1024 MB
- **Région:** `fra1`

#### Domaine
- **Domaine principal:** `acge-gabon.com`
- **SSL:** Automatique
- **DNS:** Géré par Vercel

## 🧪 Tests de Validation

### Tests Automatiques
```bash
# Test de build
npm run build

# Test de linting
npm run lint

# Test de validation
node scripts/migration/validate-migration.js
```

### Tests Manuels

#### Fonctionnalités Principales
- [ ] Page d'accueil se charge
- [ ] Authentification utilisateur
- [ ] Upload de fichiers
- [ ] Gestion des dossiers
- [ ] Notifications
- [ ] Dashboard par rôle

#### Performance
- [ ] Temps de chargement < 3 secondes
- [ ] Images optimisées
- [ ] CSS/JS minifiés
- [ ] Cache fonctionnel

#### Sécurité
- [ ] HTTPS activé
- [ ] Headers de sécurité
- [ ] Variables d'environnement sécurisées
- [ ] RLS Supabase fonctionnel

## 🔄 Rollback

En cas de problème, vous pouvez revenir à l'ancien setup :

### Rollback Git
```bash
git remote remove origin
git remote add origin https://github.com/Velaskez/ACGE.git
git push -u origin master
```

### Rollback Vercel
1. Revenir à l'ancien compte Vercel
2. Reconfigurer avec l'ancien dépôt
3. Restaurer les variables d'environnement

## 📁 Fichiers de Sauvegarde

Tous les fichiers importants sont sauvegardés dans `migration-backup/` :
- Configuration Git
- Variables d'environnement
- Instructions détaillées
- Rapports d'optimisation
- Scripts de validation

## 🆘 Dépannage

### Problèmes Courants

#### Build Failed
```bash
# Vérifier les logs
vercel logs [deployment-url]

# Tester localement
npm run build
```

#### Variables d'Environnement
```bash
# Vérifier les variables
vercel env ls

# Ajouter une variable
vercel env add VARIABLE_NAME
```

#### Problèmes de Base de Données
- Vérifier les URLs de connexion
- Tester la connectivité Supabase
- Vérifier les permissions RLS

### Support
- **Documentation Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Support Supabase:** [supabase.com/support](https://supabase.com/support)
- **Email de support:** danelnexon01@icloud.com

## ✅ Checklist de Migration

### Préparation
- [ ] Sauvegarde créée
- [ ] Projet optimisé
- [ ] Tests locaux passés

### Migration Git
- [ ] Nouveau dépôt GitHub créé
- [ ] Code poussé vers le nouveau dépôt
- [ ] Toutes les branches migrées
- [ ] Configuration Git mise à jour

### Migration Vercel
- [ ] Compte Vercel configuré
- [ ] Projet importé
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi

### Validation
- [ ] Tests automatiques passés
- [ ] Tests manuels passés
- [ ] Performance validée
- [ ] Sécurité vérifiée

### Finalisation
- [ ] Domaine configuré
- [ ] SSL activé
- [ ] Monitoring configuré
- [ ] Documentation mise à jour

## 🎉 Félicitations !

Une fois toutes les étapes terminées, votre projet ACGE sera complètement migré vers le nouveau compte avec :
- ✅ Code optimisé et standardisé
- ✅ Configuration sécurisée
- ✅ Performance améliorée
- ✅ Monitoring activé
- ✅ Documentation complète

## 📞 Support

Pour toute question ou problème pendant la migration :
- **Email:** danelnexon01@icloud.com
- **Documentation:** Consultez les fichiers dans `migration-backup/`
- **Scripts:** Utilisez les scripts fournis pour automatiser les tâches

---

**Bonne migration ! 🚀**
