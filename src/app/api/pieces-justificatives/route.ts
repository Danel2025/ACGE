import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const natureId = searchParams.get('nature_id')

    if (!natureId) {
      return NextResponse.json({ error: 'nature_id est requis' }, { status: 400 })
    }

    const { data: pieces, error } = await supabase
      .from('pieces_justificatives')
      .select('*')
      .eq('nature_operation_id', natureId)
      .eq('actif', true)
      .order('ordre')

    if (error) {
      console.error('Erreur lors de la récupération des pièces:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des pièces justificatives' }, { status: 500 })
    }

    return NextResponse.json({ pieces: pieces || [] })
  } catch (error) {
    console.error('Erreur lors de la récupération des pièces:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des pièces justificatives' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const pieceData = await request.json()
    
    const { data: piece, error } = await supabase
      .from('pieces_justificatives')
      .insert([pieceData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création de la pièce:', error)
      return NextResponse.json({ error: 'Erreur lors de la création de la pièce justificative' }, { status: 500 })
    }

    return NextResponse.json({ piece })
  } catch (error) {
    console.error('Erreur lors de la création de la pièce:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la pièce justificative' }, { status: 500 })
  }
}