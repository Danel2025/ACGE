# Améliorations du Système de Génération de Quitus - ACGE

Ce document décrit les améliorations majeures apportées au système de génération de quitus.

## 📋 Résumé des améliorations

Les étapes 2 à 5 ont été implémentées avec succès :

### ✅ 2. Traçabilité et sécurité
### ✅ 3. Format et présentation
### ✅ 4. Fonctionnalités supplémentaires
### ✅ 5. Intégration avec le workflow

---

## 🔐 2. Traçabilité et Sécurité

### Hash de vérification
- **Algorithme**: SHA-256
- **Longueur**: 16 caractères
- **Usage**: Garantit l'intégrité du document
- **Vérification**: Via API `/api/verify-quitus/[numeroQuitus]`

### QR Code
- **Technologie**: QRCode.js avec niveau de correction H
- **Contenu**: URL de vérification avec hash
- **Format**: Data URL (base64)
- **Taille**: 200x200 pixels

### Numéro unique
- **Format**: `QUITUS-{numeroDossier}-{année}-{random}-{timestamp}`
- **Exemple**: `QUITUS-DOSS-ACGE-2025-10-01-adea3143-2025-347-1743523847000`

### Filigrane
- **Types**: ORIGINAL / COPIE
- **Affichage**: Sur le document PDF et l'affichage web

### Page de vérification
- **URL**: `/verify-quitus/[numeroQuitus]?hash={hash}`
- **Fonctionnalités**:
  - Vérification de l'authenticité
  - Affichage des informations du quitus
  - Traçabilité des vérifications (IP, date, résultat)

**Fichiers créés/modifiés**:
- `src/lib/quitus-security.ts` - Fonctions de sécurité
- `src/app/verify-quitus/[numeroQuitus]/page.tsx` - Page de vérification
- `src/app/api/verify-quitus/[numeroQuitus]/route.ts` - API de vérification

---

## 🎨 3. Format et Présentation

### Section de sécurité dans le quitus
- **Hash de vérification**: Affiché en monospace
- **QR Code**: Intégré dans le document
- **Instructions**: Guide pour la vérification
- **Document type**: Badge ORIGINAL/COPIE

### Améliorations visuelles
- Section sécurité avec bordure supérieure
- Layout responsive (flex)
- QR code cliquable et scannable
- Hash lisible et copiable

**Fichiers modifiés**:
- `src/components/ac/quitus-display.tsx` - Affichage amélioré

---

## 📧 4. Fonctionnalités Supplémentaires

### Envoi automatique par email

#### Configuration
Variables d'environnement nécessaires:
```env
EMAIL_PROVIDER=resend  # ou sendgrid
EMAIL_FROM=noreply@acge.ga
RESEND_API_KEY=your_key  # si provider = resend
SENDGRID_API_KEY=your_key  # si provider = sendgrid
```

#### Providers supportés
1. **Resend** (recommandé)
   - Simple et moderne
   - API RESTful
   - Support pièces jointes

2. **SendGrid**
   - Scalable
   - Analytics avancés
   - Support pièces jointes

#### Template email
- Design HTML responsive
- Informations du quitus
- Lien de vérification
- Instructions claires
- Branding ACGE

#### Destinataires
- Secrétaire créateur du dossier
- Notifications in-app simultanées

**Fichiers créés**:
- `src/lib/email-service.ts` - Service d'envoi d'emails

### Archivage automatique sécurisé

#### Stockage
- **Platform**: Supabase Storage
- **Bucket**: `quitus-archives` (privé)
- **Structure**: `{année}/{mois}/{numeroQuitus}/`

#### Fichiers archivés
1. `data.json` - Données complètes du quitus
2. `document.pdf` - PDF généré (optionnel)

#### Organisation
```
quitus-archives/
├── 2025/
│   ├── 01/
│   │   ├── QUITUS-xxx/
│   │   │   ├── data.json
│   │   │   └── document.pdf
│   │   └── QUITUS-yyy/
│   │       ├── data.json
│   │       └── document.pdf
│   └── 02/
│       └── ...
```

