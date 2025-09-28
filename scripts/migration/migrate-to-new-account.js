#!/usr/bin/env node

/**
 * Script de migration vers le nouveau compte Git et Vercel
 * Usage: node scripts/migration/migrate-to-new-account.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Nouveau compte Git
  NEW_GIT_USERNAME: 'danelnexon01',
  NEW_GIT_EMAIL: 'danelnexon01@icloud.com',
  NEW_REPO_NAME: 'ACGE',
  
  // Ancien compte (pour référence)
  OLD_GIT_USERNAME: 'Velaskez',
  
  // Configuration Vercel
  VERCEL_PROJECT_NAME: 'acge-gabon',
  VERCEL_DOMAIN: 'acge-gabon.com',
  
  // Fichiers à sauvegarder
  BACKUP_DIR: './migration-backup',
  
  // Variables d'environnement à migrer
  ENV_VARS: [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
};

class MigrationManager {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.success.push(message);
  }

  async runCommand(command, description) {
    try {
      this.log(`Exécution: ${description}`, 'info');
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      this.log(`Succès: ${description}`, 'success');
      return result;
    } catch (error) {
      this.log(`Erreur lors de ${description}: ${error.message}`, 'error');
      throw error;
    }
  }

  async createBackup() {
    this.log('Création de la sauvegarde...', 'info');
    
    // Créer le dossier de sauvegarde
    if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
      fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
    }

    // Sauvegarder les fichiers importants
    const filesToBackup = [
      'package.json',
      'vercel.json',
      'next.config.ts',
      'env.example',
      '.gitignore',
      'supabase/config.toml'
    ];

    for (const file of filesToBackup) {
      if (fs.existsSync(file)) {
        const backupPath = path.join(CONFIG.BACKUP_DIR, file);
        const backupDir = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.copyFileSync(file, backupPath);
        this.log(`Sauvegardé: ${file}`, 'success');
      }
    }

    // Sauvegarder l'état Git actuel
    try {
      const gitStatus = this.runCommand('git status --porcelain', 'Récupération du statut Git');
      fs.writeFileSync(path.join(CONFIG.BACKUP_DIR, 'git-status.txt'), gitStatus);
      
      const gitLog = this.runCommand('git log --oneline -10', 'Récupération de l\'historique Git');
      fs.writeFileSync(path.join(CONFIG.BACKUP_DIR, 'git-log.txt'), gitLog);
      
      this.log('Sauvegarde Git créée', 'success');
    } catch (error) {
      this.log('Impossible de sauvegarder l\'état Git', 'warning');
    }
  }

  async commitCurrentChanges() {
    this.log('Commit des changements actuels...', 'info');
    
    try {
      // Ajouter tous les fichiers modifiés
      this.runCommand('git add .', 'Ajout des fichiers modifiés');
      
      // Commit avec message descriptif
      const commitMessage = `feat: standardisation des loaders et préparation migration

- Remplacement de tous les loaders non-standard par LoadingState
- Suppression du composant LoadingSpinner redondant
- Ajout de nouvelles variantes (refresh, delete, save, login)
- Amélioration du système de loaders unifié
- Préparation pour migration vers nouveau compte Git

Fichiers modifiés:
- 17 composants avec loaders standardisés
- 1 composant supprimé (loading-spinner.tsx)
- Amélioration du système LoadingState

Migration vers: danelnexon01@icloud.com`;

      this.runCommand(`git commit -m "${commitMessage}"`, 'Commit des changements');
      this.log('Changements commités avec succès', 'success');
      
    } catch (error) {
      this.log('Aucun changement à commiter ou erreur lors du commit', 'warning');
    }
  }

  async updateGitConfig() {
    this.log('Mise à jour de la configuration Git...', 'info');
    
    try {
      // Configurer le nouvel utilisateur
      this.runCommand(`git config user.name "${CONFIG.NEW_GIT_USERNAME}"`, 'Configuration du nom d\'utilisateur');
      this.runCommand(`git config user.email "${CONFIG.NEW_GIT_EMAIL}"`, 'Configuration de l\'email');
      
      this.log('Configuration Git mise à jour', 'success');
    } catch (error) {
      this.log('Erreur lors de la configuration Git', 'error');
      throw error;
    }
  }

  async createNewRepositoryInstructions() {
    this.log('Création des instructions pour le nouveau dépôt...', 'info');
    
    const instructions = `# Instructions de Migration vers le Nouveau Compte

## Compte de destination
- **Email:** ${CONFIG.NEW_GIT_EMAIL}
- **Username:** ${CONFIG.NEW_GIT_USERNAME}
- **Repository:** ${CONFIG.NEW_REPO_NAME}

## Étapes à suivre

### 1. Créer le nouveau dépôt GitHub
1. Se connecter à GitHub avec le compte ${CONFIG.NEW_GIT_EMAIL}
2. Créer un nouveau dépôt nommé "${CONFIG.NEW_REPO_NAME}"
3. Ne pas initialiser avec README, .gitignore ou licence

### 2. Configurer le remote
\`\`\`bash
# Supprimer l'ancien remote
git remote remove origin

# Ajouter le nouveau remote
git remote add origin https://github.com/${CONFIG.NEW_GIT_USERNAME}/${CONFIG.NEW_REPO_NAME}.git

# Vérifier la configuration
git remote -v
\`\`\`

### 3. Pousser le code
\`\`\`bash
# Pousser toutes les branches
git push -u origin master
git push origin main

# Pousser les branches de fonctionnalités
git push origin cursor/connect-lws-database-and-storage-to-vercel-project-506c
git push origin cursor/debug-and-fix-console-errors-5c33
git push origin cursor/fix-document-visibility-in-navigation-b7e6
git push origin cursor/handle-data-fetching-errors-6882
git push origin cursor/handle-file-upload-error-b9f0
git push origin cursor/migrate-acge-to-supabase-with-prisma-452c
git push origin cursor/process-api-test-report-results-240c
\`\`\`

### 4. Configuration Vercel
1. Se connecter à Vercel avec le compte ${CONFIG.NEW_GIT_EMAIL}
2. Importer le projet depuis GitHub
3. Configurer les variables d'environnement
4. Déployer

### 5. Variables d'environnement Vercel
\`\`\`env
DATABASE_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
NEXTAUTH_URL=https://acge-gabon.com
NEXTAUTH_SECRET=votre_secret_production_securise_changez_ceci
NEXT_PUBLIC_API_URL=https://acge-gabon.com
NEXT_PUBLIC_SUPABASE_URL=https://wodyrsasfqfoqdydrfew.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjIzNzYsImV4cCI6MjA3MDU5ODM3Nn0.RhB2OMRdddHXWt1lB6NfHxMl1In_U9CPK_hBOU1UlN4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyMjM3NiwiZXhwIjoyMDcwNTk4Mzc2fQ.gZZ3WTWHNLaYBztUXwx4d8uW56CGHlqznOuNvopkka0
\`\`\`

## Fichiers de sauvegarde
Tous les fichiers importants ont été sauvegardés dans: ${CONFIG.BACKUP_DIR}

## Rollback
En cas de problème, vous pouvez revenir à l'ancien dépôt:
\`\`\`bash
git remote add origin https://github.com/${CONFIG.OLD_GIT_USERNAME}/ACGE.git
\`\`\`
`;

    fs.writeFileSync(path.join(CONFIG.BACKUP_DIR, 'MIGRATION_INSTRUCTIONS.md'), instructions);
    this.log('Instructions de migration créées', 'success');
  }

  async generateVercelConfig() {
    this.log('Génération de la configuration Vercel...', 'info');
    
    const vercelConfig = {
      "buildCommand": "npm run build",
      "outputDirectory": ".next",
      "devCommand": "npm run dev",
      "installCommand": "npm install",
      "framework": "nextjs",
      "env": {
        "DATABASE_URL": "postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
        "DIRECT_URL": "postgresql://postgres.wodyrsasfqfoqdydrfew:Reviti2025%40@aws-0-eu-west-3.pooler.supabase.com:5432/postgres",
        "NEXTAUTH_URL": "https://acge-gabon.com",
        "NEXTAUTH_SECRET": "votre_secret_production_securise_changez_ceci",
        "NEXT_PUBLIC_API_URL": "https://acge-gabon.com",
        "NEXT_PUBLIC_SUPABASE_URL": "https://wodyrsasfqfoqdydrfew.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMjIzNzYsImV4cCI6MjA3MDU5ODM3Nn0.RhB2OMRdddHXWt1lB6NfHxMl1In_U9CPK_hBOU1UlN4",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyMjM3NiwiZXhwIjoyMDcwNTk4Mzc2fQ.gZZ3WTWHNLaYBztUXwx4d8uW56CGHlqznOuNvopkka0"
      },
      "functions": {
        "src/app/api/**/*.ts": {
          "maxDuration": 30
        }
      },
      "regions": ["fra1"]
    };

    fs.writeFileSync(
      path.join(CONFIG.BACKUP_DIR, 'vercel-config.json'), 
      JSON.stringify(vercelConfig, null, 2)
    );
    
    this.log('Configuration Vercel générée', 'success');
  }

  async generateValidationScript() {
    this.log('Génération du script de validation...', 'info');
    
    const validationScript = `#!/usr/bin/env node

/**
 * Script de validation post-migration
 * Usage: node scripts/migration/validate-migration.js
 */

const { execSync } = require('child_process');
const https = require('https');

class MigrationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(\`\${prefix} [\${timestamp}] \${message}\`);
  }

  async checkGitStatus() {
    this.log('Vérification du statut Git...', 'info');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        this.log('Fichiers non commités détectés', 'warning');
        this.log(status, 'info');
      } else {
        this.log('Repository Git propre', 'success');
      }
    } catch (error) {
      this.log('Erreur lors de la vérification Git', 'error');
    }
  }

  async checkRemoteConfig() {
    this.log('Vérification de la configuration des remotes...', 'info');
    
    try {
      const remotes = execSync('git remote -v', { encoding: 'utf8' });
      this.log('Configuration des remotes:', 'info');
      this.log(remotes, 'info');
      
      if (remotes.includes('danelnexon01')) {
        this.log('Remote configuré pour le nouveau compte', 'success');
      } else {
        this.log('Remote non configuré pour le nouveau compte', 'warning');
      }
    } catch (error) {
      this.log('Erreur lors de la vérification des remotes', 'error');
    }
  }

  async checkBuild() {
    this.log('Test de build...', 'info');
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
      this.log('Build réussi', 'success');
    } catch (error) {
      this.log('Erreur lors du build', 'error');
    }
  }

  async checkDependencies() {
    this.log('Vérification des dépendances...', 'info');
    
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
      this.log('Aucune vulnérabilité critique détectée', 'success');
    } catch (error) {
      this.log('Vulnérabilités détectées', 'warning');
    }
  }

  async checkEnvironmentVariables() {
    this.log('Vérification des variables d\\'environnement...', 'info');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.log(\`\${varName}: Configurée\`, 'success');
      } else {
        this.log(\`\${varName}: Manquante\`, 'warning');
      }
    }
  }

  async runAllChecks() {
    this.log('=== DÉBUT DE LA VALIDATION POST-MIGRATION ===', 'info');
    
    await this.checkGitStatus();
    await this.checkRemoteConfig();
    await this.checkDependencies();
    await this.checkEnvironmentVariables();
    await this.checkBuild();
    
    this.log('=== VALIDATION TERMINÉE ===', 'info');
  }
}

// Exécution du script
const validator = new MigrationValidator();
validator.runAllChecks().catch(console.error);
`;

    fs.writeFileSync(path.join(CONFIG.BACKUP_DIR, 'validate-migration.js'), validationScript);
    this.log('Script de validation généré', 'success');
  }

  async runMigration() {
    this.log('=== DÉBUT DE LA MIGRATION ===', 'info');
    
    try {
      // 1. Créer la sauvegarde
      await this.createBackup();
      
      // 2. Commiter les changements actuels
      await this.commitCurrentChanges();
      
      // 3. Mettre à jour la configuration Git
      await this.updateGitConfig();
      
      // 4. Créer les instructions
      await this.createNewRepositoryInstructions();
      
      // 5. Générer la configuration Vercel
      await this.generateVercelConfig();
      
      // 6. Générer le script de validation
      await this.generateValidationScript();
      
      this.log('=== MIGRATION PRÉPARÉE AVEC SUCCÈS ===', 'success');
      this.log(`Fichiers de sauvegarde dans: ${CONFIG.BACKUP_DIR}`, 'info');
      this.log('Consultez MIGRATION_INSTRUCTIONS.md pour les étapes suivantes', 'info');
      
    } catch (error) {
      this.log(`Erreur lors de la migration: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Exécution du script
const migration = new MigrationManager();
migration.runMigration().catch(console.error);
