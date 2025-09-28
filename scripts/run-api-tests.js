#!/usr/bin/env node

/**
 * Script pour exécuter les tests API avec démarrage automatique du serveur
 * Lance le serveur Next.js, exécute les tests, puis arrête le serveur
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');

console.log('🚀 LANCEMENT DES TESTS API ACGE');
console.log('==============================\n');

let serverProcess = null;
let isServerReady = false;

// Fonction pour vérifier si le serveur est prêt
async function checkServerReady(url = 'http://localhost:3000') {
  try {
    const response = await fetch(`${url}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Fonction pour attendre que le serveur soit prêt
async function waitForServer(maxAttempts = 30) {
  console.log('⏳ Attente du démarrage du serveur...');
  
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkServerReady()) {
      console.log('✅ Serveur prêt !');
      return true;
    }
    
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n❌ Timeout - Le serveur n\'a pas démarré dans les temps');
  return false;
}

// Fonction pour démarrer le serveur Next.js
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Démarrage du serveur Next.js...');
    
    serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started server on')) {
        isServerReady = true;
        resolve();
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`Erreur serveur: ${data}`);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Serveur arrêté avec le code ${code}`);
    });
    
    // Timeout de 60 secondes pour le démarrage
    setTimeout(() => {
      if (!isServerReady) {
        reject(new Error('Timeout - Serveur non démarré'));
      }
    }, 60000);
  });
}

// Fonction pour arrêter le serveur
function stopServer() {
  if (serverProcess) {
    console.log('\n🔄 Arrêt du serveur...');
    serverProcess.kill('SIGTERM');
    
    // Force kill si nécessaire
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

// Fonction pour exécuter les tests
function runTests(testType = 'essential') {
  return new Promise((resolve, reject) => {
    const scriptName = testType === 'all' ? 'test-all-apis.js' : 'test-essential-apis.js';
    
    console.log(`\n🧪 Exécution des tests ${testType}...`);
    
    const testProcess = spawn('node', [`scripts/${scriptName}`], {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests échoués avec le code ${code}`));
      }
    });
  });
}

// Fonction principale
async function main() {
  try {
    // Vérifier si le serveur est déjà en cours d'exécution
    const serverAlreadyRunning = await checkServerReady();
    
    if (serverAlreadyRunning) {
      console.log('✅ Serveur déjà en cours d\'exécution');
    } else {
      // Démarrer le serveur
      await startServer();
      
      // Attendre que le serveur soit prêt
      const ready = await waitForServer();
      if (!ready) {
        throw new Error('Impossible de démarrer le serveur');
      }
    }
    
    // Demander le type de test
    const args = process.argv.slice(2);
    const testType = args.includes('--all') ? 'all' : 'essential';
    
    // Exécuter les tests
    await runTests(testType);
    
    console.log('\n🎉 Tests terminés avec succès !');
    
  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
    process.exit(1);
  } finally {
    // Arrêter le serveur seulement si nous l'avons démarré
    if (!await checkServerReady() && serverProcess) {
      stopServer();
    }
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt demandé...');
  stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopServer();
  process.exit(0);
});

// Afficher l'aide
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node scripts/run-api-tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --all      Exécuter tous les tests API (complet)');
  console.log('  --help     Afficher cette aide');
  console.log('');
  console.log('Par défaut, seuls les tests essentiels sont exécutés.');
  process.exit(0);
}

// Lancer le script principal
main();
