# Guide de Déploiement - ACGE App

## 🚀 Déploiement sur Railway (Recommandé)

### Étape 1 : Préparation du code
```bash
# Exécuter le script de déploiement
npm run deploy:prod
```

### Étape 2 : Configuration Railway
1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Cliquer sur "New Project" → "Deploy from GitHub repo"
4. Sélectionner votre repository `ACGE-app`

### Étape 3 : Ajouter PostgreSQL
1. Dans votre projet Railway, cliquer sur "+ New"
2. Sélectionner "Database" → "PostgreSQL"
3. Railway va automatiquement configurer `DATABASE_URL`

### Étape 4 : Variables d'environnement
Dans l'onglet "Variables" de votre service, ajouter :
```bash
NEXTAUTH_SECRET=flJt0xsoOZ6QrLHlED23kNPDCaOWtzOLeTmM9dnNEts=
NODE_ENV=production
```

### Étape 5 : Configuration des URLs
Après le premier déploiement, mettre à jour :
```bash
NEXTAUTH_URL=https://votre-app.railway.app
NEXT_PUBLIC_API_URL=https://votre-app.railway.app
```

---

## 🔄 Alternative : Render.com

### Configuration Render
1. Aller sur [render.com](https://render.com)
2. "New" → "Web Service"
3. Connecter GitHub et sélectionner votre repo

### Paramètres Build & Deploy
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18

### Base de données
1. Créer une "PostgreSQL" database sur Render
2. Copier l'URL de connexion dans `DATABASE_URL`

---

## ⚡ Alternative : Fly.io

### Installation Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Ou télécharger depuis https://fly.io/docs/getting-started/installing-flyctl/
```

### Déploiement
```bash
# Se connecter
fly auth login

# Initialiser l'app
fly launch

# Ajouter PostgreSQL
fly postgres create

# Déployer
fly deploy
```

---

## 🔧 Scripts Utiles

### Migration de données
```bash
# Nettoyer les données de test
npm run clean:fake

# Tester les APIs
npm run test:api

# Migration avec versioning
npm run migrate:versioning
```

### Base de données en production
```bash
# Appliquer les migrations
npm run db:deploy

# Générer le client Prisma
npm run db:generate
```

---

## 📋 Checklist de Déploiement

- [ ] Code pushé sur GitHub
- [ ] Service créé sur la plateforme choisie
- [ ] Base de données PostgreSQL configurée
- [ ] Variables d'environnement définies
- [ ] Premier déploiement réussi
- [ ] URLs mises à jour dans les variables
- [ ] Migrations de base de données appliquées
- [ ] Test de connexion utilisateur
- [ ] Upload de fichiers fonctionnel

---

## 🆘 Dépannage

### Erreur de base de données
- Vérifier que `DATABASE_URL` est bien configurée
- S'assurer que les migrations sont appliquées : `npm run db:deploy`

### Erreur NextAuth
- Vérifier `NEXTAUTH_SECRET` et `NEXTAUTH_URL`
- S'assurer que l'URL correspond au domaine de déploiement

### Erreur de build
- Vérifier que toutes les dépendances sont dans `package.json`
- Tester le build localement : `npm run build`

### Upload de fichiers
- Vérifier que le dossier `uploads/` est bien géré
- Considérer l'utilisation d'un service cloud (AWS S3, Cloudinary) pour les fichiers

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs de déploiement
2. Tester localement avec `npm run build && npm start`
3. Vérifier que toutes les variables d'environnement sont configurées
