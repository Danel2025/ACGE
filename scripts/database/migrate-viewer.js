#!/usr/bin/env node

/**
 * Script de migration du visualiseur de documents
 * 
 * Ce script aide à migrer de l'ancien DocumentPreviewModal vers le nouveau système
 */

const fs = require('fs');
const path = require('path');

const OLD_IMPORT = "import { DocumentPreviewModal } from '@/components/documents/document-preview-modal'";
const NEW_IMPORT = "import { DocumentPreviewModal } from '@/components/documents'";

const filesToUpdate = [
  'src/app/(protected)/documents/page.tsx',
  'src/app/(protected)/folders/page.tsx',
  'src/app/(protected)/cb-dashboard/page.tsx',
  'src/app/(protected)/ordonnateur-dashboard/dossier/[id]/page.tsx',
  'src/app/(protected)/cb-rejected/page.tsx',
  'src/app/(protected)/secretaire-rejected/page.tsx',
  'src/components/pages/documents-page-optimized.tsx',
  'src/components/ui/dossier-content-modal.tsx'
];

function updateFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Fichier non trouvé: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes(OLD_IMPORT)) {
      const updatedContent = content.replace(OLD_IMPORT, NEW_IMPORT);
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      console.log(`✅ Mis à jour: ${filePath}`);
      return true;
    } else if (content.includes(NEW_IMPORT)) {
      console.log(`✅ Déjà migré: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  Aucun import à migrer dans: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Début de la migration du visualiseur de documents...\n');
  
  let successCount = 0;
  let totalCount = filesToUpdate.length;
  
  filesToUpdate.forEach(filePath => {
    if (updateFile(filePath)) {
      successCount++;
    }
  });
  
  console.log(`\n📊 Résumé de la migration:`);
  console.log(`   ✅ Fichiers mis à jour: ${successCount}/${totalCount}`);
  console.log(`   ❌ Erreurs: ${totalCount - successCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Testez l\'application pour vérifier que tout fonctionne');
    console.log('   2. Visitez /test-viewer pour comparer les visualiseurs');
    console.log('   3. Supprimez l\'ancien fichier document-preview-modal.tsx si tout est OK');
  } else {
    console.log('\n⚠️  Migration partiellement terminée. Vérifiez les erreurs ci-dessus.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, OLD_IMPORT, NEW_IMPORT };
