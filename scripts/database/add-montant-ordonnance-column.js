const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function addMontantOrdonnanceColumn() {
  try {
    console.log('🔧 Ajout de la colonne montantOrdonnance à la table dossiers...');
    
    // Ajouter la colonne montantOrdonnance
    const { data: addColumn, error: addError } = await admin.rpc('exec_sql', {
      sql: `
        ALTER TABLE dossiers 
        ADD COLUMN IF NOT EXISTS montantOrdonnance DECIMAL(15,2);
      `
    });
    
    if (addError) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', addError);
      return;
    }
    
    console.log('✅ Colonne montantOrdonnance ajoutée avec succès');
    
    // Ajouter un commentaire sur la colonne
    const { data: comment, error: commentError } = await admin.rpc('exec_sql', {
      sql: `
        COMMENT ON COLUMN dossiers.montantOrdonnance IS 'Montant ordonnançé par l\'ordonnateur';
      `
    });
    
    if (commentError) {
      console.warn('⚠️ Avertissement commentaire:', commentError.message);
    } else {
      console.log('✅ Commentaire ajouté sur la colonne');
    }
    
    // Créer un index pour les performances
    const { data: index, error: indexError } = await admin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_dossiers_montant_ordonnance ON dossiers(montantOrdonnance);
      `
    });
    
    if (indexError) {
      console.warn('⚠️ Avertissement index:', indexError.message);
    } else {
      console.log('✅ Index créé sur la colonne montantOrdonnance');
    }
    
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

addMontantOrdonnanceColumn();
