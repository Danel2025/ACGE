-- =====================================================
-- MIGRATION: Insertion des données de base pour les vérifications ordonnateur
-- =====================================================
-- Date: 2025-01-31
-- Description: Insère les catégories et types de vérifications que l'ordonnateur
--              doit effectuer avant d'ordonnancer un dossier

-- ==============================================
-- 1. INSERTION DES CATÉGORIES DE VÉRIFICATIONS
-- ==============================================

INSERT INTO categories_verifications_ordonnateur (id, nom, description, icone, couleur, ordre) VALUES
    (
        '10000000-0000-0000-0000-000000000001', 
        'Vérifications de Légalité', 
        'Contrôles de conformité aux textes légaux et réglementaires',
        'gavel',
        'blue',
        1
    ),
    (
        '10000000-0000-0000-0000-000000000002', 
        'Vérifications de Service Fait', 
        'Contrôles de justification et certification du service rendu',
        'check-circle',
        'green',
        2
    ),
    (
        '10000000-0000-0000-0000-000000000003', 
        'Vérifications de Montants', 
        'Contrôles de cohérence et exactitude des montants',
        'calculator',
        'orange',
        3
    ),
    (
        '10000000-0000-0000-0000-000000000004', 
        'Vérifications de Conformité', 
        'Contrôles de respect des procédures et délais',
        'clipboard-check',
        'purple',
        4
    )
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 2. INSERTION DES VÉRIFICATIONS DE LÉGALITÉ
-- ==============================================

INSERT INTO verifications_ordonnateur_types (id, categorie_id, nom, description, question, aide, obligatoire, ordre) VALUES
    (
        '11000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Habilitation des autorités administratives',
        'Vérifier que l''autorité qui a initié la demande est habilitée à le faire',
        'L''autorité administrative qui a initié cette demande est-elle habilitée à le faire ?',
        'Vérifiez les délégations de pouvoir, les limites de compétence et les habilitations en vigueur.',
        true,
        1
    ),
    (
        '11000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Validité des délégations de pouvoir',
        'Contrôler la validité et les limites des délégations accordées',
        'Les délégations de pouvoir sont-elles valides et dans les limites autorisées ?',
        'Vérifiez les actes de délégation, leur durée de validité et les montants autorisés.',
        true,
        2
    ),
    (
        '11000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001',
        'Conformité aux textes légaux',
        'Vérifier la conformité de l''opération aux textes légaux et réglementaires',
        'L''opération est-elle conforme aux textes légaux et réglementaires en vigueur ?',
        'Consultez les lois, décrets et arrêtés applicables à ce type d''opération.',
        true,
        3
    ),
    (
        '11000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000001',
        'Respect des procédures établies',
        'Contrôler le respect des procédures internes et externes',
        'Les procédures établies ont-elles été respectées ?',
        'Vérifiez le respect des circuits de validation et des procédures internes.',
        true,
        4
    ),

-- ==============================================
-- 3. INSERTION DES VÉRIFICATIONS DE SERVICE FAIT
-- ==============================================

    (
        '12000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002',
        'Justification du service rendu',
        'Vérifier que le service a bien été rendu conformément aux spécifications',
        'Le service a-t-il été rendu conformément aux spécifications ?',
        'Examinez les preuves de réalisation : rapports, procès-verbaux, attestations.',
        true,
        1
    ),
    (
        '12000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002',
        'Validité de la certification',
        'Contrôler l''authenticité et la validité des certifications fournies',
        'Les certifications fournies sont-elles authentiques et valides ?',
        'Vérifiez les signatures, cachets et dates de validité des certificats.',
        true,
        2
    ),
    (
        '12000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000002',
        'Preuves du service fait',
        'Examiner les preuves tangibles du service effectivement rendu',
        'Les preuves du service fait sont-elles suffisantes et probantes ?',
        'Analysez les documents justificatifs : factures, bons de livraison, attestations.',
        true,
        3
    ),
    (
        '12000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000002',
        'Conformité des livrables',
        'Vérifier que les livrables correspondent aux spécifications du contrat',
        'Les livrables correspondent-ils aux spécifications contractuelles ?',
        'Comparez les livrables avec les spécifications techniques et qualitatives.',
        true,
        4
    ),