#### Métadonnées
Table: `quitus_archives`
- `quitus_id`: Numéro unique
- `archive_path`: Chemin dans storage
- `archive_date`: Date d'archivage
- `file_size_bytes`: Taille des fichiers
- `has_pdf`: Présence du PDF
- `metadata`: JSON avec année, mois, etc.

#### Fonctionnalités
1. **Archivage**: `archiveQuitus()`
2. **Récupération**: `retrieveArchivedQuitus()`
3. **Liste**: `listArchivedQuitus(year?, month?)`
4. **Suppression**: `deleteArchivedQuitus()`

#### Sécurité
- Bucket privé (authentification requise)
- URLs signées (expiration 1h)
- Limite de taille: 10MB
- Types MIME autorisés: PDF, JSON

**Fichiers créés**:
- `src/lib/quitus-archive.ts` - Service d'archivage

---

## 🔄 5. Intégration avec le Workflow

### Mise à jour automatique du statut

#### Changement de statut
- **De**: `VALIDÉ_DÉFINITIVEMENT`
- **À**: `TERMINÉ`
- **Trigger**: Génération du quitus

#### Nouvelles colonnes dossier
- `quitus_numero`: Référence au quitus
- `termine_le`: Date de clôture

### Notifications automatiques

#### Système de notifications
Table: `notifications`

#### Types de notifications
1. **QUITUS_GENERE**
   - Titre: "Quitus généré"
   - Message: Détails du quitus
   - Métadonnées: numeroQuitus, verificationUrl

#### Destinataires
- Secrétaire créateur
- (Extensible: CB, Ordonnateur, AC)

#### Contenu notification
```json
{
  "user_id": "uuid",
  "type": "QUITUS_GENERE",
  "title": "Quitus généré",
  "message": "Le quitus XXX a été généré",
  "dossier_id": "uuid",
  "metadata": {
    "numeroQuitus": "QUITUS-...",
    "verificationUrl": "https://..."
  }
}
```

### Traçabilité des vérifications

#### Table de traçabilité
Table: `quitus_verifications`
- `quitus_id`: Référence
- `verifie_le`: Date/heure
- `resultat`: AUTHENTIQUE / NON_AUTHENTIQUE
- `ip_address`: IP du vérificateur
- `user_agent`: Navigateur

#### Usage
- Audit trail complet
- Détection de tentatives frauduleuses
- Statistiques de consultation

**Fichiers modifiés**:
- `src/app/api/dossiers/[id]/generate-quitus/route.ts` - Intégration complète

---

## 📦 Installation des dépendances

```bash
npm install qrcode @types/qrcode
```

---

## 🗄️ Migrations base de données nécessaires

### Tables à créer

#### 1. quitus_archives
```sql
CREATE TABLE quitus_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quitus_id TEXT NOT NULL REFERENCES quitus(id),
  archive_path TEXT NOT NULL,
  archive_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_size_bytes BIGINT DEFAULT 0,
  has_pdf BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quitus_archives_quitus_id ON quitus_archives(quitus_id);
CREATE INDEX idx_quitus_archives_date ON quitus_archives(archive_date);
```

#### 2. quitus_verifications
```sql
CREATE TABLE quitus_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quitus_id TEXT NOT NULL,
  verifie_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resultat TEXT NOT NULL CHECK (resultat IN ('AUTHENTIQUE', 'NON_AUTHENTIQUE')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quitus_verifications_quitus_id ON quitus_verifications(quitus_id);
CREATE INDEX idx_quitus_verifications_date ON quitus_verifications(verifie_le);
```

#### 3. Colonnes supplémentaires dossiers
```sql
ALTER TABLE dossiers
  ADD COLUMN IF NOT EXISTS quitus_numero TEXT,
  ADD COLUMN IF NOT EXISTS termine_le TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_dossiers_quitus_numero ON dossiers(quitus_numero);
```

