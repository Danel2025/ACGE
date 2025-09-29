-- Script pour créer des documents de test liés au dossier comptable
-- Cible: Dossier DOSS-ACGE-2025-09-28-9270988d (ID: 9270988d-f17d-42f0-972d-44db343fcde0)

-- Insérer des documents de test
INSERT INTO documents (
    id,
    title,
    description,
    author_id,
    dossier_comptable_id,
    file_name,
    file_size,
    file_type,
    file_path,
    is_public,
    tags,
    created_at,
    updated_at
) VALUES
(
    gen_random_uuid(),
    'Facture fournisseur',
    'Facture du fournisseur pour l\'opération de cotisations internationales',
    'e4a8c25e-5239-4134-8aa9-2d49d87a16d9', -- CB user
    '9270988d-f17d-42f0-972d-44db343fcde0', -- Dossier comptable
    'facture_fournisseur.pdf',
    245760, -- 240 KB
    'application/pdf',
    '/storage/documents/facture_fournisseur.pdf',
    false,
    ARRAY['facture', 'fournisseur', 'cotisations'],
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Bon de commande',
    'Bon de commande pour les cotisations internationales',
    'e4a8c25e-5239-4134-8aa9-2d49d87a16d9', -- CB user
    '9270988d-f17d-42f0-972d-44db343fcde0', -- Dossier comptable
    'bon_commande.pdf',
    189440, -- 185 KB
    'application/pdf',
    '/storage/documents/bon_commande.pdf',
    false,
    ARRAY['bon de commande', 'cotisations'],
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Justificatif bancaire',
    'Relevé bancaire justifiant le paiement des cotisations',
    'e4a8c25e-5239-4134-8aa9-2d49d87a16d9', -- CB user
    '9270988d-f17d-42f0-972d-44db343fcde0', -- Dossier comptable
    'releve_bancaire.pdf',
    512000, -- 500 KB
    'application/pdf',
    '/storage/documents/releve_bancaire.pdf',
    false,
    ARRAY['bancaire', 'justificatif', 'paiement'],
    NOW(),
    NOW()
);

-- Vérifier les documents créés
SELECT
    id,
    title,
    file_name,
    file_size,
    dossier_comptable_id,
    created_at
FROM documents
WHERE dossier_comptable_id = '9270988d-f17d-42f0-972d-44db343fcde0'
ORDER BY created_at DESC;