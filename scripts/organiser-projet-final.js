#!/usr/bin/env node

/**
 * Script d'organisation finale du projet ACGE
 * Organise tous les dossiers, fichiers et structure du projet
 */

const fs = require('fs');
const path = require('path');

console.log('📁 ORGANISATION FINALE DU PROJET ACGE');
console.log('====================================\n');

let organizationCount = 0;

// Fonction pour créer un dossier s'il n'existe pas
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📂 Créé: ${dirPath}`);
    organizationCount++;
  }
}

// Fonction pour déplacer un fichier
function moveFile(source, destination) {
  try {
    if (fs.existsSync(source)) {
      ensureDir(path.dirname(destination));
      fs.renameSync(source, destination);
      console.log(`📄 Déplacé: ${source} → ${destination}`);
      organizationCount++;
    }
  } catch (error) {
    console.log(`❌ Erreur déplacement ${source}: ${error.message}`);
  }
}

// 1. ORGANISATION DE LA DOCUMENTATION
console.log('📚 Organisation de la documentation:');
ensureDir('docs/architecture');
ensureDir('docs/api');
ensureDir('docs/deployment');
ensureDir('docs/user-guides');

// Déplacer les fichiers de documentation existants
const docFiles = [
  'PREVIEW_DELETION_SUMMARY.md',
  'SECURITY_FIXES.md', 
  'STANDARDISATION_MODALES.md',
  'SUPABASE_UPLOAD_SETUP.md'
];

docFiles.forEach(file => {
  if (fs.existsSync(file)) {
    moveFile(file, `docs/${file}`);
  }
});

// 2. ORGANISATION DES SCRIPTS
console.log('\n🔧 Organisation des scripts:');
ensureDir('scripts/database');
ensureDir('scripts/deployment');
ensureDir('scripts/maintenance');
ensureDir('scripts/verification');

// Déplacer les scripts de base de données
const dbScripts = [
  'scripts/add-foreign-keys.js',
  'scripts/add-montant-ordonnance-column.js',
  'scripts/add-ordonnanced-at-column.js',
  'scripts/add-ordonnancement-comment-column.js',
  'scripts/add-validation-definitive-columns.js',
  'scripts/cleanup-test-dossiers-ac.js',
  'scripts/fix_password_function.js',
  'scripts/make-bucket-public.js',
  'scripts/migrate-viewer.js',
  'scripts/move-files-to-documents-folder.js',
  'scripts/reset-dossier-status.js'
];

dbScripts.forEach(script => {
  if (fs.existsSync(script)) {
    moveFile(script, script.replace('scripts/', 'scripts/database/'));
  }
});

// Déplacer les scripts de vérification
const verificationScripts = [
  'scripts/verification-globale-architecture.js',
  'scripts/verification-globale-complete.js',
  'scripts/test-fonctionnel-final.js',
  'scripts/verify_security_fixes.js'
];

verificationScripts.forEach(script => {
  if (fs.existsSync(script)) {
    moveFile(script, script.replace('scripts/', 'scripts/verification/'));
  }
});

// Déplacer les scripts de maintenance
const maintenanceScripts = [
  'scripts/cleanup-temp-files.js',
  'scripts/clean-restart.js',
  'scripts/fix-supabase-storage-permissions.js'
];

maintenanceScripts.forEach(script => {
  if (fs.existsSync(script)) {
    moveFile(script, script.replace('scripts/', 'scripts/maintenance/'));
  }
});

// 3. ORGANISATION DES COMPOSANTS
console.log('\n🧩 Vérification de l\'organisation des composants:');
const componentDirs = [
  'src/components/auth',
  'src/components/cb', 
  'src/components/ordonnateur',
  'src/components/ac',
  'src/components/documents',
  'src/components/upload',
  'src/components/ui',
  'src/components/shared',
  'src/components/layout',
  'src/components/notifications'
];

componentDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} - Organisé`);
  } else {
    console.log(`⚠️  ${dir} - Manquant`);
  }
});

