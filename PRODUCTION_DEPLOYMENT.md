# 🚀 Guide de Déploiement Production - Système de Notifications

## ✅ Configuration Vercel

### Variables d'environnement requises :

```bash
# Base de données
DATABASE_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:5432/postgres

# NextAuth
NEXTAUTH_URL=https://acge-gabon.com
NEXTAUTH_SECRET=votre_secret_production_securise_changez_ceci

# API
NEXT_PUBLIC_API_URL=https://acge-gabon.com

# Supabase (OBLIGATOIRE pour les notifications)
NEXT_PUBLIC_SUPABASE_URL=https://wodyrsasfqfoqdydrfew.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔧 Configuration Supabase

### 1. Créer le projet Supabase
- Aller sur [supabase.com](https://supabase.com)
- Créer un nouveau projet
- Récupérer l'URL et les clés

### 2. Configurer la base de données
```sql
-- Exécuter les migrations dans l'ordre :
-- 1. supabase/migrations/20250110000001_create_notifications_table.sql
-- 2. supabase/migrations/20250115000001_fix_notifications_rls.sql
```

### 3. Configurer les politiques RLS
```sql
-- Les politiques sont déjà définies dans les migrations
-- Vérifier qu'elles sont actives dans Supabase Dashboard > Authentication > Policies
```

## 🚀 Déploiement

### 1. Vercel Dashboard
1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet ACGE
3. Aller dans Settings > Environment Variables
4. Ajouter toutes les variables d'environnement ci-dessus

### 2. Redéployer
```bash
# Option 1: Via Vercel CLI
vercel --prod

# Option 2: Via Git (push sur main)
git push origin main
```

## 🧪 Tests de Production

### 1. Test de l'API
```bash
curl -X GET "https://acge-gabon.com/api/notifications-test"
```

### 2. Test d'authentification
1. Se connecter sur https://acge-gabon.com
2. Vérifier que l'icône de notifications apparaît
3. Cliquer sur l'icône pour ouvrir le dropdown

### 3. Test de création de notifications
```bash
# Via l'interface admin (si disponible)
# Ou via l'API directement
```

## 🔍 Monitoring

### 1. Logs Vercel
- Aller dans Vercel Dashboard > Functions
- Vérifier les logs des fonctions API

### 2. Logs Supabase
- Aller dans Supabase Dashboard > Logs
- Vérifier les requêtes vers la table notifications

### 3. Métriques
- Vérifier les performances dans Vercel Analytics
- Surveiller les erreurs 500/503

## ⚠️ Points d'attention

### 1. Sécurité
- [ ] Changer `NEXTAUTH_SECRET` en production
- [ ] Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est bien sécurisé
- [ ] Tester les politiques RLS

### 2. Performance
- [ ] Vérifier les timeouts (30s max configuré)
- [ ] Surveiller la latence des requêtes Supabase
- [ ] Optimiser les requêtes si nécessaire

### 3. Fiabilité
- [ ] Tester le mode dégradé (sans Supabase)
- [ ] Vérifier la gestion d'erreurs
- [ ] Tester la récupération après panne

## 🐛 Dépannage

### Erreur 503 "Service temporairement indisponible"
- Vérifier que les variables Supabase sont correctes
- Vérifier la connectivité à Supabase
- Vérifier les politiques RLS

### Erreur 401 "Non autorisé"
- Vérifier que l'utilisateur est connecté
- Vérifier la validité du token JWT
- Vérifier la configuration NextAuth

### Notifications ne s'affichent pas
- Vérifier les logs du navigateur (F12)
- Vérifier les logs Vercel
- Vérifier la configuration Supabase

## 📞 Support

En cas de problème :
1. Vérifier les logs Vercel
2. Vérifier les logs Supabase
3. Tester en local avec les mêmes variables
4. Contacter l'équipe de développement
