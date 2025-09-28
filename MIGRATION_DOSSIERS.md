# 📋 Migration : Unification Tables `folders` → `dossiers`

## 🎯 Objectif
Migrer de la table `folders` vers la table `dossiers` avec gestion du workflow BROUILLON → EN_ATTENTE → ...

## ⚠️ Problème Identifié
La table `dossiers` n'a pas la génération automatique d'UUID configurée correctement.

## 🔧 Solutions Implémentées

### 1. **APIs Corrigées**
- ✅ API `/api/dossiers` : Support du filtrage par statut
- ✅ Hook `useFolders` : Appel avec filtre `statut=BROUILLON`
- ✅ API `/api/dossiers/[id]/submit` : Passage BROUILLON → EN_ATTENTE

### 2. **Structure Workflow**
```
BROUILLON (page /folders) → EN_ATTENTE → VALIDÉ_CB → VALIDÉ_ORDONNATEUR → PAYÉ → TERMINÉ
```

## 🗃️ Migration Supabase Requise

### SQL à Exécuter dans Supabase

```sql
-- 1. Vérifier/Ajouter la génération automatique d'UUID pour la colonne id
ALTER TABLE dossiers ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Vérifier/Ajouter les timestamps automatiques
ALTER TABLE dossiers ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE dossiers ALTER COLUMN "updatedAt" SET DEFAULT now();

-- 3. Ajouter un trigger pour updatedAt automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_dossiers_updated_at ON dossiers;
CREATE TRIGGER update_dossiers_updated_at
    BEFORE UPDATE ON dossiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Ajouter contrainte sur le statut
ALTER TABLE dossiers ADD CONSTRAINT check_statut_valid
CHECK (statut IN ('BROUILLON', 'EN_ATTENTE', 'VALIDÉ_CB', 'REJETÉ_CB', 'VALIDÉ_ORDONNATEUR', 'PAYÉ', 'TERMINÉ'));

-- 5. Créer index sur statut pour optimisation
CREATE INDEX IF NOT EXISTS idx_dossiers_statut ON dossiers(statut);
CREATE INDEX IF NOT EXISTS idx_dossiers_created_at ON dossiers("createdAt");
```

## 📱 Fonctionnalités Implémentées

### Page `/folders`
- **Affiche** : Dossiers avec `statut = 'BROUILLON'`
- **Création** : Nouveaux dossiers en statut `BROUILLON`
- **Soumission** : Bouton pour passer de `BROUILLON` → `EN_ATTENTE`

### API Endpoints
```
GET /api/dossiers?statut=BROUILLON  # Récupérer dossiers brouillon
POST /api/dossiers                  # Créer nouveau dossier (BROUILLON)
POST /api/dossiers/[id]/submit      # Soumettre : BROUILLON → EN_ATTENTE
```

## 🚀 Avantages de la Solution

1. **📊 Unification** : Une seule table pour tout le workflow
2. **🔄 Simplicité** : Workflow linéaire et prévisible
3. **📈 Performance** : Moins de jointures, requêtes optimisées
4. **🎮 Cohérence** : Même structure de données partout
5. **🔍 Traçabilité** : Historique complet dans une table

## ⚡ Actions Immédiates Requises

1. **Exécuter la migration SQL** dans Supabase
2. **Tester la création** de dossiers
3. **Vérifier le filtrage** par statut
4. **Tester la soumission** BROUILLON → EN_ATTENTE

## 🧪 Tests de Validation

```bash
# 1. Test création dossier
curl -X POST http://localhost:3001/api/dossiers \
  -H "Content-Type: application/json" \
  -d '{"numeroDossier": "TEST-001", "numeroNature": "NAT-001", "objetOperation": "Test", "beneficiaire": "Test"}'

# 2. Test récupération dossiers BROUILLON
curl -X GET http://localhost:3001/api/dossiers?statut=BROUILLON

# 3. Test soumission dossier
curl -X POST http://localhost:3001/api/dossiers/[ID]/submit
```

## 📋 Checklist Migration

- [ ] Migration SQL exécutée
- [ ] Test création dossier BROUILLON
- [ ] Test affichage page /folders
- [ ] Test soumission dossier
- [ ] Validation workflow complet
- [ ] Tests de performance

## 📞 Support Technique

En cas de problème :
1. Vérifier les logs Supabase
2. Tester les requêtes SQL manuellement
3. Vérifier les contraintes de clés étrangères

---
*Migration créée le : 26/09/2025*
*Statut : ⚠️ En attente de migration SQL Supabase*