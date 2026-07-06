import { NextResponse } from 'next/server'

export function middleware(request) {
  const auth = request.cookies.get('auth')?.value
  const { pathname } = request.nextUrl

  const esRutaPublica =
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (esRutaPublica) {
    return NextResponse.next()
  }

  if (auth !== process.env.APP_PIN) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}