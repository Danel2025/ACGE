import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Vérifier si l'utilisateur de test existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test@acge.com')
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Utilisateur de test existe déjà',
        user: existingUser
      })
    }

    // Créer un mot de passe hashé simple
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('test123', 10)

    // Créer l'utilisateur de test
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'test@acge.com',
        name: 'Utilisateur Test',
        role: 'USER',
        password: hashedPassword
      })
      .select('id, email, name, role')
      .single()

    if (createError) {
      console.error('Erreur création utilisateur test:', createError)
      return NextResponse.json(
        { error: 'Erreur création utilisateur test' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur de test créé',
      user: newUser,
      credentials: {
        email: 'test@acge.com',
        password: 'test123'
      }
    })

  } catch (error) {
    console.error('Erreur création utilisateur test:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
