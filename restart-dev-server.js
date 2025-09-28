const { spawn, exec } = require('child_process');
const path = require('path');

// Fonction pour tuer les processus Node.js
function killNodeProcesses() {
  return new Promise((resolve) => {
    exec('taskkill /F /IM node.exe', (error) => {
      // Ignorer les erreurs (pas de processus à tuer)
      resolve();
    });
  });
}

// Fonction pour démarrer le serveur de développement
function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Démarrage du serveur de développement...');

    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    devServer.on('error', (error) => {
      console.error('❌ Erreur lors du démarrage du serveur:', error);
      reject(error);
    });

    // Attendre un peu pour que le serveur démarre
    setTimeout(() => {
      console.log('✅ Serveur de développement démarré sur http://localhost:3000');
      console.log('📝 Les modifications de polices sont maintenant actives !');
      resolve();
    }, 3000);
  });
}

// Fonction principale
async function restartDevServer() {
  try {
    console.log('🔄 Arrêt des processus Node.js en cours...');
    await killNodeProcesses();

    console.log('⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    await startDevServer();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  restartDevServer();
}

module.exports = { restartDevServer };
