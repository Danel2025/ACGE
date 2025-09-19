#!/usr/bin/env node

/**
 * Script d'optimisation avant migration
 * Usage: node scripts/migration/optimize-before-migration.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreMigrationOptimizer {
  constructor() {
    this.optimizations = [];
    this.errors = [];
    this.warnings = [];
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
  }

  async runCommand(command, description) {
    try {
      this.log(`Exécution: ${description}`, 'info');
      execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      this.log(`Succès: ${description}`, 'success');
      return true;
    } catch (error) {
      this.log(`Erreur lors de ${description}: ${error.message}`, 'error');
      return false;
    }
  }

  async optimizePackageJson() {
    this.log('Optimisation du package.json...', 'info');
    
    try {
      const packagePath = 'package.json';
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Optimisations
      const optimizations = {
        // Ajouter des scripts utiles
        scripts: {
          ...packageJson.scripts,
          'migrate:prepare': 'node scripts/migration/migrate-to-new-account.js',
          'migrate:validate': 'node scripts/migration/validate-migration.js',
          'optimize:pre-migration': 'node scripts/migration/optimize-before-migration.js',
          'clean:build': 'rm -rf .next out',
          'clean:cache': 'rm -rf .turbo node_modules/.cache',
          'fresh:install': 'rm -rf node_modules package-lock.json && npm install'
        },
        
        // Optimiser les dépendances
        engines: {
          node: '>=18.0.0',
          npm: '>=8.0.0'
        },
        
        // Ajouter des métadonnées
        repository: {
          type: 'git',
          url: 'https://github.com/danelnexon01/ACGE.git'
        },
        
        keywords: [
          'acge',
          'gabon',
          'comptabilite',
          'nextjs',
          'supabase',
          'vercel'
        ],
        
        author: {
          name: 'danelnexon01',
          email: 'danelnexon01@icloud.com'
        },
        
        license: 'MIT'
      };
      
      // Appliquer les optimisations
      Object.assign(packageJson, optimizations);
      
      // Sauvegarder
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      this.log('package.json optimisé', 'success');
      this.optimizations.push('package.json optimisé');
      
    } catch (error) {
      this.log(`Erreur lors de l'optimisation du package.json: ${error.message}`, 'error');
      this.errors.push('package.json');
    }
  }

  async optimizeNextConfig() {
    this.log('Optimisation de next.config.ts...', 'info');
    
    try {
      const configPath = 'next.config.ts';
      let config = fs.readFileSync(configPath, 'utf8');
      
      // Optimisations pour la production
      const optimizations = [
        // Ajouter des optimisations de performance
        {
          from: '// Configuration expérimentale',
          to: `// Configuration expérimentale
  // Optimisations pour la migration
  optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@supabase/supabase-js'],
  // Optimiser les preloads
  optimizeCss: true,
  // Optimiser les images
  optimizeImages: true,`
        },
        
        // Ajouter des headers de sécurité
        {
          from: "key: 'X-Frame-Options',",
          to: `key: 'X-Frame-Options',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'`
        }
      ];
      
      // Appliquer les optimisations
      optimizations.forEach(opt => {
        config = config.replace(opt.from, opt.to);
      });
      
      // Sauvegarder
      fs.writeFileSync(configPath, config);
      this.log('next.config.ts optimisé', 'success');
      this.optimizations.push('next.config.ts optimisé');
      
    } catch (error) {
      this.log(`Erreur lors de l'optimisation de next.config.ts: ${error.message}`, 'error');
      this.errors.push('next.config.ts');
    }
  }

  async optimizeVercelConfig() {
    this.log('Optimisation de vercel.json...', 'info');
    
    try {
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
        "regions": ["fra1"],
        // Optimisations ajoutées
        "build": {
          "env": {
            "NODE_ENV": "production"
          }
        },
        "headers": [
          {
            "source": "/(.*)",
            "headers": [
              {
                "key": "X-DNS-Prefetch-Control",
                "value": "on"
              },
              {
                "key": "X-Frame-Options",
                "value": "DENY"
              },
              {
                "key": "X-Content-Type-Options",
                "value": "nosniff"
              },
              {
                "key": "Referrer-Policy",
                "value": "origin-when-cross-origin"
              }
            ]
          }
        ],
        "redirects": [
          {
            "source": "/home",
            "destination": "/",
            "permanent": true
          }
        ]
      };
      
      fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
      this.log('vercel.json optimisé', 'success');
      this.optimizations.push('vercel.json optimisé');
      
    } catch (error) {
      this.log(`Erreur lors de l'optimisation de vercel.json: ${error.message}`, 'error');
      this.errors.push('vercel.json');
    }
  }

  async createGitignoreOptimizations() {
    this.log('Optimisation du .gitignore...', 'info');
    
    try {
      const gitignorePath = '.gitignore';
      let gitignore = fs.readFileSync(gitignorePath, 'utf8');
      
      // Ajouts pour la migration
      const additions = `
# Migration files
migration-backup/
*.migration.log

# Vercel
.vercel

# Environment files
.env.production
.env.local.production

# Build artifacts
.next/
out/
build/

# Cache
.turbo/
node_modules/.cache/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.production

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
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

      // Ajouter seulement si pas déjà présent
      if (!gitignore.includes('migration-backup/')) {
        gitignore += additions;
        fs.writeFileSync(gitignorePath, gitignore);
        this.log('.gitignore optimisé', 'success');
        this.optimizations.push('.gitignore optimisé');
      } else {
        this.log('.gitignore déjà optimisé', 'info');
      }
      
    } catch (error) {
      this.log(`Erreur lors de l'optimisation du .gitignore: ${error.message}`, 'error');
      this.errors.push('.gitignore');
    }
  }

  async runLinting() {
    this.log('Exécution du linting...', 'info');
    
    const lintSuccess = await this.runCommand('npm run lint', 'Linting du code');
    if (lintSuccess) {
      this.log('Linting réussi', 'success');
      this.optimizations.push('Linting réussi');
    } else {
      this.log('Problèmes de linting détectés', 'warning');
      this.warnings.push('Linting');
    }
  }

  async runBuildTest() {
    this.log('Test de build...', 'info');
    
    const buildSuccess = await this.runCommand('npm run build', 'Test de build');
    if (buildSuccess) {
      this.log('Build réussi', 'success');
      this.optimizations.push('Build testé avec succès');
    } else {
      this.log('Échec du build', 'error');
      this.errors.push('Build');
    }
  }

  async cleanProject() {
    this.log('Nettoyage du projet...', 'info');
    
    const cleanCommands = [
      'rm -rf .next',
      'rm -rf out',
      'rm -rf .turbo',
      'rm -rf node_modules/.cache'
    ];
    
    for (const cmd of cleanCommands) {
      await this.runCommand(cmd, `Nettoyage: ${cmd}`);
    }
    
    this.log('Projet nettoyé', 'success');
    this.optimizations.push('Projet nettoyé');
  }

  async generateOptimizationReport() {
    this.log('Génération du rapport d\'optimisation...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      optimizations: this.optimizations,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalOptimizations: this.optimizations.length,
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        status: this.errors.length === 0 ? 'SUCCESS' : 'HAS_ERRORS'
      }
    };
    
    fs.writeFileSync(
      'migration-backup/optimization-report.json',
      JSON.stringify(report, null, 2)
    );
    
    this.log('Rapport d\'optimisation généré', 'success');
  }

  async runOptimization() {
    this.log('=== DÉBUT DE L\'OPTIMISATION PRÉ-MIGRATION ===', 'info');
    
    try {
      // Créer le dossier de sauvegarde
      if (!fs.existsSync('migration-backup')) {
        fs.mkdirSync('migration-backup', { recursive: true });
      }
      
      // 1. Nettoyer le projet
      await this.cleanProject();
      
      // 2. Optimiser les fichiers de configuration
      await this.optimizePackageJson();
      await this.optimizeNextConfig();
      await this.optimizeVercelConfig();
      await this.createGitignoreOptimizations();
      
      // 3. Tests
      await this.runLinting();
      await this.runBuildTest();
      
      // 4. Générer le rapport
      await this.generateOptimizationReport();
      
      this.log('=== OPTIMISATION TERMINÉE ===', 'success');
      this.log(`Optimisations appliquées: ${this.optimizations.length}`, 'info');
      this.log(`Erreurs: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'info');
      this.log(`Avertissements: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'info');
      
      if (this.errors.length === 0) {
        this.log('✅ Le projet est prêt pour la migration!', 'success');
      } else {
        this.log('⚠️ Des erreurs ont été détectées. Vérifiez avant la migration.', 'warning');
      }
      
    } catch (error) {
      this.log(`Erreur lors de l'optimisation: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Exécution du script
const optimizer = new PreMigrationOptimizer();
optimizer.runOptimization().catch(console.error);
