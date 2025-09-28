-- =====================================================
-- MIGRATION: Création des tables pour les vérifications ordonnateur
-- =====================================================
-- Date: 2025-01-31
-- Description: Crée les tables pour gérer les vérifications spécifiques 
--              que l'ordonnateur doit effectuer avant d'ordonnancer un dossier

-- ==============================================
-- 1. TABLE DES CATÉGORIES DE VÉRIFICATIONS ORDONNATEUR
-- ==============================================

CREATE TABLE IF NOT EXISTS categories_verifications_ordonnateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    description TEXT,
    icone TEXT, -- Icône pour l'interface utilisateur
    couleur TEXT, -- Couleur pour l'interface utilisateur
    ordre INTEGER NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. TABLE DES TYPES DE VÉRIFICATIONS ORDONNATEUR
-- ==============================================

CREATE TABLE IF NOT EXISTS verifications_ordonnateur_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie_id UUID NOT NULL REFERENCES categories_verifications_ordonnateur(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    question TEXT NOT NULL, -- Question à poser à l'ordonnateur
    aide TEXT, -- Texte d'aide pour guider l'ordonnateur
    obligatoire BOOLEAN DEFAULT true,
    ordre INTEGER NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. TABLE DES VÉRIFICATIONS EFFECTUÉES PAR DOSSIER
-- ==============================================

CREATE TABLE IF NOT EXISTS validations_verifications_ordonnateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    verification_id UUID NOT NULL REFERENCES verifications_ordonnateur_types(id) ON DELETE CASCADE,
    valide BOOLEAN NOT NULL,
    commentaire TEXT,
    piece_justificative_reference TEXT, -- Référence à la pièce justificative liée
    valide_par TEXT NOT NULL REFERENCES users(id),
    valide_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. TABLE DE SYNTHÈSE DES VALIDATIONS PAR DOSSIER
-- ==============================================

CREATE TABLE IF NOT EXISTS syntheses_verifications_ordonnateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    total_verifications INTEGER NOT NULL DEFAULT 0,
    verifications_validees INTEGER NOT NULL DEFAULT 0,
    verifications_rejetees INTEGER NOT NULL DEFAULT 0,
    commentaire_general TEXT,
    statut TEXT NOT NULL CHECK (statut IN ('EN_COURS', 'VALIDÉ', 'REJETÉ')) DEFAULT 'EN_COURS',
    valide_par TEXT NOT NULL REFERENCES users(id),
    valide_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dossier_id) -- Un seul enregistrement de synthèse par dossier
);

-- ==============================================
-- 5. INDEX POUR OPTIMISER LES REQUÊTES
-- ==============================================

-- Index sur les catégories
CREATE INDEX IF NOT EXISTS idx_categories_verifications_ordonnateur_actif 
ON categories_verifications_ordonnateur(actif);

CREATE INDEX IF NOT EXISTS idx_categories_verifications_ordonnateur_ordre 
ON categories_verifications_ordonnateur(ordre);

-- Index sur les types de vérifications
CREATE INDEX IF NOT EXISTS idx_verifications_ordonnateur_types_categorie 
ON verifications_ordonnateur_types(categorie_id);

CREATE INDEX IF NOT EXISTS idx_verifications_ordonnateur_types_actif 
ON verifications_ordonnateur_types(actif);

CREATE INDEX IF NOT EXISTS idx_verifications_ordonnateur_types_obligatoire 
ON verifications_ordonnateur_types(obligatoire);

-- Index sur les validations
CREATE INDEX IF NOT EXISTS idx_validations_verifications_ordonnateur_dossier 
ON validations_verifications_ordonnateur(dossier_id);

CREATE INDEX IF NOT EXISTS idx_validations_verifications_ordonnateur_verification 
ON validations_verifications_ordonnateur(verification_id);

CREATE INDEX IF NOT EXISTS idx_validations_verifications_ordonnateur_valide_par 
ON validations_verifications_ordonnateur(valide_par);

CREATE INDEX IF NOT EXISTS idx_validations_verifications_ordonnateur_valide 
ON validations_verifications_ordonnateur(valide);

-- Index sur les synthèses
CREATE INDEX IF NOT EXISTS idx_syntheses_verifications_ordonnateur_dossier 
ON syntheses_verifications_ordonnateur(dossier_id);

CREATE INDEX IF NOT EXISTS idx_syntheses_verifications_ordonnateur_statut 
ON syntheses_verifications_ordonnateur(statut);

