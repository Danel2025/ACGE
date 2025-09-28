-- =====================================================
-- MIGRATION: Création des tables pour les contrôles de fond
-- =====================================================

-- Table des catégories de contrôles de fond
CREATE TABLE IF NOT EXISTS categories_controles_fond (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,
    description TEXT,
    ordre INTEGER NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des contrôles de fond
CREATE TABLE IF NOT EXISTS controles_fond (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie_id UUID NOT NULL REFERENCES categories_controles_fond(id),
    nom TEXT NOT NULL,
    description TEXT,
    obligatoire BOOLEAN DEFAULT true,
    ordre INTEGER NOT NULL,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des validations des contrôles de fond par dossier
CREATE TABLE IF NOT EXISTS validations_controles_fond (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id TEXT NOT NULL REFERENCES dossiers(id),
    controle_fond_id UUID NOT NULL REFERENCES controles_fond(id),
    valide BOOLEAN NOT NULL,
    commentaire TEXT,
    valide_par TEXT NOT NULL REFERENCES users(id),
    valide_le TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_controles_fond_categorie ON controles_fond(categorie_id);
CREATE INDEX IF NOT EXISTS idx_controles_fond_actif ON controles_fond(actif);
CREATE INDEX IF NOT EXISTS idx_validations_controles_fond_dossier ON validations_controles_fond(dossier_id);
CREATE INDEX IF NOT EXISTS idx_validations_controles_fond_controle ON validations_controles_fond(controle_fond_id);
CREATE INDEX IF NOT EXISTS idx_validations_controles_fond_valide_par ON validations_controles_fond(valide_par);

-- RLS (Row Level Security)
ALTER TABLE categories_controles_fond ENABLE ROW LEVEL SECURITY;
ALTER TABLE controles_fond ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations_controles_fond ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour categories_controles_fond
CREATE POLICY "Lecture publique des catégories de contrôles de fond" ON categories_controles_fond
    FOR SELECT USING (true);

CREATE POLICY "Modification des catégories par les admins" ON categories_controles_fond
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('ADMIN', 'CONTROLEUR_BUDGETAIRE')
        )
    );

-- Politiques RLS pour controles_fond
CREATE POLICY "Lecture publique des contrôles de fond" ON controles_fond
    FOR SELECT USING (true);

CREATE POLICY "Modification des contrôles par les admins" ON controles_fond
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('ADMIN', 'CONTROLEUR_BUDGETAIRE')
        )
    );

-- Politiques RLS pour validations_controles_fond
CREATE POLICY "Lecture des validations par les utilisateurs autorisés" ON validations_controles_fond
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role IN ('ADMIN', 'CONTROLEUR_BUDGETAIRE', 'ORDONNATEUR')
        )
    );

CREATE POLICY "Création des validations par les CB" ON validations_controles_fond
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'CONTROLEUR_BUDGETAIRE'
        )
    );

CREATE POLICY "Modification des validations par les CB" ON validations_controles_fond
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'CONTROLEUR_BUDGETAIRE'
        )
    );

-- Insertion des données de base
INSERT INTO categories_controles_fond (id, nom, description, ordre) VALUES
    ('00000000-0000-0000-0000-000000000001', 'En matière de recettes', 'Contrôles relatifs aux recettes', 1),
    ('00000000-0000-0000-0000-000000000002', 'En matière de dépenses', 'Contrôles relatifs aux dépenses', 2)
ON CONFLICT (id) DO NOTHING;

-- Insertion des contrôles de fond
INSERT INTO controles_fond (id, categorie_id, nom, description, obligatoire, ordre) VALUES
    -- En matière de recettes
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Validité de l\'autorisation de percevoir la recette', 'Vérifier la validité de l\'autorisation de percevoir la recette', true, 1),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Validité de la mise en recouvrement', 'Vérifier la validité de la mise en recouvrement', true, 2),
    ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Régularité des réductions ou annulations', 'Vérifier la régularité des réductions ou annulations opérées sur les ordres de recettes', true, 3),
    
    -- En matière de dépenses
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 'Habilitation des autorités administratives', 'Vérifier l\'habilitation des autorités administratives', true, 1),
    ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', 'Imputation budgétaire et disponibilité des crédits', 'Vérifier l\'imputation budgétaire et la disponibilité des crédits', true, 2),
    ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000002', 'Justification du service fait', 'Vérifier la justification du service fait résultant de la certification délivrée par l\'ordonnateur', true, 3),
    ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000002', 'Exactitude de la liquidation', 'Vérifier l\'exactitude de la liquidation', true, 4),
    ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000002', 'Intervention des contrôles préalables', 'Vérifier l\'intervention des contrôles préalables prescrits par la réglementation', true, 5),
    ('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000002', 'Existence du visa ou avis préalable', 'Vérifier l\'existence du visa ou de l\'avis préalable du contrôleur budgétaire', true, 6),
    ('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000002', 'Production des pièces justificatives', 'Vérifier la production des pièces justificatives', true, 7),
    ('00000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000002', 'Application des règles de prescription et déchéance', 'Vérifier l\'application des règles de prescription et de déchéance', true, 8),
    ('00000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000002', 'Caractère libératoire du paiement', 'Vérifier le caractère libératoire du paiement', true, 9)
ON CONFLICT (id) DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE categories_controles_fond IS 'Catégories des contrôles de fond (recettes/dépenses)';
COMMENT ON TABLE controles_fond IS 'Liste des contrôles de fond à effectuer';
COMMENT ON TABLE validations_controles_fond IS 'Validations des contrôles de fond par dossier et CB';

COMMENT ON COLUMN categories_controles_fond.nom IS 'Nom de la catégorie (ex: En matière de recettes)';
COMMENT ON COLUMN controles_fond.nom IS 'Nom du contrôle de fond';
COMMENT ON COLUMN controles_fond.obligatoire IS 'Indique si le contrôle est obligatoire';
COMMENT ON COLUMN validations_controles_fond.valide IS 'Indique si le contrôle est validé';
COMMENT ON COLUMN validations_controles_fond.commentaire IS 'Commentaire du CB sur le contrôle';