-- ==============================================
-- 4. INSERTION DES VÉRIFICATIONS DE MONTANTS
-- ==============================================

    (
        '13000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        'Cohérence des montants entre documents',
        'Vérifier la cohérence des montants entre tous les documents du dossier',
        'Les montants sont-ils cohérents entre tous les documents du dossier ?',
        'Comparez les montants sur les factures, devis, bons de commande et autres pièces.',
        true,
        1
    ),
    (
        '13000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000003',
        'Respect des plafonds réglementaires',
        'Contrôler le respect des plafonds et seuils réglementaires',
        'Les montants respectent-ils les plafonds et seuils réglementaires ?',
        'Vérifiez les seuils de marchés publics, limites de compétence et plafonds budgétaires.',
        true,
        2
    ),
    (
        '13000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003',
        'Exactitude des calculs',
        'Vérifier l''exactitude de tous les calculs effectués',
        'Tous les calculs sont-ils exacts (TVA, remises, totaux) ?',
        'Recalculez les montants HT, TVA, remises et totaux pour vérifier leur exactitude.',
        true,
        3
    ),
    (
        '13000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000003',
        'Validation des taux et barèmes',
        'Contrôler l''application correcte des taux et barèmes en vigueur',
        'Les taux et barèmes appliqués sont-ils corrects et à jour ?',
        'Vérifiez les taux de TVA, barèmes de prix et grilles tarifaires applicables.',
        true,
        4
    ),

-- ==============================================
-- 5. INSERTION DES VÉRIFICATIONS DE CONFORMITÉ
-- ==============================================

    (
        '14000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000004',
        'Respect des délais réglementaires',
        'Vérifier le respect des délais légaux et réglementaires',
        'Les délais réglementaires ont-ils été respectés ?',
        'Contrôlez les délais de paiement, de prescription et autres échéances légales.',
        true,
        1
    ),
    (
        '14000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000004',
        'Conformité aux procédures internes',
        'Contrôler le respect des procédures internes de l''organisation',
        'Les procédures internes ont-elles été respectées ?',
        'Vérifiez le respect des circuits d''approbation et des procédures établies.',
        true,
        2
    ),
    (
        '14000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000004',
        'Validation des autorisations',
        'Vérifier que toutes les autorisations nécessaires ont été obtenues',
        'Toutes les autorisations nécessaires ont-elles été obtenues ?',
        'Contrôlez les visas, autorisations préalables et validations requises.',
        true,
        3
    ),
    (
        '14000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000004',
        'Vérification des signatures',
        'Contrôler l''authenticité et la validité de toutes les signatures',
        'Toutes les signatures sont-elles authentiques et valides ?',
        'Vérifiez l''identité des signataires et leur habilitation à signer.',
        true,
        4
    ),
    (
        '14000000-0000-0000-0000-000000000005',
        '10000000-0000-0000-0000-000000000004',
        'Contrôle des échéances',
        'Vérifier les dates d''échéance et de validité des documents',
        'Les échéances et dates de validité sont-elles respectées ?',
        'Contrôlez les dates d''expiration des contrats, garanties et autres documents.',
        true,
        5
    )
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 6. VÉRIFICATION DES DONNÉES INSÉRÉES
-- ==============================================

-- Compter les catégories insérées
SELECT 
    'Catégories' as type,
    COUNT(*) as total
FROM categories_verifications_ordonnateur
WHERE actif = true

UNION ALL

-- Compter les vérifications par catégorie
SELECT 
    CONCAT('Vérifications - ', c.nom) as type,
    COUNT(v.*) as total
FROM categories_verifications_ordonnateur c
LEFT JOIN verifications_ordonnateur_types v ON c.id = v.categorie_id
WHERE c.actif = true AND v.actif = true
GROUP BY c.nom, c.ordre
ORDER BY type;

-- ==============================================
-- 7. AFFICHAGE DES DONNÉES POUR VÉRIFICATION
-- ==============================================

-- Afficher toutes les catégories avec leurs vérifications
SELECT 
    c.ordre as cat_ordre,
    c.nom as categorie,
    c.description as cat_description,
    c.icone,
    c.couleur,
    v.ordre as verif_ordre,
    v.nom as verification,
    v.question,
    v.obligatoire
FROM categories_verifications_ordonnateur c
LEFT JOIN verifications_ordonnateur_types v ON c.id = v.categorie_id
WHERE c.actif = true AND (v.actif = true OR v.actif IS NULL)
ORDER BY c.ordre, v.ordre;

-- ==============================================
-- 8. STATISTIQUES FINALES
-- ==============================================

SELECT 
    'RÉSUMÉ DE L''INSERTION' as titre,
    (SELECT COUNT(*) FROM categories_verifications_ordonnateur WHERE actif = true) as categories_actives,
    (SELECT COUNT(*) FROM verifications_ordonnateur_types WHERE actif = true) as verifications_actives,
    (SELECT COUNT(*) FROM verifications_ordonnateur_types WHERE obligatoire = true AND actif = true) as verifications_obligatoires;
