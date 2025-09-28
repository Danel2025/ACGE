# 🚀 Guide de Configuration - GED Application

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js 18+** : [Télécharger Node.js](https://nodejs.org/)
- **PostgreSQL** : [Télécharger PostgreSQL](https://www.postgresql.org/download/)
- **Git** : [Télécharger Git](https://git-scm.com/)

## ⚙️ Configuration de l'Environnement

### 1. Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/acge_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Environnement
NODE_ENV="development"
```

**⚠️ Important :** Remplacez les valeurs par vos propres configurations :
- `username` : Votre nom d'utilisateur PostgreSQL
- `password` : Votre mot de passe PostgreSQL
- `acge_db` : Nom de votre base de données
- `your-super-secret-key-change-this-in-production` : Une clé secrète aléatoire

### 2. Configuration PostgreSQL

#### Option A : Installation Locale

1. **Installer PostgreSQL** sur votre machine
2. **Créer une base de données** :
   ```sql
   CREATE DATABASE acge_db;
   CREATE USER acge_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE acge_db TO acge_user;
   ```

#### Option B : Base de Données Cloud (Recommandé)

Utilisez un service comme :
- **Supabase** (gratuit) : [supabase.com](https://supabase.com)
- **Neon** (gratuit) : [neon.tech](https://neon.tech)
- **Railway** : [railway.app](https://railway.app)

### 3. Configuration de la Base de Données

Une fois PostgreSQL configuré, exécutez :

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la base de données
npx prisma db push

# (Optionnel) Ouvrir Prisma Studio pour visualiser les données
npx prisma studio
```

## 🚀 Démarrage de l'Application

### 1. Installer les Dépendances

```bash
npm install
```

### 2. Démarrer l'Application

```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:3000**

## 📱 Test de l'Application

### 1. Page d'Accueil
- Accédez à `http://localhost:3000`
- Vous devriez voir la page d'accueil avec la présentation de l'application

### 2. Inscription
- Cliquez sur "Créer un compte" ou allez à `http://localhost:3000/register`
- Créez un compte utilisateur

### 3. Connexion
- Connectez-vous avec vos identifiants à `http://localhost:3000/login`
- Vous serez redirigé vers le dashboard

### 4. Dashboard
- Le dashboard est accessible à `http://localhost:3000/dashboard`
- Il affiche les métriques et l'interface principale

## 🔧 Dépannage

### Erreur de Connexion à la Base de Données

Si vous obtenez une erreur de connexion :

1. **Vérifiez votre DATABASE_URL** dans `.env.local`
2. **Assurez-vous que PostgreSQL est démarré**
3. **Vérifiez les permissions utilisateur**

### Erreur d'Authentification

Si l'authentification ne fonctionne pas :

1. **Vérifiez NEXTAUTH_SECRET** dans `.env.local`
2. **Assurez-vous que NEXTAUTH_URL** correspond à votre URL
3. **Vérifiez que la base de données est accessible**

### Erreurs de Build

Si vous obtenez des erreurs de build :

```bash
# Nettoyer le cache
npm run build -- --no-cache

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

## 📁 Structure des Routes

```
/                    # Page d'accueil
/login              # Page de connexion
/register           # Page d'inscription
/dashboard          # Dashboard principal (protégé)
/documents          # Gestion des documents (protégé)
/folders            # Gestion des dossiers (protégé)
/users              # Gestion des utilisateurs (protégé)
/settings           # Paramètres (protégé)
```

## 🎯 Prochaines Étapes

Une fois l'application configurée et fonctionnelle :

1. **Phase 2** : Implémentation de l'upload de fichiers
2. **Phase 3** : Système de recherche et filtres
3. **Phase 4** : Fonctionnalités avancées

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans la console
2. Consultez la documentation Next.js
3. Vérifiez la configuration de votre base de données
4. Assurez-vous que tous les prérequis sont installés

---

**🎉 Félicitations ! Votre application GED est maintenant configurée et prête à être utilisée !**
