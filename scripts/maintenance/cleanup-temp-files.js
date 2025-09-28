#!/usr/bin/env node

/**
 * Script de nettoyage des fichiers temporaires et de test ACGE
 * Supprime tous les fichiers de test, temporaires et obsolètes
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 NETTOYAGE DES FICHIERS TEMPORAIRES ET DE TEST');
console.log('===============================================\n');

// Fichiers et dossiers à supprimer
const filesToDelete = [
  // Fichiers de test temporaires
  'test-*.js',
  'debug-*.js',
  'check-*.js',
  'fix-*.js',
  'create-*.js',
  'apply-*.js',
  'verify-*.js',
  
  // Fichiers de configuration temporaires
  'cookies.txt',
  'nul',
  
  // Fichiers SQL temporaires
  '*.sql',
  
  // Fichiers markdown de documentation temporaire
  'ALIGNMENT_OPTIMIZATION_REPORT.md',
  'AMELIORATION_WORKFLOW_DOSSIERS.md',
  'CARD_HEIGHT_REDUCTION_REPORT.md',
  'COMPLETE_SPACING_OPTIMIZATION_REPORT.md',
  'CORRECTION_FINALE_POSTES_COMPTABLES.md',
  'CORRECTION_POSTES_COMPTABLES.md',
  'FILTER_BOX_OPTIMIZATION_REPORT.md',
  'FINAL_FOLDERID_FIX.md',
  'FOLDERID_FIX_INSTRUCTIONS.md',
  'FONCTIONNALITE_SOUMISSION_DOSSIERS.md',
  'FONCTIONNALITE_SUPPRESSION_DOSSIERS_REJETES_CB.md',
  'FONT_CONFIGURATION_SUMMARY.md',
  'FONT_USAGE_GUIDE.md',
  'FREEMONO_COMPLETE_FIXES_SUMMARY.md',
  'FREEMONO_FIXES_SUMMARY.md',
  'GRID_PROPORTIONS_OPTIMIZATION_REPORT.md',
  'HEADER_NOTIFICATIONS_ICON.md',
  'MIGRATION_STATUT_FOLDERS.md',
  'NOTIFICATIONS_FINAL_SUMMARY.md',
  'NOTIFICATIONS_SETUP.md',
  'PREVIEW_MODAL_OPTIMIZATION_REPORT.md',
  'RESUME_SOLUTION_COLONNES_REJET.md',
  'SHADCN_OPTIMIZATION_SUMMARY.md',
  'SHADCN_UI_RULES.md',
  'SIDEBAR_NOTIFICATIONS_IMPROVEMENTS.md',
  'SIDEBAR_NOTIFICATION_TEXT_FIX.md',
  'SOLUTION_COLONNES_REJET.md',
  'SOLUTION_FOLDERID_DEFINITIVE.md',
  'SOLUTION_OPTIMALE_POSTES_COMPTABLES.md',
  'SOUMISSION_MANUELLE_DOSSIERS.md',
  'SPACING_OPTIMIZATION_REPORT.md',
  'VISUALIZATION_OPTIMIZATION_REPORT.md'
];

// Dossiers de test à supprimer
const dirsToDelete = [
  // Pages de test
  'src/app/(protected)/test-debug',
  'src/app/(protected)/test-simple', 
  'src/app/(protected)/test-viewer',
  'src/app/font-test',
  'src/app/font-test-final',
  'src/app/font-test-simple',
  'src/app/test-fonts',
  
  // Composants de test
  'src/components/debug',
  'src/components/documents/debug-viewer.tsx',
  'src/components/documents/simple-test.tsx',
  'src/components/documents/test-viewer.tsx',
  'src/components/documents/performance-monitor.tsx',
  'src/components/upload/upload-demo.tsx',
  'src/components/upload/upload-test-page.tsx',
  'src/components/upload/storage-diagnostic.tsx',
  'src/components/simple-font-test.tsx',
  'src/components/test-fonts.tsx',
  'src/components/font-debug.tsx'
];

// API de test à supprimer
const testApis = [
  'src/app/api/admin/demo-actions',
  'src/app/api/debug-cb-users',
  'src/app/api/debug-supabase-env',
  'src/app/api/debug/dossier-status',
  'src/app/api/test-documents-structure',
  'src/app/api/test-insert-document',
  'src/app/api/test-upload-simple'
];

let deletedCount = 0;
let errorCount = 0;

// Fonction pour supprimer un fichier ou dossier
function deleteItem(itemPath, type = 'file') {
  try {
    if (fs.existsSync(itemPath)) {
      if (type === 'dir') {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
      console.log(`✅ Supprimé: ${itemPath}`);
      deletedCount++;
    }
  } catch (error) {
    console.log(`❌ Erreur suppression ${itemPath}: ${error.message}`);
    errorCount++;
  }
}

// Fonction pour chercher et supprimer des fichiers par pattern
function deleteByPattern(directory, pattern) {
  try {
    if (!fs.existsSync(directory)) return;
    
    const files = fs.readdirSync(directory);
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    files.forEach(file => {
      if (regex.test(file)) {
        const fullPath = path.join(directory, file);
        deleteItem(fullPath);
      }
    });
  } catch (error) {
    console.log(`❌ Erreur lors du scan de ${directory}: ${error.message}`);
  }
}

console.log('🗑️  Suppression des fichiers temporaires à la racine:');
filesToDelete.forEach(pattern => {
  if (pattern.includes('*')) {
    deleteByPattern('.', pattern);
  } else {
    deleteItem(pattern);
  }
});

console.log('\n🗑️  Suppression des scripts de test:');
if (fs.existsSync('scripts')) {
  const scriptFiles = fs.readdirSync('scripts');
  scriptFiles.forEach(file => {
    if (file.startsWith('test-') || 
        file.startsWith('debug-') || 
        file.startsWith('check-') ||
        file.startsWith('fix-') ||
        file.startsWith('create-') ||
        file.startsWith('apply-') ||
        file.startsWith('verify-')) {
      deleteItem(path.join('scripts', file));
    }
  });
}

console.log('\n🗑️  Suppression des dossiers et fichiers de test:');
dirsToDelete.forEach(dir => {
  if (dir.endsWith('.tsx') || dir.endsWith('.ts')) {
    deleteItem(dir, 'file');
  } else {
    deleteItem(dir, 'dir');
  }
});

console.log('\n🗑️  Suppression des API de test:');
testApis.forEach(api => {
  deleteItem(api, 'dir');
});

console.log('\n🗑️  Suppression des fichiers PDF temporaires:');
deleteByPattern('.', '*.pdf');

console.log('\n🗑️  Nettoyage des fichiers de backup:');
deleteByPattern('src/app/api/documents', '*backup*');
deleteByPattern('src/app/api/documents', '*simple*');
deleteByPattern('src/app/api/documents', '*test*');

console.log('\n📊 RÉSUMÉ DU NETTOYAGE:');
console.log(`   ✅ Fichiers supprimés: ${deletedCount}`);
console.log(`   ❌ Erreurs: ${errorCount}`);

if (errorCount === 0) {
  console.log('\n🎉 NETTOYAGE TERMINÉ AVEC SUCCÈS !');
  console.log('✨ Tous les fichiers temporaires et de test ont été supprimés.');
} else {
  console.log('\n⚠️  NETTOYAGE TERMINÉ AVEC QUELQUES ERREURS');
  console.log('Vérifiez les erreurs ci-dessus et supprimez manuellement si nécessaire.');
}

console.log('\n🚀 Le projet est maintenant prêt pour la production !');
