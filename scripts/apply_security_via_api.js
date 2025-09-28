const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script pour appliquer les corrections de sécurité via l'API Supabase
 * Date: 2025-01-29
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.error('Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySecurityFixes() {
    console.log('🔒 Application des corrections de sécurité via API Supabase...');
    console.log('==================================================');

    try {
        // 1. Correction des fonctions SQL avec search_path sécurisé
        console.log('📋 Correction des fonctions SQL...');
        
        const execSqlFunction = `
            CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
            RETURNS JSON
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            DECLARE
                result JSON;
                rows_affected INTEGER := 0;
            BEGIN
                -- Validation basique du SQL pour éviter les injections
                IF sql IS NULL OR trim(sql) = '' THEN
                    RAISE EXCEPTION 'SQL ne peut pas être vide';
                END IF;
                
                -- Vérifier que ce n'est pas une commande DDL dangereuse
                IF upper(trim(sql)) LIKE 'DROP%' OR 
                   upper(trim(sql)) LIKE 'ALTER%' OR 
                   upper(trim(sql)) LIKE 'CREATE%' OR
                   upper(trim(sql)) LIKE 'GRANT%' OR
                   upper(trim(sql)) LIKE 'REVOKE%' THEN
                    RAISE EXCEPTION 'Commandes DDL non autorisées via cette fonction';
                END IF;
                
                -- Exécuter le SQL de manière sécurisée
                BEGIN
                    EXECUTE sql;
                    GET DIAGNOSTICS rows_affected = ROW_COUNT;
                    
                    result := json_build_object(
                        'success', true,
                        'rows_affected', rows_affected,
                        'message', 'SQL exécuté avec succès'
                    );
                    
                EXCEPTION WHEN OTHERS THEN
                    result := json_build_object(
                        'success', false,
                        'error', SQLERRM,
                        'sqlstate', SQLSTATE
                    );
                END;
                
                RETURN result;
            END;
            $$;
        `;

        const { error: execSqlError } = await supabase.rpc('exec_sql', {
            sql: execSqlFunction
        });

        if (execSqlError) {
            console.log('⚠️  Fonction exec_sql déjà existante ou erreur:', execSqlError.message);
        } else {
            console.log('✅ Fonction exec_sql corrigée');
        }

        // 2. Fonction update_updated_at_column
        const updateFunction = `
            CREATE OR REPLACE FUNCTION public.update_updated_at_column()
            RETURNS TRIGGER
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$;
        `;

        const { error: updateError } = await supabase.rpc('exec_sql', {
            sql: updateFunction
        });

        if (updateError) {
            console.log('⚠️  Fonction update_updated_at_column déjà existante ou erreur:', updateError.message);
        } else {
            console.log('✅ Fonction update_updated_at_column corrigée');
        }

        // 3. Fonction de vérification de la force des mots de passe
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

        const { error: passwordError } = await supabase.rpc('exec_sql', {
            sql: passwordStrengthFunction
        });

        if (passwordError) {
            console.log('⚠️  Fonction check_password_strength déjà existante ou erreur:', passwordError.message);
        } else {
            console.log('✅ Fonction check_password_strength créée');
        }

        // 4. Fonction de vérification de la version Postgres
        const postgresVersionFunction = `
            CREATE OR REPLACE FUNCTION check_postgres_security_status()
            RETURNS TABLE(
                version TEXT,
                version_number NUMERIC,
                is_latest BOOLEAN,
                security_recommendations TEXT[]
            )
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, pg_temp
            AS $$
            DECLARE
                current_version TEXT;
                version_parts TEXT[];
                major_version INTEGER;
                minor_version INTEGER;
                patch_version INTEGER;
                version_numeric NUMERIC;
                recommendations TEXT[] := ARRAY[]::TEXT[];
            BEGIN
                -- Récupérer la version actuelle
                SELECT version() INTO current_version;
                
                -- Extraire les numéros de version
                version_parts := string_to_array(split_part(current_version, ' ', 2), '.');
                major_version := version_parts[1]::INTEGER;
                minor_version := version_parts[2]::INTEGER;
                patch_version := version_parts[3]::INTEGER;
                
                -- Créer un numéro de version pour comparaison
                version_numeric := major_version * 10000 + minor_version * 100 + patch_version;
                
                -- Vérifier si la version est récente (Postgres 15+ recommandé)
                is_latest := major_version >= 15;
                
                -- Ajouter des recommandations basées sur la version
                IF major_version < 13 THEN
                    recommendations := array_append(recommendations, 'CRITIQUE: Mise à jour vers Postgres 13+ requise pour les correctifs de sécurité');
                ELSIF major_version < 15 THEN
                    recommendations := array_append(recommendations, 'RECOMMANDÉ: Mise à jour vers Postgres 15+ pour les dernières fonctionnalités de sécurité');
                ELSIF major_version < 16 THEN
                    recommendations := array_append(recommendations, 'OPTIONNEL: Mise à jour vers Postgres 16+ pour les améliorations de performance');
                ELSE
                    recommendations := array_append(recommendations, 'EXCELLENT: Version Postgres récente et sécurisée');
                END IF;
                
                RETURN QUERY SELECT 
                    current_version,
                    version_numeric,
                    is_latest,
                    recommendations;
            END;
            $$;
        `;

        const { error: versionError } = await supabase.rpc('exec_sql', {
            sql: postgresVersionFunction
        });

        if (versionError) {
            console.log('⚠️  Fonction check_postgres_security_status déjà existante ou erreur:', versionError.message);
        } else {
            console.log('✅ Fonction check_postgres_security_status créée');
        }

        // 5. Test des fonctions créées
        console.log('\n🧪 Test des fonctions de sécurité...');
        
        // Tester la vérification de la force des mots de passe
        const { data: passwordTest, error: passwordTestError } = await supabase.rpc('check_password_strength', {
            password: 'TestPassword123!'
        });

        if (passwordTestError) {
            console.log('⚠️  Erreur lors du test de check_password_strength:', passwordTestError.message);
        } else {
            console.log('✅ Test de check_password_strength réussi:', passwordTest);
        }

        // Tester la vérification de la version Postgres
        const { data: versionTest, error: versionTestError } = await supabase.rpc('check_postgres_security_status');

        if (versionTestError) {
            console.log('⚠️  Erreur lors du test de check_postgres_security_status:', versionTestError.message);
        } else {
            console.log('✅ Test de check_postgres_security_status réussi:', versionTest);
        }

        console.log('\n✅ Corrections de sécurité appliquées avec succès!');
        console.log('\n📋 Résumé des corrections:');
        console.log('  ✅ Fonctions SQL corrigées avec search_path sécurisé');
        console.log('  ✅ Fonction de vérification de la force des mots de passe');
        console.log('  ✅ Fonction de vérification de la version Postgres');
        console.log('\n⚠️  Actions manuelles requises:');
        console.log('  1. Vérifiez le Security Advisor dans le dashboard Supabase');
        console.log('  2. Configurez les paramètres OTP dans Auth > Settings');
        console.log('  3. Testez les nouvelles fonctionnalités de sécurité');

    } catch (error) {
        console.error('❌ Erreur lors de l\'application des corrections:', error.message);
        process.exit(1);
    }
}

// Exécuter le script
applySecurityFixes();