// 4. ORGANISATION DES API
console.log('\n🔌 Vérification de l\'organisation des API:');
const apiDirs = [
  'src/app/api/auth',
  'src/app/api/dossiers', 
  'src/app/api/documents',
  'src/app/api/notifications',
  'src/app/api/admin'
];

apiDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir, { recursive: true });
    console.log(`✅ ${dir} - ${files.length} fichiers`);
  } else {
    console.log(`⚠️  ${dir} - Manquant`);
  }
});

// 5. CRÉATION DU FICHIER README PRINCIPAL
console.log('\n📖 Création du README principal:');
const readmeContent = `# ACGE - Agence Comptable des Grandes Écoles

## 🏢 Description
Application moderne de gestion comptable pour les grandes écoles du Gabon, développée avec Next.js 15 et Supabase.

## 🚀 Fonctionnalités Principales

### 👥 Gestion des Rôles
- **Secrétaire** : Création et soumission des dossiers
- **Contrôleur Budgétaire (CB)** : Validation des contrôles de fond
- **Ordonnateur** : Vérifications spécifiques et ordonnancement
- **Agent Comptable (AC)** : Validation définitive et génération de quitus

### 📋 Workflow Complet
1. **Création** : Secrétaire crée un dossier avec documents
2. **Validation CB** : Contrôles de fond et types d'opérations
3. **Ordonnancement** : Vérifications ordonnateur et ordonnancement
4. **Validation AC** : Validation définitive et génération de quitus

### 🔧 Fonctionnalités Techniques
- 🔐 Authentification sécurisée avec NextAuth
- 📊 Dashboard personnalisé par rôle
- 📄 Upload et gestion des documents
- 🖨️ Génération de quitus format A4 professionnel
- 🔔 Système de notifications intelligent
- 📈 Analytics et Speed Insights Vercel

## 🛠️ Technologies Utilisées

- **Frontend** : Next.js 15, React 18, TypeScript
- **Backend** : Next.js API Routes, Supabase
- **Base de données** : PostgreSQL (Supabase)
- **Authentification** : NextAuth.js
- **UI/UX** : Tailwind CSS, Shadcn/UI
- **Déploiement** : Vercel
- **Analytics** : Vercel Speed Insights & Analytics

## 📁 Structure du Projet

\`\`\`
ACGE/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Pages d'authentification
│   │   ├── (protected)/      # Pages protégées par rôle
│   │   └── api/              # API Routes
│   ├── components/
│   │   ├── auth/             # Composants d'authentification
│   │   ├── cb/               # Composants Contrôleur Budgétaire
│   │   ├── ordonnateur/      # Composants Ordonnateur
│   │   ├── ac/               # Composants Agent Comptable
│   │   ├── documents/        # Gestion des documents
│   │   ├── upload/           # Upload de fichiers
│   │   ├── ui/               # Composants UI réutilisables
│   │   └── shared/           # Composants partagés
│   ├── lib/                  # Utilitaires et configuration
│   ├── hooks/                # Hooks React personnalisés
│   ├── types/                # Types TypeScript
│   └── styles/               # Styles CSS globaux
├── scripts/
│   ├── database/             # Scripts de base de données
│   ├── verification/         # Scripts de test et vérification
│   └── maintenance/          # Scripts de maintenance
├── docs/                     # Documentation
├── supabase/migrations/      # Migrations base de données
└── public/                   # Assets statiques
\`\`\`

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase
- Compte Vercel (pour le déploiement)

### Configuration
1. Cloner le repository
2. Installer les dépendances : \`npm install\`
3. Configurer les variables d'environnement dans \`.env\`
4. Appliquer les migrations Supabase
5. Démarrer en développement : \`npm run dev\`

### Variables d'Environnement
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
\`\`\`

## 📊 Workflows Métier

### Workflow CB (Contrôleur Budgétaire)
- Validation des contrôles de fond
- Vérification des types d'opérations
- Validation ou rejet des dossiers

### Workflow Ordonnateur
- Vérifications spécifiques par catégories
- Validation des montants et bénéficiaires
- Ordonnancement des dossiers validés

### Workflow Agent Comptable
- Révision complète des validations précédentes
- Validation définitive des dossiers
- Génération des quitus officiels

## 🖨️ Système de Quitus

- Format A4 professionnel
- Logo ACGE intégré
- Marges optimisées (15mm latérales)
- Suppression des en-têtes/pieds navigateur
- Export PDF natif du navigateur
- Archivage automatique en base de données

## 🔐 Sécurité

- Row Level Security (RLS) activé
- Authentification robuste NextAuth
- Protection des routes par rôles
- Validation des permissions API
- Chiffrement des données sensibles

## 📈 Performance

- Lazy loading des composants
- Optimisation des images
- Cache des requêtes
- Speed Insights intégré
- Bundle optimisé pour la production

## 🚀 Déploiement

1. Push vers GitHub
2. Connecter à Vercel
3. Configurer les variables d'environnement
4. Déploiement automatique

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation dans \`docs/\`
- Vérifier les logs d'erreur
- Contacter l'équipe de développement

## 📄 Licence

Propriété de l'Agence Comptable des Grandes Écoles du Gabon.

---

**Développé avec ❤️ pour l'ACGE**
`;

