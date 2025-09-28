import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Création dossier simple - Début')

    const body = await request.json()
    const { numeroNature, objetOperation, beneficiaire, posteComptableId, natureDocumentId, montant } = body

    if (!numeroNature || !numeroNature.trim()) {
      return NextResponse.json({ error: 'Le numéro de nature est requis' }, { status: 400 })
    }
    if (!objetOperation || !objetOperation.trim()) {
      return NextResponse.json({ error: 'L\'objet de l\'opération est requis' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Générer le numéro de dossier automatiquement
    const year = new Date().getFullYear()
    const { data: lastDossier } = await admin
      .from('dossiers')
      .select('numeroDossier')
      .like('numeroDossier', `${year}%`)
      .order('numeroDossier', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextNumber = 1
    if (lastDossier?.numeroDossier) {
      const lastNumber = parseInt(lastDossier.numeroDossier.substring(4))
      nextNumber = lastNumber + 1
    }

    const numeroDossier = `${year}${String(nextNumber).padStart(4, '0')}`

    // Créer le dossier
    const now = new Date().toISOString()
    const { data: newDossier, error: insertError } = await admin
      .from('dossiers')
      .insert({
        id: randomUUID(),
        numeroDossier,
        numeroNature: numeroNature.trim(),
        objetOperation: objetOperation.trim(),
        beneficiaire: beneficiaire?.trim() || null,
        posteComptableId: posteComptableId || null,
        natureDocumentId: natureDocumentId || null,
        montant: montant || null,
        statut: 'BROUILLON',
        secretaireId: 'cmebotahv0000c17w3izkh2k9', // TODO: récupérer depuis la session
        createdAt: now,
        updatedAt: now
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('❌ Erreur insertion dossier:', insertError)
      return NextResponse.json({
        error: insertError.message,
        code: insertError.code,
        details: insertError.details
      }, { status: 500 })
    }

    console.log('✅ Dossier créé:', newDossier.numeroDossier)

    return NextResponse.json({ dossier: newDossier }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📁 Récupération dossiers simples - Début')

    const admin = getSupabaseAdmin()

    const { data: dossiers, error } = await admin
      .from('dossiers')
      .select(`
        id,
        numeroDossier,
        numeroNature,
        objetOperation,
        beneficiaire,
        statut,
        montant,
        createdAt,
        updatedAt
      `)
      .order('numeroDossier', { ascending: true })

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error)
      return NextResponse.json({
        dossiers: [],
        error: error.message
      }, { status: 500 })
    }

    console.log(`📁 ${dossiers?.length || 0} dossiers trouvés`)

    return NextResponse.json({ dossiers })

  } catch (error) {
    console.error('Erreur API dossiers:', error)
    return NextResponse.json({
      dossiers: [],
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
