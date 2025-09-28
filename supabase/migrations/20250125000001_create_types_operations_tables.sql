-- Migration pour créer les tables de gestion des types d'opérations et pièces justificatives
-- Date: 2025-01-25
-- Description: Crée les tables pour la validation des dossiers par le CB avec types d'opérations

-- Table des types d'opérations
CREATE TABLE IF NOT EXISTS types_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des natures d'opérations
CREATE TABLE IF NOT EXISTS natures_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_operation_id UUID NOT NULL REFERENCES types_operations(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type_operation_id, nom)
);

-- Table des pièces justificatives
CREATE TABLE IF NOT EXISTS pieces_justificatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nature_operation_id UUID NOT NULL REFERENCES natures_operations(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    obligatoire BOOLEAN DEFAULT true,
    ordre INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de validation des dossiers par le CB
CREATE TABLE IF NOT EXISTS validations_cb (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
    type_operation_id UUID NOT NULL REFERENCES types_operations(id),
    nature_operation_id UUID NOT NULL REFERENCES natures_operations(id),
    commentaire TEXT,
    statut TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VALIDÉ', 'REJETÉ')),
    valide_par UUID REFERENCES users(id),
    valide_le TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de validation des pièces justificatives
CREATE TABLE IF NOT EXISTS validations_pieces_justificatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    validation_cb_id UUID NOT NULL REFERENCES validations_cb(id) ON DELETE CASCADE,
    piece_justificative_id UUID NOT NULL REFERENCES pieces_justificatives(id),
    present BOOLEAN DEFAULT false,
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(validation_cb_id, piece_justificative_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_natures_operations_type ON natures_operations(type_operation_id);
CREATE INDEX IF NOT EXISTS idx_pieces_justificatives_nature ON pieces_justificatives(nature_operation_id);
CREATE INDEX IF NOT EXISTS idx_validations_cb_dossier ON validations_cb(dossier_id);
CREATE INDEX IF NOT EXISTS idx_validations_cb_type ON validations_cb(type_operation_id);
CREATE INDEX IF NOT EXISTS idx_validations_cb_nature ON validations_cb(nature_operation_id);
CREATE INDEX IF NOT EXISTS idx_validations_pieces_validation ON validations_pieces_justificatives(validation_cb_id);

-- RLS (Row Level Security)
ALTER TABLE types_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE natures_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces_justificatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations_cb ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations_pieces_justificatives ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les types d'opérations (lecture pour tous les utilisateurs authentifiés)
CREATE POLICY "Types operations readable by authenticated users" ON types_operations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Natures operations readable by authenticated users" ON natures_operations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Pieces justificatives readable by authenticated users" ON pieces_justificatives
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politiques RLS pour les validations CB (seuls les CB peuvent modifier)
CREATE POLICY "Validations CB readable by authenticated users" ON validations_cb
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Validations CB manageable by CB" ON validations_cb
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'CONTROLEUR_BUDGETAIRE'
        )
    );

CREATE POLICY "Validations pieces readable by authenticated users" ON validations_pieces_justificatives
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Validations pieces manageable by CB" ON validations_pieces_justificatives
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'CONTROLEUR_BUDGETAIRE'
        )
    );

-- Commentaires sur les tables
COMMENT ON TABLE types_operations IS 'Types d''opérations (Investissement, Fonctionnement)';
COMMENT ON TABLE natures_operations IS 'Natures d''opérations pour chaque type';
COMMENT ON TABLE pieces_justificatives IS 'Pièces justificatives requises pour chaque nature d''opération';
COMMENT ON TABLE validations_cb IS 'Validations des dossiers par le Contrôleur Budgétaire';
COMMENT ON TABLE validations_pieces_justificatives IS 'Validation des pièces justificatives par le CB';
