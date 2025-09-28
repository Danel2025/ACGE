# 🔍 Guide de Débogage - Prévisualisation de Documents

## Problème : "Impossible de charger l'image"

### 🎯 **Causes Possibles**

1. **Configuration Supabase manquante**
   - Variable d'environnement `NEXT_PUBLIC_SUPABASE_URL` non définie
   - Bucket 'documents' non créé dans Supabase Storage

2. **Fichier inexistant dans Supabase Storage**
   - Le fichier n'a pas été uploadé correctement
   - Le chemin du fichier est incorrect

3. **Permissions Supabase Storage**
   - Le bucket n'est pas public
   - Les politiques RLS bloquent l'accès

### 🔧 **Étapes de Débogage**

#### 1. Vérifier la Console du Navigateur
Ouvrez les outils de développement (F12) et regardez la console. Vous devriez voir :
```
URL de prévisualisation générée: https://votre-projet.supabase.co/storage/v1/object/public/documents/chemin/vers/fichier.jpg
Chemin du fichier original: /chemin/vers/fichier.jpg
Chemin nettoyé: chemin/vers/fichier.jpg
Base URL Supabase: https://votre-projet.supabase.co
```

#### 2. Vérifier la Configuration Supabase
Dans votre fichier `.env.local`, assurez-vous d'avoir :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

#### 3. Vérifier le Bucket Supabase Storage
1. Allez dans votre dashboard Supabase
2. Naviguez vers Storage
3. Vérifiez que le bucket 'documents' existe
4. Vérifiez que le fichier est présent dans le bucket
5. Vérifiez que le bucket est public

#### 4. Tester l'URL Manuellement
Copiez l'URL générée depuis la console et testez-la directement dans votre navigateur.

### 🛠️ **Solutions**

#### Solution 1 : Créer le Bucket 'documents'
```sql
-- Dans l'éditeur SQL de Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true);
```

#### Solution 2 : Configurer les Politiques RLS
```sql
-- Politique pour permettre la lecture publique
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

#### Solution 3 : Vérifier le Chemin du Fichier
Assurez-vous que le champ `file_path` dans votre table de documents contient le bon chemin relatif (sans slash initial).

### 🎨 **Fonctionnalités de Débogage Ajoutées**

Le composant `DocumentPreviewModal` inclut maintenant :

- ✅ **Logs détaillés** dans la console
- ✅ **Affichage de l'URL générée** en cas d'erreur
- ✅ **Bouton "Réessayer"** pour recharger l'URL
- ✅ **Messages d'erreur informatifs**
- ✅ **Bouton "Ouvrir dans un nouvel onglet"** pour tester l'URL

### 📝 **Exemple de Structure de Données Correcte**

```typescript
const document: DocumentItem = {
  id: '1',
  title: 'Mon Document',
  fileName: 'document.pdf',
  fileType: 'application/pdf',
  fileSize: 1024000,
  filePath: 'uploads/document.pdf', // ✅ Chemin relatif sans slash initial
  createdAt: new Date().toISOString(),
  author: {
    id: '1',
    name: 'Utilisateur',
    email: 'user@example.com'
  }
}
```

### 🚀 **Test Rapide**

1. Ouvrez la console du navigateur
2. Cliquez sur un bouton de prévisualisation
3. Vérifiez les logs dans la console
4. Testez l'URL générée dans un nouvel onglet
5. Si l'URL fonctionne, le problème vient du composant
6. Si l'URL ne fonctionne pas, le problème vient de Supabase Storage

---

**Note :** Ce guide vous aidera à identifier et résoudre rapidement les problèmes de prévisualisation de documents.
