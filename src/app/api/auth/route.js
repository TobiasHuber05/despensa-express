import { NextResponse } from 'next/server'

export async function POST(request) {
  const { pin } = await request.json()

  if (pin === process.env.APP_PIN) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('auth', process.env.APP_PIN, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    })
    return res
  }

  return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
}