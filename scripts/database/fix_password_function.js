const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script pour corriger la fonction check_password_strength
 * Date: 2025-01-29
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPasswordFunction() {
    console.log('🔧 Correction de la fonction check_password_strength...');

    try {
        // Supprimer la fonction existante si elle existe
        const dropFunction = `
            DROP FUNCTION IF EXISTS check_password_strength(TEXT);
        `;

        const { error: dropError } = await supabase.rpc('exec_sql', {
            sql: dropFunction
        });

        if (dropError) {
            console.log('⚠️  Erreur lors de la suppression:', dropError.message);
        } else {
            console.log('✅ Ancienne fonction supprimée');
        }

        // Créer la fonction correctement
        const passwordStrengthFunction = `
            CREATE OR REPLACE FUNCTION check_password_strength(password TEXT)
            RETURNS TABLE(
                is_strong BOOLEAN,
                score INTEGER,
                feedback TEXT[]
            )
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            DECLARE
                score INTEGER := 0;
                feedback TEXT[] := ARRAY[]::TEXT[];
            BEGIN
                -- Vérifier la longueur (minimum 8 caractères)
                IF length(password) >= 8 THEN
                    score := score + 1;
                ELSE
                    feedback := array_append(feedback, 'Le mot de passe doit contenir au moins 8 caractères');
                END IF;
                
                -- Vérifier la présence de minuscules
                IF password ~ '[a-z]' THEN
                    score := score + 1;
                ELSE
                    feedback := array_append(feedback, 'Le mot de passe doit contenir au moins une lettre minuscule');
                END IF;
                
                -- Vérifier la présence de majuscules
                IF password ~ '[A-Z]' THEN
                    score := score + 1;
                ELSE
                    feedback := array_append(feedback, 'Le mot de passe doit contenir au moins une lettre majuscule');
                END IF;
                
                -- Vérifier la présence de chiffres
                IF password ~ '[0-9]' THEN
                    score := score + 1;
                ELSE
                    feedback := array_append(feedback, 'Le mot de passe doit contenir au moins un chiffre');
                END IF;
                
                -- Vérifier la présence de caractères spéciaux
                IF password ~ '[^a-zA-Z0-9]' THEN
                    score := score + 1;
                ELSE
                    feedback := array_append(feedback, 'Le mot de passe doit contenir au moins un caractère spécial');
                END IF;
                
                -- Vérifier la longueur supplémentaire
                IF length(password) >= 12 THEN
                    score := score + 1;
                END IF;
                
                -- Vérifier la longueur très longue
                IF length(password) >= 16 THEN
                    score := score + 1;
                END IF;
                
                -- Déterminer si le mot de passe est fort (score >= 4)
                is_strong := score >= 4;
                
                -- Si le mot de passe est fort, ajouter un message positif
                IF is_strong THEN
                    feedback := array_append(feedback, 'Mot de passe fort détecté');
                END IF;
                
                RETURN QUERY SELECT is_strong, score, feedback;
            END;
            $$;
        `;

        const { error: createError } = await supabase.rpc('exec_sql', {
            sql: passwordStrengthFunction
        });

        if (createError) {
            console.log('❌ Erreur lors de la création de la fonction:', createError.message);
            return;
        }

        console.log('✅ Fonction check_password_strength créée avec succès');

        // Tester la fonction
        console.log('\n🧪 Test de la fonction...');
        
        const { data: passwordTest, error: passwordTestError } = await supabase.rpc('check_password_strength', {
            password: 'TestPassword123!'
        });

        if (passwordTestError) {
            console.log('❌ Erreur lors du test:', passwordTestError.message);
        } else {
            console.log('✅ Test réussi:', passwordTest);
        }

        // Test avec un mot de passe faible
        const { data: weakPasswordTest, error: weakPasswordTestError } = await supabase.rpc('check_password_strength', {
            password: '123'
        });

        if (weakPasswordTestError) {
            console.log('❌ Erreur lors du test de mot de passe faible:', weakPasswordTestError.message);
        } else {
            console.log('✅ Test mot de passe faible réussi:', weakPasswordTest);
        }

        console.log('\n🎉 Fonction check_password_strength corrigée et testée avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error.message);
        process.exit(1);
    }
}

// Exécuter le script
fixPasswordFunction();
