import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * 🚀 API FICHIER DOCUMENT - ACGE
 * 
 * Cette API gère l'accès aux fichiers avec le pattern file-{timestamp}-{id}
 * - Authentification JWT requise
 * - Lecture depuis le stockage local
 * - Gestion des erreurs robuste
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📁 API Fichier Document - Début')
    
    // Vérifier l'authentification
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('❌ Pas de token d\'authentification')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'unified-jwt-secret-for-development') as any
    const userId = decoded.userId
    const userRole = decoded.role
    console.log('✅ Utilisateur authentifié:', userId, 'Rôle:', userRole)

    const resolvedParams = await params
    const fileId = resolvedParams.id
    console.log('📄 File ID:', fileId)

    // Valider le format du fileId (file-{timestamp}-{id})
    if (!fileId.startsWith('file-') || fileId.split('-').length < 3) {
      console.log('❌ Format de fileId invalide:', fileId)
      return NextResponse.json(
        { error: 'Format de fichier invalide' },
        { status: 400 }
      )
    }

    // Récupérer le nom de fichier depuis le mapping
    const mappingPath = join(process.cwd(), 'file-mapping.json')
    let fileMapping: { [key: string]: string } = {}
    
    try {
      if (existsSync(mappingPath)) {
        const mappingData = await readFile(mappingPath, 'utf-8')
        fileMapping = JSON.parse(mappingData)
      }
    } catch (error) {
      console.log('⚠️ Impossible de lire le mapping des fichiers')
    }

    const targetFile = fileMapping[fileId]
    
    if (!targetFile) {
      console.log('❌ FileId non trouvé dans le mapping:', fileId)
      console.log('📁 Mappings disponibles:', Object.keys(fileMapping))
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      )
    }

    const uploadsDir = join(process.cwd(), 'uploads')
    const targetFilePath = join(uploadsDir, targetFile)

    if (!existsSync(targetFilePath)) {
      console.log('❌ Fichier physique non trouvé:', targetFilePath)
      return NextResponse.json(
        { error: 'Fichier non trouvé sur le serveur' },
        { status: 404 }
      )
    }

    console.log('📁 Fichier trouvé:', targetFile)

    // Lire le fichier
    const fileBuffer = await readFile(targetFilePath)
    
    // Déterminer le type MIME
    const ext = targetFile.split('.').pop()?.toLowerCase()
    let mimeType = 'application/octet-stream'
    
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    }

    if (ext && mimeTypes[ext]) {
      mimeType = mimeTypes[ext]
    }

    console.log('✅ Fichier servi avec succès:', targetFile, 'Type:', mimeType, 'Taille:', fileBuffer.length)

    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${targetFile}"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du fichier:', error)

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
