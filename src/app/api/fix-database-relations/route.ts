import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Vérification et correction des relations de base de données...')
    
    const admin = getSupabaseAdmin()
    
    // 1. Vérifier la structure des tables
    console.log('1️⃣ Vérification de la structure des tables...')
    
    const { data: documentsColumns, error: docsError } = await admin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (docsError) {
      console.error('Erreur récupération colonnes documents:', docsError)
    }

    const { data: versionsColumns, error: versionsError } = await admin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'document_versions')
      .eq('table_schema', 'public')
      .order('ordinal_position')

    if (versionsError) {
      console.error('Erreur récupération colonnes document_versions:', versionsError)
    }

    // 2. Vérifier les contraintes de clés étrangères
    console.log('2️⃣ Vérification des contraintes de clés étrangères...')
    
    const { data: constraints, error: constraintsError } = await admin
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type,
        table_name
      `)
      .eq('table_schema', 'public')
      .in('table_name', ['documents', 'document_versions'])
      .eq('constraint_type', 'FOREIGN KEY')

    if (constraintsError) {
      console.error('Erreur récupération contraintes:', constraintsError)
    }

    // 3. Vérifier les données existantes
    console.log('3️⃣ Vérification des données existantes...')
    
    const { data: documents, error: docsDataError } = await admin
      .from('documents')
      .select('id, title, current_version_id')
      .limit(5)

    if (docsDataError) {
      console.error('Erreur récupération documents:', docsDataError)
    }

    const { data: versions, error: versionsDataError } = await admin
      .from('document_versions')
      .select('id, document_id, file_name')
      .limit(5)

    if (versionsDataError) {
      console.error('Erreur récupération versions:', versionsDataError)
    }

    // 4. Tenter de créer les contraintes manquantes
    console.log('4️⃣ Création des contraintes manquantes...')
    
    let constraintResults = []
    
    // Vérifier si la contrainte fk_documents_current_version_id existe
    const hasCurrentVersionConstraint = constraints?.some(c => 
      c.constraint_name === 'fk_documents_current_version_id'
    )

    if (!hasCurrentVersionConstraint) {
      try {
        console.log('Création de la contrainte fk_documents_current_version_id...')
        const { error: constraintError } = await admin.rpc('exec_sql', {
          sql: `
            ALTER TABLE public.documents 
            ADD CONSTRAINT fk_documents_current_version_id 
            FOREIGN KEY (current_version_id) REFERENCES document_versions(id);
          `
        })
        
        if (constraintError) {
          console.error('Erreur création contrainte current_version_id:', constraintError)
          constraintResults.push({
            name: 'fk_documents_current_version_id',
            status: 'error',
            error: constraintError.message
          })
        } else {
          console.log('✅ Contrainte fk_documents_current_version_id créée')
          constraintResults.push({
            name: 'fk_documents_current_version_id',
            status: 'success'
          })
        }
      } catch (error) {
        console.error('Erreur lors de la création de la contrainte:', error)
        constraintResults.push({
          name: 'fk_documents_current_version_id',
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    } else {
      constraintResults.push({
        name: 'fk_documents_current_version_id',
        status: 'exists',
        message: 'Contrainte déjà existante'
      })
    }

    // Vérifier si la contrainte fk_document_versions_document_id existe
    const hasDocumentIdConstraint = constraints?.some(c => 
      c.constraint_name === 'fk_document_versions_document_id'
    )

    if (!hasDocumentIdConstraint) {
      try {
        console.log('Création de la contrainte fk_document_versions_document_id...')
        const { error: constraintError } = await admin.rpc('exec_sql', {
          sql: `
            ALTER TABLE public.document_versions 
            ADD CONSTRAINT fk_document_versions_document_id 
            FOREIGN KEY (document_id) REFERENCES documents(id);
          `
        })
        
        if (constraintError) {
          console.error('Erreur création contrainte document_id:', constraintError)
          constraintResults.push({
            name: 'fk_document_versions_document_id',
            status: 'error',
            error: constraintError.message
          })
        } else {
          console.log('✅ Contrainte fk_document_versions_document_id créée')
          constraintResults.push({
            name: 'fk_document_versions_document_id',
            status: 'success'
          })
        }
      } catch (error) {
        console.error('Erreur lors de la création de la contrainte:', error)
        constraintResults.push({
          name: 'fk_document_versions_document_id',
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    } else {
      constraintResults.push({
        name: 'fk_document_versions_document_id',
        status: 'exists',
        message: 'Contrainte déjà existante'
      })
    }

    // 5. Tester la jointure
    console.log('5️⃣ Test de la jointure...')
    
    let joinTestResult = null
    try {
      const { data: joinTest, error: joinError } = await admin
        .from('documents')
        .select(`
          id,
          title,
          document_versions!fk_documents_current_version_id (
            id,
            file_name,
            file_path,
            file_type,
            file_size
          )
        `)
        .limit(1)

      if (joinError) {
        joinTestResult = {
          status: 'error',
          error: joinError.message
        }
      } else {
        joinTestResult = {
          status: 'success',
          data: joinTest
        }
      }
    } catch (error) {
      joinTestResult = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        documentsColumns,
        versionsColumns,
        constraints,
        documents: documents?.length || 0,
        versions: versions?.length || 0,
        constraintResults,
        joinTest: joinTestResult
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification de la base de données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