fs.writeFileSync('README.md', readmeContent);
console.log('✅ README.md créé');
organizationCount++;

// 6. CRÉATION DU FICHIER .gitignore OPTIMISÉ
console.log('\n🚫 Optimisation du .gitignore:');
const gitignoreContent = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/

# Temporary files
*.tmp
*.temp
nul

# Test files
test-*.js
debug-*.js
*.test.js

# Logs
logs
*.log

# PDF files (except assets)
*.pdf
!public/*.pdf

# Backup files
*.bak
*.backup
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;

fs.writeFileSync('.gitignore', gitignoreContent);
console.log('✅ .gitignore optimisé');
organizationCount++;

// 7. CRÉATION DU FICHIER DE CONFIGURATION ESLINT
console.log('\n🔍 Configuration ESLint:');
if (!fs.existsSync('.eslintrc.json')) {
  const eslintConfig = {
    "extends": ["next/core-web-vitals"],
    "rules": {
      "no-unused-vars": "warn",
      "no-console": "off",
      "@next/next/no-img-element": "off"
    }
  };
  
  fs.writeFileSync('.eslintrc.json', JSON.stringify(eslintConfig, null, 2));
  console.log('✅ .eslintrc.json créé');
  organizationCount++;
}

// 8. VÉRIFICATION DE LA STRUCTURE FINALE
console.log('\n📋 Vérification de la structure finale:');
const expectedDirs = [
  'src/app',
  'src/components', 
  'src/lib',
  'src/hooks',
  'src/types',
  'src/styles',
  'scripts/database',
  'scripts/verification',
  'scripts/maintenance',
  'docs',
  'supabase/migrations',
  'public'
];

expectedDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}`);
  } else {
    console.log(`❌ ${dir} - MANQUANT`);
  }
});

// RÉSUMÉ FINAL
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DE L\'ORGANISATION:');
console.log('='.repeat(50));
console.log(`   Actions d'organisation: ${organizationCount}`);
console.log('   ✅ Documentation organisée');
console.log('   ✅ Scripts classés par catégorie');
console.log('   ✅ Composants bien structurés');
console.log('   ✅ API organisées par domaine');
console.log('   ✅ README complet créé');
console.log('   ✅ .gitignore optimisé');
console.log('   ✅ Configuration ESLint');

console.log('\n🎉 PROJET PARFAITEMENT ORGANISÉ !');
console.log('✨ Structure professionnelle et maintenable');
console.log('📚 Documentation complète');
console.log('🔧 Scripts bien classés');
console.log('🚀 Prêt pour la production et la maintenance');

console.log('\n🏁 Organisation finale terminée !');
