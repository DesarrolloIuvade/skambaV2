import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('kamba_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname === '/';
  const isDashboardPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/space') ||
    pathname.startsWith('/task');

  // Si no hay token en cookie pero intenta acceder a ruta protegida,
  // no redirigir a login (el cliente puede tener el token en localStorage)
  // El cliente se encargará de cargar los datos con el token de localStorage
  if (!token && isDashboardPage) {
    // Allow access - the client side will handle authentication
    // If the token is truly missing, the API calls will fail and user will be redirected to login
    return NextResponse.next();
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
    '/',
  ],
};
