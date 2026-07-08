import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const auth = request.cookies.get('auth')?.value
  const { pathname } = request.nextUrl

  const esRutaPublica =
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'

  if (esRutaPublica) {
    return NextResponse.next()
  }

  if (!auth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/vender', '/stock/:path*', '/reportes/:path*', '/cierre-caja/:path*', '/api/:path*'],
}
