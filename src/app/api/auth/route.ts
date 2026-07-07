import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { pin } = await request.json()

  if (!process.env.APP_PIN) {
    console.error('APP_PIN no está configurado')
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  if (pin === process.env.APP_PIN) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('auth', process.env.APP_PIN, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  }

  return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
}
