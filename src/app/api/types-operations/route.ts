import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: types, error } = await supabase
      .from('types_operations')
      .select('*')
      .eq('actif', true)
      .order('nom')

    if (error) {
      console.error('Erreur lors de la récupération des types:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des types d\'opérations' }, { status: 500 })
    }

    return NextResponse.json({ types: types || [] })
  } catch (error) {
    console.error('Erreur lors de la récupération des types:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des types d\'opérations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const typeData = await request.json()
    
    const { data: type, error } = await supabase
      .from('types_operations')
      .insert([typeData])
      .select()
      .single()

    if (error) {
      console.error('Erreur lors de la création du type:', error)
      return NextResponse.json({ error: 'Erreur lors de la création du type d\'opération' }, { status: 500 })
    }

    return NextResponse.json({ type })
  } catch (error) {
    console.error('Erreur lors de la création du type:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du type d\'opération' }, { status: 500 })
  }
}