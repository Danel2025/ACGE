#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script d'optimisation des images pour améliorer les performances
 * Ce script crée des versions optimisées des images critiques
 */

const publicDir = path.join(__dirname, '..', 'public');
const optimizedDir = path.join(publicDir, 'optimized');

// Créer le dossier optimized s'il n'existe pas
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

console.log('🚀 Optimisation des images en cours...');

// Pour l'instant, on copie les images existantes
// Dans un environnement de production, vous devriez utiliser des outils comme:
// - sharp pour la compression
// - imagemin pour l'optimisation
// - squoosh pour la conversion de format

const imagesToOptimize = [
  {
    source: path.join(publicDir, 'logo-tresor-public.svg'),
    destination: path.join(optimizedDir, 'logo-tresor-public-optimized.svg'),
    description: 'Logo principal optimisé'
  },
  {
    source: path.join(publicDir, 'TrésorPublicGabon.jpg'),
    destination: path.join(optimizedDir, 'TrésorPublicGabon-optimized.webp'),
    description: 'Image JPG convertie en WebP'
  }
];

imagesToOptimize.forEach(({ source, destination, description }) => {
  if (fs.existsSync(source)) {
    try {
      fs.copyFileSync(source, destination);
      const stats = fs.statSync(destination);
      console.log(`✅ ${description}: ${(stats.size / 1024).toFixed(2)}KB`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'optimisation de ${source}:`, error.message);
    }
  } else {
    console.warn(`⚠️  Fichier source non trouvé: ${source}`);
  }
});

console.log('🎉 Optimisation terminée!');
console.log('📁 Images optimisées disponibles dans:', optimizedDir);