CREATE INDEX IF NOT EXISTS idx_syntheses_verifications_ordonnateur_valide_par 
ON syntheses_verifications_ordonnateur(valide_par);

-- ==============================================
-- 6. TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ==============================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_verifications_ordonnateur()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
CREATE TRIGGER trigger_categories_verifications_ordonnateur_updated_at
    BEFORE UPDATE ON categories_verifications_ordonnateur
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_verifications_ordonnateur();

CREATE TRIGGER trigger_verifications_ordonnateur_types_updated_at
    BEFORE UPDATE ON verifications_ordonnateur_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_verifications_ordonnateur();

CREATE TRIGGER trigger_validations_verifications_ordonnateur_updated_at
    BEFORE UPDATE ON validations_verifications_ordonnateur
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_verifications_ordonnateur();

CREATE TRIGGER trigger_syntheses_verifications_ordonnateur_updated_at
    BEFORE UPDATE ON syntheses_verifications_ordonnateur
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_verifications_ordonnateur();

-- ==============================================
-- 7. RLS (ROW LEVEL SECURITY)
-- ==============================================

-- Activer RLS sur toutes les tables
ALTER TABLE categories_verifications_ordonnateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications_ordonnateur_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations_verifications_ordonnateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE syntheses_verifications_ordonnateur ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 8. POLITIQUES RLS
-- ==============================================

-- Politiques pour categories_verifications_ordonnateur
CREATE POLICY "Lecture publique des catégories de vérifications ordonnateur" 
ON categories_verifications_ordonnateur
FOR SELECT USING (true);

CREATE POLICY "Modification des catégories par les admins" 
ON categories_verifications_ordonnateur
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role IN ('ADMIN')
    )
);

-- Politiques pour verifications_ordonnateur_types
CREATE POLICY "Lecture publique des types de vérifications ordonnateur" 
ON verifications_ordonnateur_types
FOR SELECT USING (true);

CREATE POLICY "Modification des types par les admins" 
ON verifications_ordonnateur_types
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role IN ('ADMIN')
    )
);

-- Politiques pour validations_verifications_ordonnateur
CREATE POLICY "Lecture des validations par les utilisateurs autorisés" 
ON validations_verifications_ordonnateur
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role IN ('ADMIN', 'ORDONNATEUR', 'AGENT_COMPTABLE')
    )
);

CREATE POLICY "Création des validations par les ordonnateurs" 
ON validations_verifications_ordonnateur
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role = 'ORDONNATEUR'
    )
);

CREATE POLICY "Modification des validations par les ordonnateurs" 
ON validations_verifications_ordonnateur
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role = 'ORDONNATEUR'
    )
);

-- Politiques pour syntheses_verifications_ordonnateur
CREATE POLICY "Lecture des synthèses par les utilisateurs autorisés" 
ON syntheses_verifications_ordonnateur
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role IN ('ADMIN', 'ORDONNATEUR', 'AGENT_COMPTABLE')
    )
);

CREATE POLICY "Création des synthèses par les ordonnateurs" 
ON syntheses_verifications_ordonnateur
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role = 'ORDONNATEUR'
    )
);

CREATE POLICY "Modification des synthèses par les ordonnateurs" 
ON syntheses_verifications_ordonnateur
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid()::text 
        AND users.role = 'ORDONNATEUR'
    )
);

-- ==============================================
-- 9. COMMENTAIRES SUR LES TABLES
-- ==============================================

COMMENT ON TABLE categories_verifications_ordonnateur IS 'Catégories de vérifications que l''ordonnateur doit effectuer';
COMMENT ON TABLE verifications_ordonnateur_types IS 'Types de vérifications spécifiques par catégorie pour l''ordonnateur';
COMMENT ON TABLE validations_verifications_ordonnateur IS 'Validations des vérifications effectuées par l''ordonnateur pour chaque dossier';
COMMENT ON TABLE syntheses_verifications_ordonnateur IS 'Synthèse des vérifications ordonnateur par dossier';

-- ==============================================
-- 10. VÉRIFICATION DE LA CRÉATION
-- ==============================================

-- Afficher les tables créées
SELECT 
    table_name,
    table_comment
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%verifications_ordonnateur%'
ORDER BY table_name;

-- Afficher les colonnes de chaque table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE '%verifications_ordonnateur%'
ORDER BY table_name, ordinal_position;
