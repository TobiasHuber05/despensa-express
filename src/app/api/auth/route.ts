import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { pin } = await request.json()

  if (!pin) {
    return NextResponse.json({ error: 'PIN requerido' }, { status: 400 })
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { pin },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
    }

    const res = NextResponse.json({
      ok: true,
      usuario: { pin: usuario.pin, nombre: usuario.nombre, rol: usuario.rol },
    })

    res.cookies.set('auth', usuario.pin, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return res
  } catch (error) {
    console.error('Error al autenticar:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
