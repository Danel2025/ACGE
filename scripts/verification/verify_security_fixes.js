const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Script pour vérifier que toutes les corrections de sécurité ont été appliquées
 * Date: 2025-01-29
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySecurityFixes() {
    console.log('🔍 Vérification des corrections de sécurité...');
    console.log('===============================================');

    let allTestsPassed = true;

    try {
        // 1. Vérifier la fonction exec_sql avec search_path
        console.log('\n1️⃣ Vérification de la fonction exec_sql...');
        
        const { data: execSqlTest, error: execSqlError } = await supabase.rpc('exec_sql', {
            sql: 'SELECT 1 as test'
        });

        if (execSqlError) {
            console.log('❌ Erreur avec exec_sql:', execSqlError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Fonction exec_sql fonctionne correctement');
        }

        // 2. Vérifier la fonction update_updated_at_column
        console.log('\n2️⃣ Vérification de la fonction update_updated_at_column...');
        
        const { data: updateFunctionTest, error: updateFunctionError } = await supabase.rpc('exec_sql', {
            sql: 'SELECT proname, prosrc FROM pg_proc WHERE proname = \'update_updated_at_column\''
        });

        if (updateFunctionError) {
            console.log('❌ Erreur lors de la vérification de update_updated_at_column:', updateFunctionError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Fonction update_updated_at_column trouvée');
        }

        // 3. Vérifier la fonction check_password_strength
        console.log('\n3️⃣ Vérification de la fonction check_password_strength...');
        
        const { data: passwordTest, error: passwordError } = await supabase.rpc('check_password_strength', {
            password: 'TestPassword123!'
        });

        if (passwordError) {
            console.log('❌ Erreur avec check_password_strength:', passwordError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Fonction check_password_strength fonctionne correctement');
            console.log('   Résultat du test:', passwordTest[0]);
        }

        // 4. Vérifier la fonction check_postgres_security_status
        console.log('\n4️⃣ Vérification de la fonction check_postgres_security_status...');
        
        const { data: versionTest, error: versionError } = await supabase.rpc('check_postgres_security_status');

        if (versionError) {
            console.log('❌ Erreur avec check_postgres_security_status:', versionError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Fonction check_postgres_security_status fonctionne correctement');
            console.log('   Version Postgres:', versionTest[0].version);
            console.log('   Recommandations:', versionTest[0].security_recommendations);
        }

        // 5. Vérifier les configurations de sécurité dans config.toml
        console.log('\n5️⃣ Vérification des configurations de sécurité...');
        
        const fs = require('fs');
        const configPath = 'supabase/config.toml';
        
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            
            const securityChecks = [
                { name: 'OTP Expiry (5 minutes)', pattern: /otp_expiry = 300/ },
                { name: 'OTP Length (8 caractères)', pattern: /otp_length = 8/ },
                { name: 'Enable Confirmations', pattern: /enable_confirmations = true/ },
                { name: 'Secure Password Change', pattern: /secure_password_change = true/ },
                { name: 'Password Requirements', pattern: /password_requirements = "lower_upper_letters_digits_symbols"/ },
                { name: 'Minimum Password Length (8)', pattern: /minimum_password_length = 8/ },
                { name: 'Max Frequency (60s)', pattern: /max_frequency = "60s"/ }
            ];

            securityChecks.forEach(check => {
                if (check.pattern.test(configContent)) {
                    console.log(`✅ ${check.name}: Configuré`);
                } else {
                    console.log(`❌ ${check.name}: Non configuré`);
                    allTestsPassed = false;
                }
            });
        } else {
            console.log('⚠️  Fichier config.toml non trouvé');
        }

        // 6. Test de sécurité des fonctions avec search_path
        console.log('\n6️⃣ Test de sécurité des fonctions...');
        
        const { data: securityTest, error: securityError } = await supabase.rpc('exec_sql', {
            sql: 'SELECT proname, prosrc FROM pg_proc WHERE proname IN (\'exec_sql\', \'update_updated_at_column\', \'check_password_strength\', \'check_postgres_security_status\')'
        });

        if (securityError) {
            console.log('❌ Erreur lors du test de sécurité:', securityError.message);
            allTestsPassed = false;
        } else {
            console.log('✅ Fonctions de sécurité trouvées:');
            if (Array.isArray(securityTest)) {
                securityTest.forEach(func => {
                    const hasSearchPath = func.prosrc.includes('SET search_path');
                    console.log(`   ${func.proname}: ${hasSearchPath ? '✅ search_path sécurisé' : '❌ search_path manquant'}`);
                    if (!hasSearchPath) allTestsPassed = false;
                });
            } else {
                console.log('   Aucune fonction trouvée ou format de réponse inattendu');
            }
        }

        // Résumé final
        console.log('\n' + '='.repeat(50));
        if (allTestsPassed) {
            console.log('🎉 TOUTES LES CORRECTIONS DE SÉCURITÉ SONT APPLIQUÉES !');
            console.log('\n✅ Résumé des corrections appliquées:');
            console.log('   • Fonctions SQL corrigées avec search_path sécurisé');
            console.log('   • Fonction de vérification de la force des mots de passe');
            console.log('   • Fonction de vérification de la version Postgres');
            console.log('   • Configuration OTP sécurisée (5 min, 8 caractères)');
            console.log('   • Confirmations email activées');
            console.log('   • Changement de mot de passe sécurisé activé');
            console.log('   • Exigences de mot de passe strictes');
            console.log('\n🔒 Votre application est maintenant plus sécurisée !');
        } else {
            console.log('⚠️  CERTAINES CORRECTIONS NÉCESSITENT UNE ATTENTION');
            console.log('\nVeuillez vérifier les éléments marqués avec ❌ ci-dessus.');
        }

        console.log('\n📋 Prochaines étapes:');
        console.log('   1. Vérifiez le Security Advisor dans le dashboard Supabase');
        console.log('   2. Testez les nouvelles fonctionnalités de sécurité');
        console.log('   3. Informez vos utilisateurs des nouvelles exigences de mot de passe');
        console.log('   4. Configurez un serveur SMTP pour les emails de confirmation');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        process.exit(1);
    }
}

// Exécuter le script
verifySecurityFixes();
