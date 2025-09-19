# Scripts de Migration ACGE

## Vue d'ensemble
Ce dossier contient tous les scripts nécessaires pour migrer le projet ACGE vers le nouveau compte `danelnexon01@icloud.com`.

## 📁 Structure des Fichiers

```
scripts/migration/
├── README.md                           # Ce fichier
├── migrate-to-new-account.js          # Script principal de migration
├── setup-new-repository.sh            # Script de configuration Git
├── optimize-before-migration.js       # Script d'optimisation pré-migration
├── validate-migration.js              # Script de validation post-migration
└── vercel-migration-guide.md          # Guide détaillé Vercel
```

## 🚀 Utilisation

### 1. Préparation (Recommandé)
```bash
# Optimiser le projet avant migration
node scripts/migration/optimize-before-migration.js
```

### 2. Migration Principale
```bash
# Créer la sauvegarde et préparer la migration
node scripts/migration/migrate-to-new-account.js
```

### 3. Configuration Git
```bash
# Configurer le nouveau dépôt Git
bash scripts/migration/setup-new-repository.sh
```

### 4. Validation
```bash
# Valider la migration
node scripts/migration/validate-migration.js
```

## 📋 Scripts Détaillés

### `migrate-to-new-account.js`
**Fonction:** Script principal de migration
**Fonctionnalités:**
- Sauvegarde complète du projet
- Commit des changements actuels
- Configuration Git pour le nouveau compte
- Génération des instructions détaillées
- Création des fichiers de configuration Vercel

**Usage:**
```bash
node scripts/migration/migrate-to-new-account.js
```

### `setup-new-repository.sh`
**Fonction:** Configuration du nouveau dépôt Git
**Fonctionnalités:**
- Configuration des remotes Git
- Poussée du code vers le nouveau dépôt
- Migration de toutes les branches
- Vérification de la configuration

**Usage:**
```bash
bash scripts/migration/setup-new-repository.sh
```

### `optimize-before-migration.js`
**Fonction:** Optimisation du projet avant migration
**Fonctionnalités:**
- Optimisation des fichiers de configuration
- Tests de build et linting
- Nettoyage du projet
- Génération de rapports d'optimisation

**Usage:**
```bash
node scripts/migration/optimize-before-migration.js
```

### `validate-migration.js`
**Fonction:** Validation post-migration
**Fonctionnalités:**
- Vérification du statut Git
- Test de build
- Validation des variables d'environnement
- Tests de fonctionnalité

**Usage:**
```bash
node scripts/migration/validate-migration.js
```

## 🔧 Configuration

### Variables d'Environnement
Les scripts utilisent les variables suivantes :
- `NEW_GIT_USERNAME`: danelnexon01
- `NEW_GIT_EMAIL`: danelnexon01@icloud.com
- `NEW_REPO_NAME`: ACGE

### Fichiers de Sauvegarde
Tous les fichiers de sauvegarde sont créés dans `migration-backup/` :
- Configuration Git
- Variables d'environnement
- Instructions détaillées
- Rapports d'optimisation

## 📊 Rapports

### Rapport d'Optimisation
Fichier: `migration-backup/optimization-report.json`
Contient:
- Liste des optimisations appliquées
- Erreurs détectées
- Avertissements
- Statut global

### Instructions de Migration
Fichier: `migration-backup/MIGRATION_INSTRUCTIONS.md`
Contient:
- Étapes détaillées de migration
- Commandes à exécuter
- Configuration Vercel
- Variables d'environnement

## 🛠️ Dépannage

### Problèmes Courants

#### Permission Denied (Linux/Mac)
```bash
chmod +x scripts/migration/setup-new-repository.sh
```

#### Node.js Not Found
```bash
# Vérifier l'installation de Node.js
node --version
npm --version
```

#### Git Not Configured
```bash
# Configurer Git
git config --global user.name "danelnexon01"
git config --global user.email "danelnexon01@icloud.com"
```

### Logs et Debug
Tous les scripts génèrent des logs détaillés avec :
- Timestamps
- Niveaux de log (info, success, warning, error)
- Messages descriptifs

## 📞 Support

Pour toute question ou problème :
- **Email:** danelnexon01@icloud.com
- **Documentation:** Consultez `MIGRATION_GUIDE.md`
- **Logs:** Vérifiez les logs des scripts

## ✅ Checklist de Migration

### Avant Migration
- [ ] Node.js installé (>= 18.0.0)
- [ ] Git configuré
- [ ] Projet fonctionnel localement
- [ ] Sauvegarde créée

### Pendant Migration
- [ ] Script d'optimisation exécuté
- [ ] Script principal exécuté
- [ ] Nouveau dépôt GitHub créé
- [ ] Script de configuration Git exécuté

### Après Migration
- [ ] Script de validation exécuté
- [ ] Tests manuels passés
- [ ] Vercel configuré
- [ ] Domaine fonctionnel

## 🎯 Résultats Attendus

Après une migration réussie :
- ✅ Code migré vers le nouveau dépôt
- ✅ Configuration Git mise à jour
- ✅ Vercel configuré avec le nouveau compte
- ✅ Toutes les fonctionnalités opérationnelles
- ✅ Performance optimisée
- ✅ Sécurité maintenue

---

**Bonne migration ! 🚀**
