const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function resetDossierStatus() {
  try {
    console.log('🔄 Remise du dossier au statut VALIDÉ_CB...');
    
    const dossierId = '7faf6305-1fbf-4237-b50c-51e7d16b715d';
    
    // Remettre le dossier au statut VALIDÉ_CB
    const { data: updateData, error: updateError } = await admin
      .from('dossiers')
      .update({
        statut: 'VALIDÉ_CB',
        ordonnancementComment: null,
        montantOrdonnance: null,
        ordonnancedAt: null,
        updatedAt: new Date().toISOString()
      })
      .eq('id', dossierId)
      .select();
    
    if (updateError) {
      console.error('❌ Erreur lors de la remise du statut:', updateError);
      return;
    }
    
    console.log('✅ Dossier remis au statut VALIDÉ_CB avec succès !');
    console.log('📊 Dossier:', updateData[0].numeroDossier);
    console.log('📊 Statut:', updateData[0].statut);
    
    // Vérifier que le dossier apparaît maintenant dans la liste ordonnateur
    console.log('🔍 Vérification de la visibilité...');
    const { data: dossiers, error: fetchError } = await admin
      .from('dossiers')
      .select('id, numeroDossier, statut')
      .eq('statut', 'VALIDÉ_CB');
    
    if (fetchError) {
      console.error('❌ Erreur lors de la vérification:', fetchError);
      return;
    }
    
    console.log('✅ Dossiers VALIDÉ_CB trouvés:', dossiers.length);
    dossiers.forEach(dossier => {
      console.log(`  - ${dossier.numeroDossier} (${dossier.id})`);
    });
    
    console.log('🎉 Correction terminée ! Le dossier est maintenant visible pour l\'ordonnateur.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

resetDossierStatus();
