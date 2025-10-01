import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { verifyQuitusIntegrity } from '@/lib/quitus-security'

/**
 * 🔐 API VÉRIFICATION AUTHENTICITÉ QUITUS - ACGE
 *
 * Vérifie l'authenticité d'un quitus via son hash de vérification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numeroQuitus: string }> }
) {
  try {
    const resolvedParams = await params
    const numeroQuitus = resolvedParams.numeroQuitus
    const { searchParams } = new URL(request.url)
    const providedHash = searchParams.get('hash')

    console.log('🔐 Vérification du quitus:', numeroQuitus)

    if (!providedHash) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Hash de vérification manquant'
        },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    if (!admin) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Service indisponible'
        },
        { status: 503 }
      )
    }

    // Rechercher le quitus dans la base de données
    const { data: quitusRecord, error: quitusError } = await admin
      .from('quitus')
      .select('*')
      .eq('id', numeroQuitus)
      .single()

    if (quitusError || !quitusRecord) {
      console.error('❌ Quitus non trouvé:', numeroQuitus)
      return NextResponse.json(
        {
          valid: false,
          error: 'Quitus non trouvé',
          message: 'Ce numéro de quitus n\'existe pas dans notre système'
        },
        { status: 404 }
      )
    }

    // Vérifier l'intégrité du quitus
    const quitusData = quitusRecord.contenu
    const isValid = verifyQuitusIntegrity(quitusData, providedHash)

    if (isValid) {
      console.log('✅ Quitus authentique:', numeroQuitus)

      // Enregistrer la vérification
      await admin.from('quitus_verifications').insert({
        quitus_id: numeroQuitus,
        verifie_le: new Date().toISOString(),
        resultat: 'AUTHENTIQUE',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

      return NextResponse.json({
        valid: true,
        message: 'Document authentique',
        quitus: quitusData
      })
    } else {
      console.warn('⚠️ Quitus non authentique ou modifié:', numeroQuitus)

      // Enregistrer la tentative de vérification échouée
      await admin.from('quitus_verifications').insert({
        quitus_id: numeroQuitus,
        verifie_le: new Date().toISOString(),
        resultat: 'NON_AUTHENTIQUE',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

      return NextResponse.json(
        {
          valid: false,
          error: 'Document non authentique',
          message: 'Le hash de vérification ne correspond pas. Le document a peut-être été modifié.'
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Erreur vérification quitus:', error)
    return NextResponse.json(
      {
        valid: false,
        error: 'Erreur de vérification',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
