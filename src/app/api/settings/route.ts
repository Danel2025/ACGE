import { NextRequest, NextResponse } from 'next/server'

// GET - Récupérer les paramètres de l'application
export async function GET(request: NextRequest) {
  try {
    console.log('⚙️ Récupération des paramètres - Début')

    // Paramètres simulés pour les tests
    const settings = {
      appName: 'ACGE - Gestion Documentaire',
      version: '1.0.0',
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
      features: {
        folderCreation: true,
        documentUpload: true,
        documentSharing: true,
        userManagement: true
      },
      limits: {
        maxFoldersPerUser: 100,
        maxDocumentsPerFolder: 1000,
        maxFileSize: 10485760
      },
      security: {
        sessionTimeout: 15, // 15 minutes en minutes (pas en millisecondes)
        passwordExpiry: 90
      }
    }

    console.log('✅ Paramètres récupérés avec succès')

    return NextResponse.json({ 
      success: true,
      settings
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}

// POST - Mettre à jour les paramètres
export async function POST(request: NextRequest) {
  try {
    console.log('⚙️ Mise à jour des paramètres - Début')
    
    const body = await request.json()
    
    // Simulation de mise à jour
    console.log('✅ Paramètres mis à jour avec succès')

    return NextResponse.json({ 
      success: true,
      message: 'Paramètres mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    )
  }
}