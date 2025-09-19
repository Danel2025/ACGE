# Guide de Migration Vercel

## Vue d'ensemble
Ce guide vous accompagne dans la migration de votre projet ACGE vers le nouveau compte Vercel (`danelnexon01@icloud.com`).

## Prérequis
- ✅ Nouveau dépôt GitHub configuré
- ✅ Code poussé vers le nouveau dépôt
- ✅ Accès au compte Vercel `danelnexon01@icloud.com`

## Étapes de Migration

### 1. Connexion au Nouveau Compte Vercel

1. **Se connecter à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Cliquer sur "Sign In"
   - Utiliser le compte `danelnexon01@icloud.com`

2. **Vérifier l'accès**
   - Confirmer que vous êtes connecté avec le bon compte
   - Vérifier dans les paramètres du profil

### 2. Import du Projet

1. **Importer depuis GitHub**
   - Cliquer sur "New Project"
   - Sélectionner "Import Git Repository"
   - Choisir le dépôt `danelnexon01/ACGE`

2. **Configuration du projet**
   - **Project Name:** `acge-gabon`
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (par défaut)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

### 3. Configuration des Variables d'Environnement

#### Variables de Base de Données
```env
DATABASE_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
```

#### Variables d'Authentification
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

#### Variables de Service
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyMjM3NiwiZXhwIjoyMDcwNTk4Mzc2fQ.gZZ3WTWHNLaYBztUXwx4d8uW56CGHlqznOuNvopkka0
```

### 4. Configuration Avancée

#### Régions de Déploiement
- **Région:** `fra1` (France)
- **Raison:** Proximité géographique pour le Gabon

#### Fonctions Serverless
- **Timeout:** 30 secondes maximum
- **Mémoire:** 1024 MB (recommandé)

#### Domaine Personnalisé
- **Domaine principal:** `acge-gabon.com`
- **Configuration DNS:** Automatique via Vercel

### 5. Déploiement

1. **Premier déploiement**
   - Cliquer sur "Deploy"
   - Attendre la fin du build
   - Vérifier les logs de build

2. **Vérification du déploiement**
   - Tester l'URL de déploiement
   - Vérifier toutes les fonctionnalités
   - Tester l'authentification

### 6. Configuration du Domaine

1. **Ajouter le domaine personnalisé**
   - Aller dans "Settings" > "Domains"
   - Ajouter `acge-gabon.com`
   - Configurer les enregistrements DNS

2. **Vérification SSL**
   - Attendre la génération du certificat SSL
   - Vérifier que HTTPS fonctionne

### 7. Tests Post-Migration

#### Tests Fonctionnels
- [ ] Page d'accueil se charge
- [ ] Authentification fonctionne
- [ ] Upload de fichiers fonctionne
- [ ] Base de données accessible
- [ ] Notifications fonctionnent

#### Tests de Performance
- [ ] Temps de chargement < 3 secondes
- [ ] Images optimisées
- [ ] CSS/JS minifiés

#### Tests de Sécurité
- [ ] HTTPS activé
- [ ] Headers de sécurité configurés
- [ ] Variables d'environnement sécurisées

### 8. Monitoring et Maintenance

#### Analytics
- Vercel Analytics activé
- Speed Insights activé
- Monitoring des erreurs

#### Logs
- Accès aux logs de déploiement
- Monitoring des performances
- Alertes configurées

## Dépannage

### Problèmes Courants

#### Build Failed
```bash
# Vérifier les logs de build
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
- Documentation Vercel: [vercel.com/docs](https://vercel.com/docs)
- Support Supabase: [supabase.com/support](https://supabase.com/support)

## Checklist de Migration

- [ ] Nouveau dépôt GitHub créé
- [ ] Code poussé vers le nouveau dépôt
- [ ] Compte Vercel configuré
- [ ] Projet importé dans Vercel
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Domaine personnalisé configuré
- [ ] Tests fonctionnels passés
- [ ] Monitoring activé
- [ ] Documentation mise à jour

## Rollback

En cas de problème, vous pouvez:
1. Revenir à l'ancien dépôt GitHub
2. Reconfigurer Vercel avec l'ancien compte
3. Restaurer depuis la sauvegarde

## Contact

Pour toute question ou problème:
- Email: danelnexon01@icloud.com
- Documentation: Voir les fichiers dans `migration-backup/`
