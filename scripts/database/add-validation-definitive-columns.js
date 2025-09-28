const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function addValidationDefinitiveColumns() {
  try {
    console.log('🔧 Ajout des colonnes de validation définitive à la table dossiers...');
    
    // Ajouter les colonnes de validation définitive
    const { data: addColumns, error: addError } = await admin.rpc('exec_sql', {
      sql: `
        ALTER TABLE dossiers 
        ADD COLUMN IF NOT EXISTS "validationDefinitiveComment" TEXT,
        ADD COLUMN IF NOT EXISTS "validatedDefinitivelyAt" TIMESTAMP WITH TIME ZONE;
      `
    });
    
    if (addError) {
      console.error('❌ Erreur lors de l\'ajout des colonnes:', addError);
      return;
    }
    
    console.log('✅ Colonnes de validation définitive ajoutées avec succès');
    
    // Ajouter des commentaires sur les colonnes
    const { data: comment1, error: commentError1 } = await admin.rpc('exec_sql', {
      sql: `
        COMMENT ON COLUMN dossiers."validationDefinitiveComment" IS 'Commentaire de l''Agent Comptable lors de la validation définitive';
      `
    });
    
    if (commentError1) {
      console.warn('⚠️ Avertissement commentaire 1:', commentError1.message);
    } else {
      console.log('✅ Commentaire ajouté sur validationDefinitiveComment');
    }
    
    const { data: comment2, error: commentError2 } = await admin.rpc('exec_sql', {
      sql: `
        COMMENT ON COLUMN dossiers."validatedDefinitivelyAt" IS 'Date et heure de la validation définitive par l''Agent Comptable';
      `
    });
    
    if (commentError2) {
      console.warn('⚠️ Avertissement commentaire 2:', commentError2.message);
    } else {
      console.log('✅ Commentaire ajouté sur validatedDefinitivelyAt');
    }
    
    // Créer des index pour les performances
    const { data: index1, error: indexError1 } = await admin.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_dossiers_validated_definitively_at ON dossiers("validatedDefinitivelyAt");
      `
    });
    
    if (indexError1) {
      console.warn('⚠️ Avertissement index 1:', indexError1.message);
    } else {
      console.log('✅ Index créé sur validatedDefinitivelyAt');
    }
    
    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

addValidationDefinitiveColumns();
