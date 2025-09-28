# Correction des Erreurs RLS (Row Level Security)

## 🚨 Problème Identifié

Supabase a détecté des erreurs de sécurité critiques :
- **2 erreurs** : Politiques RLS créées mais RLS non activé sur les tables
- **5 avertissements** : Autres problèmes de sécurité

## 📋 Tables Concernées

1. **Table `public.folders`**
   - Politiques existantes : "Service role bypass RLS", "Users can delete own folders", "Users can insert folders", "Users can update own folders", "Users can view all folders"
   - **Problème** : RLS non activé sur la table

2. **Table `public.users`**
   - Politiques existantes : "Admins can delete users", "Admins can insert users", "Admins can update users", "Service role bypass RLS", "Users can view all users"
   - **Problème** : RLS non activé sur la table

## 🔧 Solution

### Étape 1 : Activer RLS sur les tables

Exécuter le script SQL suivant dans l'éditeur SQL de Supabase :

```sql
-- Activer RLS sur la table 'folders'
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table 'users'  
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Étape 2 : Vérifier l'activation

```sql
-- Vérifier que RLS est bien activé
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('folders', 'users')
ORDER BY tablename;
```

## 🎯 Pourquoi C'est Important

### Sécurité
- **RLS désactivé** = Toutes les politiques de sécurité sont ignorées
- **Accès non contrôlé** aux données sensibles
- **Risque de sécurité** critique

### Conformité
- **Politiques créées** mais non appliquées
- **Incohérence** entre la configuration et l'application
- **Audit de sécurité** échoué

## 📊 Impact de la Correction

### Avant (RLS désactivé)
- ❌ Politiques RLS ignorées
- ❌ Accès libre aux données
- ❌ Erreurs de sécurité
- ❌ Non-conformité

### Après (RLS activé)
- ✅ Politiques RLS appliquées
- ✅ Accès contrôlé aux données
- ✅ Sécurité renforcée
- ✅ Conformité assurée

## 🛡️ Politiques RLS Existantes

### Table `folders`
- **Service role bypass RLS** : Le service role peut contourner RLS
- **Users can delete own folders** : Utilisateurs peuvent supprimer leurs dossiers
- **Users can insert folders** : Utilisateurs peuvent créer des dossiers
- **Users can update own folders** : Utilisateurs peuvent modifier leurs dossiers
- **Users can view all folders** : Utilisateurs peuvent voir tous les dossiers

### Table `users`
- **Service role bypass RLS** : Le service role peut contourner RLS
- **Admins can delete users** : Admins peuvent supprimer des utilisateurs
- **Admins can insert users** : Admins peuvent créer des utilisateurs
- **Admins can update users** : Admins peuvent modifier des utilisateurs
- **Users can view all users** : Utilisateurs peuvent voir tous les utilisateurs

## 🚀 Instructions de Déploiement

1. **Ouvrir Supabase Dashboard**
2. **Aller dans SQL Editor**
3. **Exécuter le script de correction**
4. **Vérifier avec le script de vérification**
5. **Re-exécuter le linter de sécurité**

## ✅ Vérification Post-Correction

Après avoir activé RLS, vérifier :
- [ ] Plus d'erreurs RLS dans le Security Advisor
- [ ] Politiques appliquées correctement
- [ ] Accès aux données contrôlé
- [ ] Application fonctionne normalement

## 🔗 Ressources

- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Guide du Linter de Base de Données](https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled)
