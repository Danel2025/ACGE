# 🚀 Configuration rapide ACGE

## Configuration automatique

Pour configurer automatiquement l'environnement avec la clé de service role :

```bash
# Configuration automatique
npm run setup:env

# Ou forcer le remplacement si le fichier existe déjà
npm run setup:env:force
```

## Configuration manuelle

Si vous préférez configurer manuellement, créez un fichier `.env.local` à la racine du projet :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://wodyrsasfqfoqdyrdrfew.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHlyc2FzZnFmb3FkeWRyZmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyMjM3NiwiZXhwIjoyMDcwNTk4Mzc2fQ.gZZ3WTWHNLaYBztUXwx4d8uW56CGHlqznOuNvopkka0"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT Secret
JWT_SECRET="your-jwt-secret-key-here"
```

## Étapes suivantes

1. **Récupérez votre clé anon Supabase** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Allez dans Settings > API
   - Copiez la clé "anon public"

2. **Remplacez dans `.env.local`** :
   - `your-anon-key-here` par votre clé anon
   - `your-secret-key-here` par une clé secrète (générez avec `openssl rand -base64 32`)

3. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

## Vérification

Une fois configuré, vous devriez voir :
- ✅ Aucune erreur dans la console
- ✅ Les notifications fonctionnent
- ✅ Toutes les fonctionnalités sont disponibles

## Problèmes courants

- **Erreur de clé** : Vérifiez que la clé anon est correcte
- **Notifications ne fonctionnent pas** : Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien définie
- **Erreur de connexion** : Vérifiez que l'URL Supabase est correcte
