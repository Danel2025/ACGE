#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage du cache Next.js...');

try {
  // Supprimer le dossier .next
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Dossier .next supprimé');
  }

  // Supprimer le dossier node_modules/.cache
  const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✅ Cache node_modules supprimé');
  }

  // Redémarrer le serveur de développement
  console.log('🚀 Redémarrage du serveur de développement...');
  execSync('npm run dev', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Erreur lors du nettoyage:', error.message);
  process.exit(1);
}
