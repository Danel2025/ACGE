# 🔍 Diagnostic Avancé - Erreur 403 Supabase Storage

## ✅ **Politique RLS Vérifiée**
La politique "Public Access" existe déjà, donc le problème vient d'ailleurs.

## 🎯 **Étapes de Diagnostic**

### 1. **Vérifier le Statut Public du Bucket**
Dans Supabase Dashboard :
1. Allez dans **Storage** → **Buckets**
2. Cliquez sur le bucket **"documents"**
3. Vérifiez que **"Public bucket"** est coché ✅
4. Si ce n'est pas le cas, cochez la case et sauvegardez

### 2. **Exécuter le Script de Diagnostic**
```bash
# Installer les dépendances si nécessaire
npm install @supabase/supabase-js dotenv

# Exécuter le diagnostic complet
node scripts/test-storage-access.js

# Ou tester un fichier spécifique
node scripts/test-storage-access.js "1758189328570-ygnx6f-Gh_gnonga_village_2.jpg"
```

### 3. **Vérifier les Logs de la Console**
Ouvrez la console du navigateur (F12) et regardez les logs :
```
URL de prévisualisation générée: https://wodyrsasfqfoqdydrfew.supabase.co/storage/v1/object/public/documents/1758189328570-ygnx6f-Gh_gnonga_village_2.jpg
Réponse HEAD: 403 Forbidden
Headers de réponse: {...}
```

### 4. **Tester l'URL Directement**
Copiez l'URL générée et testez-la dans un nouvel onglet :
```
https://wodyrsasfqfoqdydrfew.supabase.co/storage/v1/object/public/documents/1758189328570-ygnx6f-Gh_gnonga_village_2.jpg
```

## 🚨 **Causes Possibles**

### **Cause 1 : Bucket Non Public**
- Le bucket existe mais n'est pas marqué comme public
- **Solution :** Cocher "Public bucket" dans Supabase Dashboard

### **Cause 2 : Politique RLS Incorrecte**
- La politique existe mais n'est pas active ou mal configurée
- **Solution :** Vérifier dans Storage → Policies

### **Cause 3 : Fichier Uploadé avec Mauvaises Permissions**
- Le fichier a été uploadé avec des permissions restrictives
- **Solution :** Re-uploader le fichier ou modifier les permissions

### **Cause 4 : Configuration CORS**
- Problème de configuration CORS
- **Solution :** Vérifier la configuration CORS dans Supabase

## 🛠️ **Solutions par Ordre de Priorité**

### **Solution 1 : Vérifier le Bucket Public (2 min)**
1. Supabase Dashboard → Storage → Buckets
2. Cliquer sur "documents"
3. Vérifier que "Public bucket" est coché
4. Sauvegarder si nécessaire

### **Solution 2 : Vérifier les Politiques RLS (3 min)**
1. Supabase Dashboard → Storage → Policies
2. Vérifier qu'il y a une politique "Public Access" pour le bucket "documents"
3. Vérifier qu'elle est active (pas désactivée)

### **Solution 3 : Re-uploader le Fichier (5 min)**
1. Télécharger le fichier depuis Supabase Storage
2. Le supprimer du bucket
3. Le re-uploader avec les bonnes permissions

### **Solution 4 : Créer une Nouvelle Politique (5 min)**
```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Créer une nouvelle politique plus permissive
CREATE POLICY "Public Access Documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

-- Vérifier que la politique est active
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access Documents';
```

## 🎯 **Test de Validation**

Après avoir appliqué une solution, testez :

1. **Console du navigateur** : Plus d'erreur 403
2. **URL directe** : L'image se charge dans un nouvel onglet
3. **Composant** : L'image s'affiche dans la prévisualisation

## 📞 **Si Rien Ne Fonctionne**

1. **Exécutez le script de diagnostic** et partagez les résultats
2. **Vérifiez les logs Supabase** dans le dashboard
3. **Testez avec un nouveau fichier** uploadé
4. **Contactez le support** avec les détails de l'erreur

---

**Le problème est probablement que le bucket n'est pas marqué comme public, même si la politique RLS existe !** 🎯
