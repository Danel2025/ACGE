#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 Configuration de l\'environnement ACGE...')

const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://wodyrsasfqfoqdyrdrfew.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyMjM3NiwiZXhwIjoyMDcwNTk4Mzc2fQ.gZZ3WTWHNLaYBztUXwx4d8uW56CGHlqznOuNvopkka0"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT Secret
JWT_SECRET="your-jwt-secret-key-here"

# Optionnel: URL de base pour les API
NEXT_PUBLIC_API_URL="http://localhost:3000"
`

const envPath = path.join(process.cwd(), '.env.local')

try {
  // Vérifier si le fichier existe déjà
  if (fs.existsSync(envPath)) {
    console.log('⚠️  Le fichier .env.local existe déjà.')
    console.log('   Voulez-vous le remplacer ? (y/N)')
    
    // En mode non-interactif, on ne remplace pas
    if (process.argv.includes('--force')) {
      console.log('   Mode --force détecté, remplacement...')
    } else {
      console.log('   Utilisez --force pour forcer le remplacement')
      process.exit(0)
    }
  }

  // Créer le fichier .env.local
  fs.writeFileSync(envPath, envContent)
  
  console.log('✅ Fichier .env.local créé avec succès !')
  console.log('📝 N\'oubliez pas de :')
  console.log('   1. Remplacer "your-anon-key-here" par votre clé anon Supabase')
  console.log('   2. Remplacer "your-secret-key-here" par une clé secrète')
  console.log('   3. Redémarrer votre serveur de développement')
  console.log('')
  console.log('🚀 Vous pouvez maintenant lancer : npm run dev')

} catch (error) {
  console.error('❌ Erreur lors de la création du fichier .env.local :', error.message)
  process.exit(1)
}
