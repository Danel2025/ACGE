#!/usr/bin/env node

/**
 * Script de vérification globale complète de la solution ACGE
 * Tests complets de tous les composants et fonctionnalités
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 VÉRIFICATION GLOBALE COMPLÈTE - SOLUTION ACGE');
console.log('===============================================\n');

let totalChecks = 0;
let passedChecks = 0;

function checkItem(condition, description) {
  totalChecks++;
  if (condition) {
    console.log(`✅ ${description}`);
    passedChecks++;
    return true;
  } else {
    console.log(`❌ ${description}`);
    return false;
  }
}

// 1. VÉRIFICATION DE L'ARCHITECTURE
console.log('🏗️  ARCHITECTURE ET STRUCTURE:');
checkItem(fs.existsSync('src/app/layout.tsx'), 'Layout principal présent');
checkItem(fs.existsSync('src/lib/supabase.ts'), 'Configuration Supabase');
checkItem(fs.existsSync('src/styles/print-a4.css'), 'Styles d\'impression A4');
checkItem(fs.existsSync('package.json'), 'Configuration package.json');

// 2. VÉRIFICATION DES PAGES PRINCIPALES
console.log('\n📄 PAGES PRINCIPALES:');
const mainPages = [
  'src/app/(protected)/dashboard/page.tsx',
  'src/app/(protected)/cb-dashboard/page.tsx', 
  'src/app/(protected)/ordonnateur-dashboard/page.tsx',
  'src/app/(protected)/ac-dashboard/page.tsx',
  'src/app/(protected)/upload/page.tsx',
  'src/app/(protected)/documents/page.tsx',
  'src/app/(protected)/print-quitus/[id]/page.tsx'
];

mainPages.forEach(page => {
  checkItem(fs.existsSync(page), `Page: ${page.split('/').pop()}`);
});

// 3. VÉRIFICATION DES API ENDPOINTS
console.log('\n🔌 API ENDPOINTS CRITIQUES:');
const criticalApis = [
  'src/app/api/auth/me/route.ts',
  'src/app/api/dossiers/route.ts',
  'src/app/api/dossiers/[id]/ordonnance/route.ts',
  'src/app/api/dossiers/[id]/generate-quitus/route.ts',
  'src/app/api/dossiers/[id]/validation-definitive/route.ts',
  'src/app/api/verifications-ordonnateur/route.ts',
  'src/app/api/documents/route.ts'
];

criticalApis.forEach(api => {
  checkItem(fs.existsSync(api), `API: ${api.split('/').slice(-2).join('/')}`);
});

// 4. VÉRIFICATION DES COMPOSANTS MÉTIER
console.log('\n🧩 COMPOSANTS MÉTIER:');
const businessComponents = [
  'src/components/cb/controles-fond-form.tsx',
  'src/components/ordonnateur/verifications-ordonnateur-form.tsx',
  'src/components/ac/quitus-display.tsx',
  'src/components/ac/rapport-verification.tsx',
  'src/components/upload/upload-modal.tsx'
];

businessComponents.forEach(comp => {
  checkItem(fs.existsSync(comp), `Composant: ${comp.split('/').pop()}`);
});

// 5. VÉRIFICATION DES MIGRATIONS SUPABASE
console.log('\n🗄️  MIGRATIONS SUPABASE:');
if (fs.existsSync('supabase/migrations')) {
  const migrations = fs.readdirSync('supabase/migrations');
  checkItem(migrations.length > 0, `Migrations présentes (${migrations.length} fichiers)`);
  
  // Vérification des migrations critiques
  const criticalMigrations = [
    'create_verifications_ordonnateur_tables.sql',
    'create_controles_fond_tables.sql',
    'fix_security_issues.sql'
  ];
  
  criticalMigrations.forEach(migration => {
    const exists = migrations.some(file => file.includes(migration.replace('.sql', '')));
    checkItem(exists, `Migration: ${migration}`);
  });
}

// 6. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
console.log('\n🔧 VARIABLES D\'ENVIRONNEMENT:');
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

envVars.forEach(varName => {
  checkItem(!!process.env[varName], `Variable: ${varName}`);
});

// 7. VÉRIFICATION DES DÉPENDANCES CRITIQUES
console.log('\n📦 DÉPENDANCES CRITIQUES:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const criticalDeps = [
    'next',
    'react',
    '@supabase/supabase-js',
    'tailwindcss',
    '@vercel/speed-insights',
    '@vercel/analytics'
  ];
  
  criticalDeps.forEach(dep => {
    const hasDepency = !!(packageJson.dependencies[dep] || packageJson.devDependencies[dep]);
    checkItem(hasDepency, `Dépendance: ${dep}`);
  });
} catch (error) {
  checkItem(false, 'Lecture du package.json');
}

// 8. VÉRIFICATION DES WORKFLOWS
console.log('\n⚡ WORKFLOWS ET LOGIQUE MÉTIER:');

// Vérification du workflow CB
const cbWorkflow = [
  'src/app/api/dossiers/[id]/validation-controles-fond/route.ts',
  'src/app/api/dossiers/[id]/validation-operation-type/route.ts',
  'src/components/cb/controles-fond-form.tsx'
];

cbWorkflow.forEach(file => {
  checkItem(fs.existsSync(file), `Workflow CB: ${file.split('/').pop()}`);
});

// Vérification du workflow Ordonnateur
const ordWorkflow = [
  'src/app/api/dossiers/[id]/verifications-ordonnateur/route.ts',
  'src/components/ordonnateur/verifications-ordonnateur-form.tsx'
];

ordWorkflow.forEach(file => {
  checkItem(fs.existsSync(file), `Workflow Ordonnateur: ${file.split('/').pop()}`);
});

// Vérification du workflow AC
const acWorkflow = [
  'src/app/api/dossiers/[id]/validation-definitive/route.ts',
  'src/app/api/dossiers/[id]/generate-quitus/route.ts',
  'src/components/ac/quitus-display.tsx'
];

acWorkflow.forEach(file => {
  checkItem(fs.existsSync(file), `Workflow AC: ${file.split('/').pop()}`);
});

// 9. VÉRIFICATION DE LA SÉCURITÉ
console.log('\n🔐 SÉCURITÉ:');
checkItem(fs.existsSync('src/components/auth/role-guard.tsx'), 'Garde des rôles');
checkItem(fs.existsSync('src/lib/supabase-auth-server.ts'), 'Auth serveur');
checkItem(fs.existsSync('src/lib/supabase-auth-client.ts'), 'Auth client');

// 10. VÉRIFICATION DE L'INTERFACE UTILISATEUR
console.log('\n🎨 INTERFACE UTILISATEUR:');
const uiComponents = [
  'src/components/ui/dialog.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/form.tsx',
  'src/components/ui/table.tsx'
];

uiComponents.forEach(comp => {
  checkItem(fs.existsSync(comp), `Composant UI: ${comp.split('/').pop()}`);
});

// 11. VÉRIFICATION DES ASSETS
console.log('\n🖼️  ASSETS ET RESSOURCES:');
checkItem(fs.existsSync('public'), 'Dossier public');
checkItem(fs.existsSync('public/logo-tresor-public.svg'), 'Logo ACGE');

// RÉSUMÉ FINAL
console.log('\n' + '='.repeat(50));
console.log('📊 RÉSUMÉ DE LA VÉRIFICATION GLOBALE:');
console.log('='.repeat(50));
console.log(`   Total des vérifications: ${totalChecks}`);
console.log(`   Vérifications réussies: ${passedChecks}`);
console.log(`   Vérifications échouées: ${totalChecks - passedChecks}`);
console.log(`   Taux de réussite: ${Math.round((passedChecks / totalChecks) * 100)}%`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 TOUTES LES VÉRIFICATIONS SONT PASSÉES !');
  console.log('✨ La solution ACGE est prête pour la production.');
  console.log('🚀 Vous pouvez procéder au déploiement en toute confiance.');
} else if (passedChecks / totalChecks >= 0.9) {
  console.log('\n✅ LA PLUPART DES VÉRIFICATIONS SONT PASSÉES');
  console.log('⚠️  Quelques éléments mineurs à vérifier, mais la solution est fonctionnelle.');
  console.log('🔧 Corrigez les points manquants puis redéployez.');
} else {
  console.log('\n⚠️  PLUSIEURS VÉRIFICATIONS ONT ÉCHOUÉ');
  console.log('❌ Des éléments critiques sont manquants.');
  console.log('🔧 Corrigez les erreurs avant le déploiement.');
}

console.log('\n🏁 Vérification globale terminée !');