---

## 🚀 Utilisation

### Génération d'un quitus
```typescript
// POST /api/dossiers/{id}/generate-quitus
const response = await fetch(`/api/dossiers/${dossierId}/generate-quitus`, {
  method: 'POST',
  credentials: 'include'
})

const { quitus, success } = await response.json()
```

### Vérification d'un quitus
```typescript
// GET /api/verify-quitus/{numeroQuitus}?hash={hash}
const response = await fetch(`/api/verify-quitus/${numeroQuitus}?hash=${hash}`)

const { valid, quitus } = await response.json()
```

### Récupération d'une archive
```typescript
import { retrieveArchivedQuitus } from '@/lib/quitus-archive'

const result = await retrieveArchivedQuitus(numeroQuitus)
if (result.success) {
  console.log(result.data.quitus)
}
```

---

## 📊 Statistiques et monitoring

### Métriques disponibles
1. Nombre de quitus générés
2. Taux de vérification
3. Temps moyen de génération
4. Taille moyenne des archives
5. Tentatives de vérification échouées

### Queries utiles

#### Quitus par mois
```sql
SELECT
  DATE_TRUNC('month', genere_le) as mois,
  COUNT(*) as nombre_quitus
FROM quitus
GROUP BY mois
ORDER BY mois DESC;
```

#### Vérifications par résultat
```sql
SELECT
  resultat,
  COUNT(*) as nombre
FROM quitus_verifications
GROUP BY resultat;
```

#### Archives par année
```sql
SELECT
  metadata->>'year' as annee,
  COUNT(*) as nombre_archives,
  SUM(file_size_bytes) as taille_totale
FROM quitus_archives
GROUP BY annee
ORDER BY annee DESC;
```

---

## 🔒 Sécurité

### Bonnes pratiques implémentées
1. ✅ Hash de vérification cryptographique (SHA-256)
2. ✅ QR codes avec URLs signées
3. ✅ Archivage dans bucket privé
4. ✅ Traçabilité complète des accès
5. ✅ URLs signées avec expiration
6. ✅ Validation des entrées
7. ✅ Gestion des erreurs sécurisée

### Recommandations supplémentaires
- [ ] Chiffrement des archives sensibles
- [ ] Rotation des clés de signature
- [ ] Audit régulier des vérifications échouées
- [ ] Politique de rétention des archives
- [ ] Sauvegarde externe des archives critiques

---

## 🐛 Troubleshooting

### Email non envoyé
- Vérifier `EMAIL_PROVIDER` dans .env
- Vérifier la clé API du provider
- Vérifier `EMAIL_FROM` (domaine vérifié)

### Archive échoue
- Vérifier que le bucket existe
- Vérifier les permissions Supabase
- Vérifier la taille du fichier (< 10MB)

### QR Code ne s'affiche pas
- Vérifier l'installation de `qrcode`
- Vérifier que `NEXT_PUBLIC_APP_URL` est défini
- Vérifier les logs de génération

---

## 📝 Notes importantes

1. **Performance**: L'archivage est asynchrone et ne bloque pas la génération
2. **Emails**: Configuré mais optionnel (fallback gracieux)
3. **QR Codes**: Générés en base64 pour inclusion directe
4. **Sécurité**: Tous les accès aux archives nécessitent authentification
5. **Scalabilité**: Structure organisée par date pour performance

---

## 🎯 Prochaines étapes suggérées (non implémentées)

1. **Étape 1**: Informations supplémentaires (montant en lettres, mode paiement)
2. **Interface d'administration**: Gestion des archives
3. **Statistiques avancées**: Dashboard de métriques
4. **Export bulk**: Export de multiples quitus
5. **API publique**: Vérification pour systèmes tiers
6. **Signatures électroniques**: Intégration DocuSign/similar
7. **Blockchain**: Ancrage des hashs pour preuve horodatée
