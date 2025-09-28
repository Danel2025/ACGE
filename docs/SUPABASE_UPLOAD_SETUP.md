# Configuration Supabase pour l'Upload de Fichiers

## 🚨 Erreur Actuelle
L'erreur `Aucun fichier n'a pu être uploadé - Vérifiez que Supabase Storage est configuré correctement` indique un problème de configuration des variables d'environnement Supabase.

## 🔧 Solution Rapide

### 1. Vérifier les Variables d'Environnement

Assurez-vous que ces variables sont définies dans votre fichier `.env.local` :

```env
# Variables Supabase (OBLIGATOIRES)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# JWT Secret
NEXTAUTH_SECRET=your-secret-key
```

### 2. Obtenir les Clés Supabase

1. **Connectez-vous à [supabase.com](https://supabase.com)**
2. **Sélectionnez votre projet**
3. **Allez dans Settings > API**
4. **Copiez :**
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **CRITIQUE**

### 3. Créer le Bucket de Stockage

Si le bucket `documents` n'existe pas, l'API le créera automatiquement. Sinon, créez-le manuellement :

1. **Allez dans Storage dans votre dashboard Supabase**
2. **Créez un nouveau bucket nommé `documents`**
3. **Configurez-le comme public**
4. **Définissez une limite de taille (50MB recommandé)**

### 4. Redémarrer le Serveur

Après avoir modifié les variables d'environnement :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

## 🔍 Diagnostic Automatique

Utilisez le composant de diagnostic intégré :

1. **Ouvrez l'interface de test d'upload**
2. **Cliquez sur "Diagnostic Stockage"**
3. **Suivez les recommandations affichées**

## 🛠️ Vérification Manuelle

### Test API Direct

```bash
curl -X GET http://localhost:3000/api/check-storage
```

### Logs à Vérifier

Dans la console, vous devriez voir :
```
🔍 Configuration Supabase:
NEXT_PUBLIC_SUPABASE_URL: true
NEXT_PUBLIC_SUPABASE_ANON_KEY: true
SUPABASE_SERVICE_ROLE_KEY: true  ← DOIT être true
```

## 📋 Checklist de Dépannage

- [ ] Variables d'environnement définies dans `.env.local`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` présente et correcte
- [ ] Serveur redémarré après modification
- [ ] Bucket `documents` existe dans Supabase
- [ ] Bucket configuré comme public
- [ ] Pas d'erreurs dans les logs de démarrage

## 🔧 Commandes Utiles

```bash
# Vérifier les variables d'environnement
echo $SUPABASE_SERVICE_ROLE_KEY

# Test de l'API
curl http://localhost:3000/api/check-storage

# Redémarrer en mode debug
DEBUG=* npm run dev
```

## 📞 Support

Si le problème persiste :

1. **Vérifiez les logs détaillés dans la console**
2. **Utilisez le diagnostic intégré**
3. **Vérifiez que votre projet Supabase est actif**
4. **Confirmez que les RLS policies permettent l'upload**

---

**Note :** La variable `SUPABASE_SERVICE_ROLE_KEY` est critique car elle permet les opérations d'écriture côté serveur. Sans elle, aucun upload n'est possible.
