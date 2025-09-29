import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'
import { CacheInvalidation } from '@/lib/cache'
import { verify } from 'jsonwebtoken'

type CreateDossierBody = {
  nomDossier?: string
  description?: string
  numeroNature?: string
  objetOperation?: string
  beneficiaire?: string
  posteComptableId?: string
  natureDocumentId?: string
  montant?: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Création dossier - Début')

    const body = await request.json()
    const { nomDossier, description, numeroNature, objetOperation, beneficiaire, posteComptableId, natureDocumentId, montant } = body

    console.log('📋 Données reçues pour création:', {
      nomDossier,
      description,
      numeroNature,
      objetOperation,
      beneficiaire,
      posteComptableId,
      natureDocumentId,
      montant
    })

    if (!nomDossier || !nomDossier.trim()) {
      return NextResponse.json({ error: 'Le nom du dossier est requis' }, { status: 400 })
    }
    if (!objetOperation || !objetOperation.trim()) {
      return NextResponse.json({ error: 'L\'objet de l\'opération est requis' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Get user from auth token
    let userData = null
    const authToken = request.cookies.get('auth-token')?.value

    if (authToken) {
      try {
        const decoded = verify(authToken, process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'unified-jwt-secret-for-development') as any
        const userId = decoded.userId

        const { data: user, error: userError } = await admin
          .from('users')
          .select('id, name, email, role')
          .eq('id', userId)
          .single()

        if (!userError && user) {
          userData = user
        }
      } catch (jwtError) {
        console.log('⚠️ JWT cookie invalide:', jwtError)
      }
    }

    // Générer le numéro de dossier automatiquement avec le format DOSS-ACGE-[date]-[id]
    const dossierId = randomUUID()
    const today = new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
    const shortId = dossierId.substring(0, 8) // Utiliser les 8 premiers caractères de l'UUID
    const numeroDossier = `DOSS-ACGE-${today}-${shortId}`

    // Créer le dossier dans la table dossiers
    const now = new Date().toISOString()
    const { data: newDossier, error: insertError } = await admin
      .from('dossiers')
      .insert({
        id: dossierId,
        foldername: nomDossier.trim(),
        numeroDossier,
        numeroNature: numeroNature?.trim() || '',
        objetOperation: objetOperation.trim(),
        beneficiaire: beneficiaire?.trim() || null,
        posteComptableId: posteComptableId || null,
        natureDocumentId: natureDocumentId || null,
        montant: montant || null,
        statut: 'BROUILLON',
        secretaireId: userData?.id || null,
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

    console.log('✅ Dossier créé avec succès:', {
      numeroDossier: newDossier?.numeroDossier,
      foldername: newDossier?.foldername,
      numeroNature: newDossier?.numeroNature,
      objetOperation: newDossier?.objetOperation,
      beneficiaire: newDossier?.beneficiaire,
      montant: newDossier?.montant,
      posteComptableId: newDossier?.posteComptableId,
      natureDocumentId: newDossier?.natureDocumentId
    })

    // Invalider le cache
    CacheInvalidation.onFolderChange()

    return NextResponse.json({ dossier: newDossier }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error)

    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📁 Récupération dossiers - Début')

    const admin = getSupabaseAdmin()

    // Récupérer les dossiers depuis la table dossiers
    const { data: dossiers, error } = await admin
      .from('dossiers')
      .select(`
        id,
        foldername,
        numeroDossier,
        numeroNature,
        objetOperation,
        beneficiaire,
        statut,
        montant,
        createdAt,
        updatedAt,
        posteComptableId,
        natureDocumentId,
        secretaireId,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error)
      return NextResponse.json({
        dossiers: [],
        error: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`📁 ${dossiers?.length || 0} dossiers trouvés dans table dossiers`)

    // Enrichir chaque dossier avec le nombre de documents
    const enrichedDossiers = await Promise.all(
      (dossiers || []).map(async (dossier) => {
        try {
          // Compter les documents pour ce dossier
          const { count } = await admin
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('dossierId', dossier.id)

          return {
            ...dossier,
            _count: {
              documents: count || 0
            }
          }
        } catch (error) {
          console.error(`❌ Erreur comptage documents pour dossier ${dossier.id}:`, error)
          return {
            ...dossier,
            _count: {
              documents: 0
            }
          }
        }
      })
    )

    return NextResponse.json({ dossiers: enrichedDossiers })

  } catch (error) {
    console.error('Erreur API dossiers:', error)

    return NextResponse.json({
      dossiers: [],
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}
