import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { CacheRevalidation } from '@/lib/revalidation-utils'
import { generateQuitusHash, generateQuitusQRCode, generateQuitusNumber } from '@/lib/quitus-security'
import { sendQuitusEmail } from '@/lib/email-service'
import { archiveQuitus } from '@/lib/quitus-archive'

/**
 * 📄 API GÉNÉRATION QUITUS - ACGE
 *
 * Génère automatiquement un quitus pour un dossier validé définitivement
 */

// Forcer le mode dynamique
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET pour les tests - retourne les informations du quitus existant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    const admin = getSupabaseAdmin()
    
    // Vérifier si un quitus existe déjà pour ce dossier
    const { data: existingQuitus, error } = await admin
      .from('quitus')
      .select('*')
      .eq('dossierId', dossierId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du quitus' },
        { status: 500 }
      )
    }

    if (existingQuitus) {
      return NextResponse.json({
        success: true,
        quitus: existingQuitus,
        message: 'Quitus déjà généré'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Aucun quitus généré pour ce dossier. Utilisez POST pour en créer un.'
      })
    }

  } catch (error) {
    console.error('❌ Erreur GET quitus:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du quitus' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const dossierId = resolvedParams.id
    
    console.log('📄 Génération du quitus pour dossier:', dossierId)
    
    const admin = getSupabaseAdmin()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Service de base de données indisponible' },
        { status: 503 }
      )
    }
    
    // 1. Récupérer les informations complètes du dossier
    const { data: dossier, error: dossierError } = await admin
      .from('dossiers')
      .select(`
        *,
        poste_comptable:posteComptableId(*),
        nature_document:natureDocumentId(*),
        secretaire:secretaireId(id, name, email)
      `)
      .eq('id', dossierId)
      .single()

    if (dossierError) {
      console.error('❌ Erreur récupération dossier:', dossierError)
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // 🔍 Debug: Afficher les noms de colonnes disponibles
    console.log('🔍 Colonnes du dossier récupérées:', Object.keys(dossier))

    // Vérifier que le dossier est validé définitivement ou terminé (pour régénération)
    if (dossier.statut !== 'VALIDÉ_DÉFINITIVEMENT' && dossier.statut !== 'TERMINÉ') {
      return NextResponse.json(
        { error: 'Seuls les dossiers validés définitivement ou terminés peuvent générer un quitus' },
        { status: 400 }
      )
    }

    // 2. Récupérer le rapport de vérification complet
    const rapportResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dossiers/${dossierId}/rapport-verification`)
    
    if (!rapportResponse.ok) {
      return NextResponse.json(
        { error: 'Impossible de récupérer le rapport de vérification' },
        { status: 500 }
      )
    }
    
    const rapportData = await rapportResponse.json()
    const rapport = rapportData.rapport

    // 3. Vérifier si un quitus existe déjà pour ce dossier
    const { data: existingQuitus, error: existingError } = await admin
      .from('quitus')
      .select('*')
      .eq('dossier_id', dossierId)
      .single()

    if (existingQuitus && !existingError) {
      console.log('📄 Quitus existant trouvé, retour du quitus existant')
      return NextResponse.json({
        success: true,
        message: `Quitus ${existingQuitus.id} récupéré (déjà généré)`,
        quitus: existingQuitus.contenu,
        existing: true
      })
    }

    // 3. Générer les données du quitus avec sécurité
    const numeroQuitus = generateQuitusNumber(dossier.numeroDossier)

    const quitusData = {
      // Informations générales
      numeroQuitus,
      dateGeneration: new Date().toISOString(),
      
      // Informations du dossier
      dossier: {
        numero: dossier.numeroDossier,
        objet: dossier.objetOperation,
        beneficiaire: dossier.beneficiaire,
        posteComptable: dossier.poste_comptable?.intitule || 'Non défini',
        natureDocument: dossier.nature_document?.nom || 'Non défini',
        dateDepot: dossier.dateDepot
      },
      
      // Historique des validations
      historique: {
        creation: {
          date: dossier.createdAt || dossier.created_at,
          par: dossier.secretaire?.name || 'Secrétaire'
        },
        validationCB: {
          date: dossier.validatedCBAt || dossier.validated_cb_at || dossier.validatedat || null,
          statut: 'VALIDÉ_CB'
        },
        ordonnancement: {
          date: dossier.ordonnancedAt || dossier.ordonnanced_at || null,
          commentaire: dossier.ordonnancementComment || dossier.ordonnancement_comment || null,
          montant: dossier.montantOrdonnance || dossier.montant_ordonnance || 0
        },
        validationDefinitive: {
          date: dossier.validatedDefinitivelyAt || dossier.validated_definitively_at || null,
          commentaire: dossier.validationDefinitiveComment || dossier.validation_definitive_comment || null
        }
      },
      
      // Synthèse des vérifications
      verifications: {
        cb: {
          total: rapport.statistiquesGlobales.cb.total,
          valides: rapport.statistiquesGlobales.cb.valides,
          rejetes: rapport.statistiquesGlobales.cb.rejetes,
          statut: rapport.statistiquesGlobales.cb.statut,
          categories: rapport.voletCB.controlesParCategorie.map((cat: any) => ({
            nom: cat.categorie.nom,
            total: cat.controles.length,
            valides: cat.controles.filter((c: any) => c.valide).length
          }))
        },
        ordonnateur: {
          total: rapport.statistiquesGlobales.ordonnateur.total,
          valides: rapport.statistiquesGlobales.ordonnateur.valides,
          rejetes: rapport.statistiquesGlobales.ordonnateur.rejetes,
          statut: rapport.statistiquesGlobales.ordonnateur.statut,
          categories: rapport.voletOrdonnateur.verificationsParCategorie.map((cat: any) => ({
            nom: cat.categorie.nom,
            total: cat.verifications.length,
            valides: cat.verifications.filter((v: any) => v.valide).length
          }))
        }
      },
      
      // Incohérences détectées
      incoherences: rapport.incoherences,
      
      // Conclusion
      conclusion: {
        conforme: rapport.incoherences.length === 0,
        recommandations: rapport.incoherences.length > 0
          ? 'Des incohérences ont été détectées et doivent être résolues.'
          : 'Toutes les vérifications sont conformes. Le dossier peut être traité.',
        signature: {
          fonction: 'Agent Comptable',
          date: new Date().toISOString(),
          lieu: 'Libreville, Gabon'
        }
      }
    }

    // Générer le hash de vérification
    const verificationHash = generateQuitusHash(quitusData)

    // Générer le QR code
    const qrCodeDataUrl = await generateQuitusQRCode(numeroQuitus, verificationHash)

    // Ajouter les informations de sécurité au quitus
    quitusData.securite = {
      hash: verificationHash,
      qrCode: qrCodeDataUrl,
      watermark: 'ORIGINAL',
      dateGeneration: new Date().toISOString()
    }

    // 4. Sauvegarder le quitus en base de données
    const { data: quitusRecord, error: quitusError } = await admin
      .from('quitus')
      .insert([{
        id: quitusData.numeroQuitus,
        dossier_id: dossierId,
        contenu: quitusData,
        statut: 'GÉNÉRÉ',
        genere_le: new Date().toISOString()
      }])
      .select()
      .single()

    if (quitusError) {
      console.error('❌ Erreur sauvegarde quitus:', quitusError)
      // Continuer même si la sauvegarde échoue
    }

    console.log('✅ Quitus généré avec succès:', quitusData.numeroQuitus)

    // 5. Mettre à jour le statut du dossier à TERMINÉ (seulement si pas déjà terminé)
    if (dossier.statut !== 'TERMINÉ') {
      console.log('🔄 Tentative de mise à jour du statut à TERMINÉ pour dossier:', dossierId)

      const { data: updateData, error: updateError } = await admin
        .from('dossiers')
        .update({
          statut: 'TERMINÉ',
          quitus_numero: numeroQuitus,
          termine_le: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', dossierId)
        .select()

      if (updateError) {
        console.error('❌ Erreur mise à jour statut dossier:', updateError)
        console.error('❌ Détails:', JSON.stringify(updateError, null, 2))
      } else {
        console.log('✅ Statut du dossier mis à jour : TERMINÉ')
        console.log('✅ Données mises à jour:', updateData)
      }
    } else {
      console.log('ℹ️ Dossier déjà TERMINÉ, régénération du quitus uniquement')
    }

    // 6. Créer une notification pour toutes les parties prenantes
    const notificationsToCreate = [
      {
        user_id: dossier.secretaire?.id,
        type: 'QUITUS_GENERE',
        title: 'Quitus généré',
        message: `Le quitus ${numeroQuitus} a été généré pour le dossier ${dossier.numeroDossier}`,
        dossier_id: dossierId,
        metadata: {
          numeroQuitus,
          verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-quitus/${numeroQuitus}`
        }
      }
    ]

    // Ajouter les notifications
    const { error: notifError } = await admin
      .from('notifications')
      .insert(notificationsToCreate)

    if (notifError) {
      console.warn('⚠️ Erreur création notifications:', notifError)
    } else {
      console.log('✅ Notifications créées pour les parties prenantes')
    }

    // 7. Archiver le quitus de manière sécurisée
    const archiveResult = await archiveQuitus(numeroQuitus, quitusData)

    if (archiveResult.success) {
      console.log('✅ Quitus archivé avec succès')
      console.log('📦 URL d\'accès:', archiveResult.archiveUrl)
    } else {
      console.warn('⚠️ Erreur archivage quitus:', archiveResult.error)
    }

    // 8. Envoyer l'email avec le quitus (si email configuré)
    if (dossier.secretaire?.email) {
      const emailResult = await sendQuitusEmail(
        dossier.secretaire.email,
        dossier.secretaire.name || 'Secrétaire',
        quitusData
      )

      if (emailResult.success) {
        console.log('✅ Email envoyé à:', dossier.secretaire.email)
      } else {
        console.warn('⚠️ Erreur envoi email:', emailResult.error)
      }
    }

    // 🔄 REVALIDATION DU CACHE
    try {
      await CacheRevalidation.revalidateQuitus(dossierId)
      console.log('🔄 Cache invalidé après génération quitus')
    } catch (revalidateError) {
      console.warn('⚠️ Erreur revalidation cache:', revalidateError)
    }

    return NextResponse.json(
      {
        success: true,
        message: `Quitus ${quitusData.numeroQuitus} généré avec succès`,
        quitus: quitusData
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate'
        }
      }
    )

  } catch (error) {
    console.error('❌ Erreur génération quitus:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}
