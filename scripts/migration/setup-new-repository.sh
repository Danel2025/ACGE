#!/bin/bash

# Script de configuration du nouveau dépôt
# Usage: bash scripts/migration/setup-new-repository.sh

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NEW_GIT_USERNAME="danelnexon01"
NEW_GIT_EMAIL="danelnexon01@icloud.com"
NEW_REPO_NAME="ACGE"
OLD_GIT_USERNAME="Velaskez"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier que nous sommes dans un dépôt Git
if [ ! -d ".git" ]; then
    error "Ce script doit être exécuté dans un dépôt Git"
    exit 1
fi

log "=== CONFIGURATION DU NOUVEAU DÉPÔT ==="

# 1. Vérifier l'état actuel
log "Vérification de l'état actuel..."
if [ -n "$(git status --porcelain)" ]; then
    warning "Des fichiers non commités sont détectés"
    git status --short
    read -p "Voulez-vous continuer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Annulation de la migration"
        exit 1
    fi
fi

# 2. Configurer Git avec le nouveau compte
log "Configuration de Git avec le nouveau compte..."
git config user.name "$NEW_GIT_USERNAME"
git config user.email "$NEW_GIT_EMAIL"
success "Configuration Git mise à jour"

# 3. Vérifier la configuration
log "Vérification de la configuration Git..."
echo "Nom d'utilisateur: $(git config user.name)"
echo "Email: $(git config user.email)"

# 4. Afficher les instructions pour créer le nouveau dépôt
log "Instructions pour créer le nouveau dépôt GitHub:"
echo ""
echo "1. Connectez-vous à GitHub avec le compte: $NEW_GIT_EMAIL"
echo "2. Créez un nouveau dépôt nommé: $NEW_REPO_NAME"
echo "3. NE PAS initialiser avec README, .gitignore ou licence"
echo "4. Copiez l'URL du dépôt (format: https://github.com/$NEW_GIT_USERNAME/$NEW_REPO_NAME.git)"
echo ""

# 5. Attendre que l'utilisateur crée le dépôt
read -p "Appuyez sur Entrée une fois le dépôt créé sur GitHub..."

# 6. Configurer le nouveau remote
log "Configuration du nouveau remote..."

# Supprimer l'ancien remote s'il existe
if git remote get-url origin >/dev/null 2>&1; then
    log "Suppression de l'ancien remote..."
    git remote remove origin
fi

# Demander l'URL du nouveau dépôt
read -p "Entrez l'URL du nouveau dépôt (https://github.com/$NEW_GIT_USERNAME/$NEW_REPO_NAME.git): " NEW_REPO_URL

if [ -z "$NEW_REPO_URL" ]; then
    NEW_REPO_URL="https://github.com/$NEW_GIT_USERNAME/$NEW_REPO_NAME.git"
fi

# Ajouter le nouveau remote
git remote add origin "$NEW_REPO_URL"
success "Nouveau remote configuré: $NEW_REPO_URL"

# 7. Vérifier la configuration des remotes
log "Vérification de la configuration des remotes..."
git remote -v

# 8. Pousser le code vers le nouveau dépôt
log "Poussée du code vers le nouveau dépôt..."

# Pousser la branche master
log "Poussée de la branche master..."
git push -u origin master
success "Branche master poussée"

# Pousser la branche main si elle existe
if git show-ref --verify --quiet refs/heads/main; then
    log "Poussée de la branche main..."
    git push origin main
    success "Branche main poussée"
fi

# Pousser les branches de fonctionnalités
log "Poussée des branches de fonctionnalités..."
for branch in $(git branch -r | grep -v HEAD | sed 's/origin\///'); do
    if [ "$branch" != "master" ] && [ "$branch" != "main" ]; then
        log "Poussée de la branche: $branch"
        git push origin "origin/$branch:$branch" || warning "Impossible de pousser $branch"
    fi
done

# 9. Vérifier le statut final
log "Vérification du statut final..."
git status
git remote -v

success "=== MIGRATION GIT TERMINÉE ==="
log "Le code a été migré vers: $NEW_REPO_URL"
log "Prochaines étapes:"
echo "1. Configurer Vercel avec le nouveau dépôt"
echo "2. Mettre à jour les variables d'environnement"
echo "3. Déployer et tester"
echo "4. Exécuter: node scripts/migration/validate-migration.js"
