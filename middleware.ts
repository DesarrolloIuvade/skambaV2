import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('kamba_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname === '/';
  const isDashboardPage = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/workspace') || 
                          pathname.startsWith('/space') || 
                          pathname.startsWith('/task');

  // Si no hay token e intenta acceder a una ruta protegida, redirigir a login
  if (!token && isDashboardPage) {
    const loginUrl = new URL('/login', request.url);
    // Podríamos guardar la URL original para redirigir después del login
    // loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si tiene token e intenta ir al login, mandarlo al dashboard (o workspace)
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Rutas que el middleware debe vigilar
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workspace/:path*',
    '/space/:path*',
    '/task/:path*',
    '/login',
    '/'
  ],
};
