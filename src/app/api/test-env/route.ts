import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Configurée' : '❌ Non configurée',
    DIRECT_URL: process.env.DIRECT_URL ? '✅ Configurée' : '❌ Non configurée',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}
