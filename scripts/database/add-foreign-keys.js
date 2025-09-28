#!/usr/bin/env node

/**
 * Script pour ajouter les contraintes de clé étrangère manquantes
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addForeignKeys() {
  console.log('🔗 Ajout des contraintes de clé étrangère...\n')

  try {
    // 1. Ajouter la contrainte sur verifications_ordonnateur_types
    console.log('1. 🔗 Ajout de la contrainte categorie_id...')
    
    const addCategorieFK = `
      ALTER TABLE verifications_ordonnateur_types 
      ADD CONSTRAINT fk_verifications_ordonnateur_categorie 
      FOREIGN KEY (categorie_id) 
      REFERENCES categories_verifications_ordonnateur(id) 
      ON DELETE CASCADE
    `
    
    const { error: fkError1 } = await supabase.rpc('exec_sql', { sql: addCategorieFK })
    if (fkError1 && !fkError1.message.includes('already exists')) {
      console.error('❌ Erreur contrainte categorie:', fkError1)
    } else {
      console.log('✅ Contrainte categorie_id ajoutée')
    }

    // 2. Ajouter la contrainte sur validations_verifications_ordonnateur pour verification_id
    console.log('\n2. 🔗 Ajout de la contrainte verification_id...')
    
    const addVerificationFK = `
      ALTER TABLE validations_verifications_ordonnateur 
      ADD CONSTRAINT fk_validations_verification 
      FOREIGN KEY (verification_id) 
      REFERENCES verifications_ordonnateur_types(id) 
      ON DELETE CASCADE
    `
    
    const { error: fkError2 } = await supabase.rpc('exec_sql', { sql: addVerificationFK })
    if (fkError2 && !fkError2.message.includes('already exists')) {
      console.error('❌ Erreur contrainte verification:', fkError2)
    } else {
      console.log('✅ Contrainte verification_id ajoutée')
    }

    // 3. Ajouter la contrainte sur validations_verifications_ordonnateur pour dossier_id
    console.log('\n3. 🔗 Ajout de la contrainte dossier_id...')
    
    const addDossierFK = `
      ALTER TABLE validations_verifications_ordonnateur 
      ADD CONSTRAINT fk_validations_dossier 
      FOREIGN KEY (dossier_id) 
      REFERENCES dossiers(id) 
      ON DELETE CASCADE
    `
    
    const { error: fkError3 } = await supabase.rpc('exec_sql', { sql: addDossierFK })
    if (fkError3 && !fkError3.message.includes('already exists')) {
      console.error('❌ Erreur contrainte dossier:', fkError3)
    } else {
      console.log('✅ Contrainte dossier_id ajoutée')
    }

    // 4. Ajouter la contrainte sur syntheses_verifications_ordonnateur pour dossier_id
    console.log('\n4. 🔗 Ajout de la contrainte synthese dossier_id...')
    
    const addSyntheseDossierFK = `
      ALTER TABLE syntheses_verifications_ordonnateur 
      ADD CONSTRAINT fk_syntheses_dossier 
      FOREIGN KEY (dossier_id) 
      REFERENCES dossiers(id) 
      ON DELETE CASCADE
    `
    
    const { error: fkError4 } = await supabase.rpc('exec_sql', { sql: addSyntheseDossierFK })
    if (fkError4 && !fkError4.message.includes('already exists')) {
      console.error('❌ Erreur contrainte synthese dossier:', fkError4)
    } else {
      console.log('✅ Contrainte synthese dossier_id ajoutée')
    }

    // 5. Insérer maintenant les vérifications complètes
    console.log('\n5. 📊 Insertion des vérifications complètes...')
    
    const verifications = [
      // Vérifications de Légalité
      {
        id: '11000000-0000-0000-0000-000000000001',
        categorie_id: '10000000-0000-0000-0000-000000000001',
        nom: 'Habilitation des autorités administratives',
        description: 'Vérifier que l\'autorité qui a initié la demande est habilitée à le faire',
        question: 'L\'autorité administrative qui a initié cette demande est-elle habilitée à le faire ?',
        aide: 'Vérifiez les délégations de pouvoir, les limites de compétence et les habilitations en vigueur.',
        obligatoire: true,
        ordre: 1
      },
      {
        id: '11000000-0000-0000-0000-000000000002',
        categorie_id: '10000000-0000-0000-0000-000000000001',
        nom: 'Validité des délégations de pouvoir',
        description: 'Contrôler la validité et les limites des délégations accordées',
        question: 'Les délégations de pouvoir sont-elles valides et dans les limites autorisées ?',
        aide: 'Vérifiez les actes de délégation, leur durée de validité et les montants autorisés.',
        obligatoire: true,
        ordre: 2
      },
      {
        id: '11000000-0000-0000-0000-000000000003',
        categorie_id: '10000000-0000-0000-0000-000000000001',
        nom: 'Conformité aux textes légaux',
        description: 'Vérifier la conformité de l\'opération aux textes légaux et réglementaires',
        question: 'L\'opération est-elle conforme aux textes légaux et réglementaires en vigueur ?',
        aide: 'Consultez les lois, décrets et arrêtés applicables à ce type d\'opération.',
        obligatoire: true,
        ordre: 3
      },
      
      // Vérifications de Service Fait
      {
        id: '12000000-0000-0000-0000-000000000001',
        categorie_id: '10000000-0000-0000-0000-000000000002',
        nom: 'Justification du service rendu',
        description: 'Vérifier que le service a bien été rendu conformément aux spécifications',
        question: 'Le service a-t-il été rendu conformément aux spécifications ?',
        aide: 'Examinez les preuves de réalisation : rapports, procès-verbaux, attestations.',
        obligatoire: true,
        ordre: 1
      },
      {
        id: '12000000-0000-0000-0000-000000000002',
        categorie_id: '10000000-0000-0000-0000-000000000002',
        nom: 'Validité de la certification',
        description: 'Contrôler l\'authenticité et la validité des certifications fournies',
        question: 'Les certifications fournies sont-elles authentiques et valides ?',
        aide: 'Vérifiez les signatures, cachets et dates de validité des certificats.',
        obligatoire: true,
        ordre: 2
      },
      
      // Vérifications de Montants
      {
        id: '13000000-0000-0000-0000-000000000001',
        categorie_id: '10000000-0000-0000-0000-000000000003',
        nom: 'Cohérence des montants entre documents',
        description: 'Vérifier la cohérence des montants entre tous les documents du dossier',
        question: 'Les montants sont-ils cohérents entre tous les documents du dossier ?',
        aide: 'Comparez les montants sur les factures, devis, bons de commande et autres pièces.',
        obligatoire: true,
        ordre: 1
      },
      {
        id: '13000000-0000-0000-0000-000000000002',
        categorie_id: '10000000-0000-0000-0000-000000000003',
        nom: 'Exactitude des calculs',
        description: 'Vérifier l\'exactitude de tous les calculs effectués',
        question: 'Tous les calculs sont-ils exacts (TVA, remises, totaux) ?',
        aide: 'Recalculez les montants HT, TVA, remises et totaux pour vérifier leur exactitude.',
        obligatoire: true,
        ordre: 2
      },
      
      // Vérifications de Conformité
      {
        id: '14000000-0000-0000-0000-000000000001',
        categorie_id: '10000000-0000-0000-0000-000000000004',
        nom: 'Respect des délais réglementaires',
        description: 'Vérifier le respect des délais légaux et réglementaires',
        question: 'Les délais réglementaires ont-ils été respectés ?',
        aide: 'Contrôlez les délais de paiement, de prescription et autres échéances légales.',
        obligatoire: true,
        ordre: 1
      },
      {
        id: '14000000-0000-0000-0000-000000000002',
        categorie_id: '10000000-0000-0000-0000-000000000004',
        nom: 'Validation des autorisations',
        description: 'Vérifier que toutes les autorisations nécessaires ont été obtenues',
        question: 'Toutes les autorisations nécessaires ont-elles été obtenues ?',
        aide: 'Contrôlez les visas, autorisations préalables et validations requises.',
        obligatoire: true,
        ordre: 2
      }
    ]
    
    const { error: insertError } = await supabase
      .from('verifications_ordonnateur_types')
      .upsert(verifications, { onConflict: 'id' })
    
    if (insertError) {
      console.error('❌ Erreur insertion vérifications:', insertError)
    } else {
      console.log(`✅ ${verifications.length} vérifications insérées`)
    }

    // 6. Test final des relations
    console.log('\n6. 🔍 Test des relations...')
    
    const { data: testRelations, error: testError } = await supabase
      .from('categories_verifications_ordonnateur')
      .select(`
        nom,
        verifications:verifications_ordonnateur_types(nom, obligatoire)
      `)
    
    if (testError) {
      console.error('❌ Erreur test relations:', testError)
    } else {
      console.log('✅ Relations fonctionnelles :')
      testRelations?.forEach(cat => {
        console.log(`  - ${cat.nom}: ${cat.verifications?.length || 0} vérifications`)
      })
    }

    console.log('\n🎉 Contraintes et données ajoutées avec succès !')
    return true

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    return false
  }
}

async function main() {
  const success = await addForeignKeys()
  
  if (success) {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  } else {
    console.log('\n❌ Script terminé avec des erreurs')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
