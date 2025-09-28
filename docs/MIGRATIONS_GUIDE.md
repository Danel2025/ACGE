# 📖 Guide des Migrations Prisma - ACGE

## 🚀 Commandes essentielles

### Développement quotidien
```bash
# 1. Après modification du schema.prisma
npx prisma migrate dev --name "description-du-changement"

# 2. Pour synchroniser rapidement (development seulement)
npx prisma db push

# 3. Générer le client Prisma après changements
npx prisma generate
```

### Production
```bash
# Appliquer les migrations en production
npx prisma migrate deploy
```

## 🔧 Scripts rapides disponibles

- `scripts/quick-setup.bat` - Configuration complète
- `scripts/health-check.bat` - Vérification santé
- `scripts/repair-database.bat` - Réparation automatique
- `scripts/quick-migrate.bat` - Migration rapide
- `scripts/reset-database.bat` - Reset sécurisé (dev seulement)

## ⚠️ Bonnes pratiques

1. **Toujours nommer vos migrations** :
   ```bash
   npx prisma migrate dev --name "add-comments-table"
   npx prisma migrate dev --name "update-user-roles"
   ```

2. **Tester avant déploiement** :
   - Testez vos migrations sur une copie de prod
   - Vérifiez que toutes les données sont préservées

3. **En cas d'erreur de schéma** :
   ```bash
   # Option 1: Reset complet (développement)
   npx prisma migrate reset

   # Option 2: Push forcé (développement)
   npx prisma db push --force-reset
   ```

## 🚫 À éviter

- ❌ Modifier directement la base de données
- ❌ Utiliser `db push` en production
- ❌ Supprimer des fichiers de migration
- ❌ Modifier des migrations déjà appliquées

## 🆘 En cas de problème

1. Vérifiez que Docker est démarré
2. Vérifiez votre .env.local
3. Relancez `npx prisma generate`
4. Utilisez `scripts/repair-database.bat`
5. En dernier recours : `npx prisma migrate reset`

## 🔍 Diagnostic

### Vérification rapide
```bash
# Statut des migrations
npx prisma migrate status

# Vérification connexion
npx prisma db pull

# Santé complète
npx tsx scripts/check-database-health.ts
```

### Erreurs communes

| Erreur | Solution |
|--------|----------|
| "Table does not exist" | `npx prisma db push` |
| "Environment variable not found" | Vérifier `.env.local` |
| "Can't reach database" | Démarrer Docker |
| "Migration conflict" | `npx prisma migrate reset` |
