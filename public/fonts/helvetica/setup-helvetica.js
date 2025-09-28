/**
 * Script pour configurer les polices Helvetica
 * Placez vos fichiers Helvetica (.ttf, .woff, .woff2) dans ce dossier
 * Le script les importera automatiquement dans le CSS
 */

const fs = require('fs');
const path = require('path');

const helveticaDir = path.join(__dirname);

// Fonction pour détecter les fichiers de polices Helvetica
function findHelveticaFiles() {
  const extensions = ['.ttf', '.woff', '.woff2', '.otf'];
  const files = [];

  try {
    const items = fs.readdirSync(helveticaDir);

    items.forEach(item => {
      const ext = path.extname(item).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(item);
      }
    });
  } catch (error) {
    console.log('Dossier helvetica non trouvé ou vide');
  }

  return files;
}

// Fonction pour générer le CSS d'importation
function generateFontCSS(files) {
  if (files.length === 0) {
    return `/* Aucun fichier Helvetica trouvé dans public/fonts/helvetica/ */
/* Placez vos fichiers .ttf, .woff, .woff2 ici pour les importer automatiquement */`;
  }

  let css = `/* Import automatique des polices Helvetica */\n\n`;

  files.forEach(file => {
    const fontName = path.basename(file, path.extname(file));
    const fontPath = `/fonts/helvetica/${file}`;

    // Déterminer le poids et le style selon le nom du fichier
    let weight = '400';
    let style = 'normal';

    if (fontName.toLowerCase().includes('bold')) {
      weight = '700';
    } else if (fontName.toLowerCase().includes('light')) {
      weight = '300';
    } else if (fontName.toLowerCase().includes('medium')) {
      weight = '500';
    }

    if (fontName.toLowerCase().includes('italic') || fontName.toLowerCase().includes('oblique')) {
      style = 'italic';
    }

    css += `@font-face {
  font-family: 'Helvetica';
  src: url('${fontPath}') format('${getFontFormat(path.extname(file))}');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}

`;
  });

  return css;
}

// Fonction pour obtenir le format de police
function getFontFormat(ext) {
  const formats = {
    '.ttf': 'truetype',
    '.otf': 'opentype',
    '.woff': 'woff',
    '.woff2': 'woff2'
  };
  return formats[ext] || 'truetype';
}

// Fonction principale
function setupHelvetica() {
  console.log('🔍 Recherche des fichiers Helvetica...');

  const files = findHelveticaFiles();
  console.log(`📁 Fichiers trouvés: ${files.length}`);

  if (files.length > 0) {
    files.forEach(file => {
      console.log(`  ✓ ${file}`);
    });

    const css = generateFontCSS(files);
    const cssPath = path.join(helveticaDir, 'helvetica-fonts.css');

    try {
      fs.writeFileSync(cssPath, css);
      console.log(`✅ CSS généré: ${cssPath}`);
      console.log('📝 Ajoutez cette ligne à votre globals.css:');
      console.log(`@import "/fonts/helvetica/helvetica-fonts.css";`);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du CSS:', error);
    }
  } else {
    console.log('⚠️  Aucun fichier de police trouvé');
    console.log('📂 Placez vos fichiers Helvetica (.ttf, .woff, .woff2) dans:');
    console.log('   public/fonts/helvetica/');
    console.log('💡 Puis relancez ce script');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupHelvetica();
}

module.exports = { setupHelvetica, findHelveticaFiles, generateFontCSS };
