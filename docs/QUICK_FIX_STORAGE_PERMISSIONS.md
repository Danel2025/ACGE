# 🚀 Résolution Rapide - Problème de Chargement d'Images

## ❌ **Problème Identifié**
L'erreur "Impossible de charger l'image" est causée par des **permissions insuffisantes** sur le bucket Supabase Storage.

## ⚡ **Solution Rapide (5 minutes)**

### 1. **Vérifier le Bucket dans Supabase Dashboard**
1. Allez sur [supabase.com](https://supabase.com) → Votre projet
2. Cliquez sur **Storage** dans le menu de gauche
3. Vérifiez que le bucket **"documents"** existe
4. Si il n'existe pas, créez-le :
   - Cliquez sur **"New bucket"**
   - Nom : `documents`
   - Cochez **"Public bucket"** ✅

### 2. **Créer la Politique RLS (Row Level Security)**
1. Dans Supabase Dashboard, allez dans **SQL Editor**
2. Exécutez cette requête :

```sql
-- Créer une politique pour permettre l'accès public au bucket documents
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

### 3. **Vérifier les Permissions du Bucket**
1. Dans **Storage** → **Policies**
2. Vérifiez qu'il y a une politique **"Public Access"** pour le bucket `documents`
3. Si elle n'existe pas, créez-la via l'interface ou le SQL ci-dessus

### 4. **Tester la Solution**
1. Rechargez votre application
2. Essayez d'ouvrir la prévisualisation d'une image
3. L'image devrait maintenant se charger correctement

## 🔧 **Script de Diagnostic Automatique**

J'ai créé un script pour diagnostiquer automatiquement le problème :

```bash
# Installer les dépendances si nécessaire
npm install @supabase/supabase-js dotenv

# Exécuter le script de diagnostic
node scripts/fix-supabase-storage-permissions.js
```

Ce script va :
- ✅ Vérifier l'existence du bucket "documents"
- ✅ Tester l'accès aux fichiers
- ✅ Vérifier les permissions
- ✅ Donner des recommandations spécifiques

## 🎯 **Vérification Finale**

Après avoir appliqué la solution, vous devriez voir dans la console du navigateur :
```
✅ Fichier vérifié avec succès: 200
✅ Image chargée avec succès: https://votre-projet.supabase.co/storage/v1/object/public/documents/fichier.jpg
```

## 🚨 **Si le Problème Persiste**

1. **Vérifiez l'URL générée** dans la console
2. **Testez l'URL directement** dans un nouvel onglet
3. **Vérifiez les logs Supabase** dans le dashboard
4. **Contactez le support** avec les détails de l'erreur

---

**Temps estimé :** 5 minutes  
**Difficulté :** Facile  
**Impact :** Résout complètement le problème de chargement d'images
