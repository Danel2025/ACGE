/**
 * Script de mise à jour automatique des polices
 * Applique les nouvelles classes de polices dans tous les composants
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration des remplacements
const replacements = [
  // Titres principaux (h1, h2, h3, etc.)
  {
    pattern: /(<h[1-6][^>]*className="[^"]*?)font-semibold([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-semibold$2'
  },
  {
    pattern: /(<h[1-6][^>]*className="[^"]*?)font-bold([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-bold$2'
  },
  {
    pattern: /(<h[1-6][^>]*className="[^"]*?)font-medium([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-medium$2'
  },

  // DialogTitle et titres de modales
  {
    pattern: /(<DialogTitle[^>]*className="[^"]*?)font-semibold([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-semibold$2'
  },
  {
    pattern: /(<DialogTitle[^>]*className="[^"]*?)font-bold([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-bold$2'
  },
  {
    pattern: /(<DialogTitle[^>]*className="[^"]*?)font-medium([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-medium$2'
  },

  // Titres de sections et labels
  {
    pattern: /(className="[^"]*?text-lg[^"]*?font-semibold[^"]*?")/g,
    replacement: (match) => match.replace('font-semibold', 'font-title-semibold')
  },
  {
    pattern: /(className="[^"]*?text-xl[^"]*?font-semibold[^"]*?")/g,
    replacement: (match) => match.replace('font-semibold', 'font-title-semibold')
  },
  {
    pattern: /(className="[^"]*?text-2xl[^"]*?font-semibold[^"]*?")/g,
    replacement: (match) => match.replace('font-semibold', 'font-title-semibold')
  },

  // Labels et textes d'étiquettes
  {
    pattern: /(<Label[^>]*className="[^"]*?)font-semibold([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-semibold$2'
  },
  {
    pattern: /(<Label[^>]*className="[^"]*?)font-medium([^"]*?"[^>]*>)/g,
    replacement: '$1font-title-medium$2'
  },

  // Classes font-outfit à remplacer par font-title
  {
    pattern: /font-outfit-bold/g,
    replacement: 'font-title-bold'
  },
  {
    pattern: /font-outfit-semibold/g,
    replacement: 'font-title-semibold'
  },
  {
    pattern: /font-outfit-medium/g,
    replacement: 'font-title-medium'
  },
  {
    pattern: /font-outfit/g,
    replacement: 'font-title'
  }
];

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let originalContent = content;

    replacements.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      } else {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Mis à jour: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Erreur avec ${filePath}:`, error.message);
    return false;
  }
}

// Fonction principale
function updateFontsInProject() {
  console.log('🚀 Mise à jour des polices dans le projet...\n');

  // Trouver tous les fichiers TypeScript/React (approche compatible Windows)
  try {
    const srcPath = path.join(process.cwd(), 'src');
    const files = [];

    function findFiles(dir) {
      const items = fs.readdirSync(dir);

      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.includes('node_modules') && item !== '.next') {
          findFiles(fullPath);
        } else if (stat.isFile() && /\.(tsx|ts|jsx|js)$/.test(item)) {
          files.push(fullPath);
        }
      });
    }

    findFiles(srcPath);
    console.log(`📁 Traitement de ${files.length} fichiers...\n`);

    let updatedCount = 0;
    let processedCount = 0;

    files.forEach(file => {
      processedCount++;
      if (processFile(file)) {
        updatedCount++;
      }
    });

    console.log(`\n✅ Mise à jour terminée!`);
    console.log(`📊 ${updatedCount}/${processedCount} fichiers modifiés`);
    console.log(`🎯 Les titres utilisent maintenant Outfit, le texte utilise Helvetica Neue`);

  } catch (error) {
    console.error('Erreur lors de la recherche des fichiers:', error.message);
  }
}

// Exécuter le script
if (require.main === module) {
  updateFontsInProject();
}

module.exports = { updateFontsInProject };
