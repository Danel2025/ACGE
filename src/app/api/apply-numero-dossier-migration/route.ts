import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Application de la migration numeroDossier...')

    const supabase = getSupabaseAdmin()

    // Lire le script de migration
    const migrationPath = join(process.cwd(), 'scripts', 'apply_numero_dossier_migration.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Erreur lors de l\'application de la migration:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details
      }, { status: 500 })
    }

    console.log('✅ Migration appliquée avec succès')

    // Vérifier la structure de la table après la migration
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'folders')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    return NextResponse.json({
      success: true,
      message: 'Migration appliquée avec succès',
      schema: schemaData || [],
      schemaError: schemaError?.message || null
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'application de la migration',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
