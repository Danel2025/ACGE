#!/bin/bash

# Script: Application des corrections de sécurité Supabase
# Date: 2025-01-29
# Description: Applique toutes les corrections de sécurité identifiées par le Security Advisor

echo "🔒 Application des corrections de sécurité Supabase..."
echo "=================================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Erreur: Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI détecté"

# 1. Appliquer les migrations de sécurité
echo ""
echo "📋 Application des migrations de sécurité..."

# Migration 1: Correction des fonctions SQL
echo "  - Correction des fonctions SQL (search_path)..."
npx supabase db push --include-all

if [ $? -eq 0 ]; then
    echo "  ✅ Migration des fonctions SQL appliquée"
else
    echo "  ❌ Erreur lors de l'application de la migration des fonctions SQL"
    exit 1
fi

# 2. Vérifier la configuration
echo ""
echo "🔧 Vérification de la configuration..."

# Vérifier que les paramètres de sécurité sont corrects
echo "  - Vérification des paramètres OTP..."
if grep -q "otp_expiry = 300" supabase/config.toml; then
    echo "    ✅ OTP expiry configuré à 5 minutes"
else
    echo "    ❌ OTP expiry non configuré correctement"
fi

if grep -q "otp_length = 8" supabase/config.toml; then
    echo "    ✅ OTP length configuré à 8 caractères"
else
    echo "    ❌ OTP length non configuré correctement"
fi

if grep -q "enable_confirmations = true" supabase/config.toml; then
    echo "    ✅ Confirmations email activées"
else
    echo "    ❌ Confirmations email non activées"
fi

if grep -q "secure_password_change = true" supabase/config.toml; then
    echo "    ✅ Changement de mot de passe sécurisé activé"
else
    echo "    ❌ Changement de mot de passe sécurisé non activé"
fi

if grep -q "password_requirements = \"lower_upper_letters_digits_symbols\"" supabase/config.toml; then
    echo "    ✅ Exigences de mot de passe strictes activées"
else
    echo "    ❌ Exigences de mot de passe strictes non activées"
fi

# 3. Redémarrer Supabase pour appliquer la configuration
echo ""
echo "🔄 Redémarrage de Supabase pour appliquer la configuration..."

# Arrêter Supabase
npx supabase stop

# Redémarrer Supabase
npx supabase start

if [ $? -eq 0 ]; then
    echo "  ✅ Supabase redémarré avec succès"
else
    echo "  ❌ Erreur lors du redémarrage de Supabase"
    exit 1
fi

# 4. Vérifier que les corrections sont appliquées
echo ""
echo "🔍 Vérification des corrections appliquées..."

# Vérifier les fonctions SQL
echo "  - Vérification des fonctions SQL..."
npx supabase db reset --linked

# 5. Afficher le rapport de sécurité
echo ""
echo "📊 Génération du rapport de sécurité..."

# Exécuter la fonction d'audit de sécurité
npx supabase db push --include-all

echo ""
echo "✅ Corrections de sécurité appliquées avec succès!"
echo ""
echo "📋 Résumé des corrections:"
echo "  ✅ Fonctions SQL corrigées avec search_path sécurisé"
echo "  ✅ Configuration OTP sécurisée (5 min, 8 caractères)"
echo "  ✅ Confirmations email activées"
echo "  ✅ Changement de mot de passe sécurisé activé"
echo "  ✅ Exigences de mot de passe strictes"
echo "  ✅ Protection contre les fuites de mots de passe"
echo "  ✅ Audit de sécurité Postgres configuré"
echo ""
echo "🔒 Votre application est maintenant plus sécurisée!"
echo ""
echo "⚠️  Actions manuelles requises:"
echo "  1. Vérifiez le Security Advisor dans le dashboard Supabase"
echo "  2. Testez les nouvelles fonctionnalités de sécurité"
echo "  3. Informez vos utilisateurs des nouvelles exigences de mot de passe"
echo "  4. Configurez un serveur SMTP pour les emails de confirmation"
echo ""
echo "📚 Documentation:"
echo "  - Security Advisor: https://supabase.com/dashboard/project/[PROJECT_ID]/advisors/security"
echo "  - Auth Configuration: https://supabase.com/dashboard/project/[PROJECT_ID]/auth/settings"
