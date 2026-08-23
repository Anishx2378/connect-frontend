import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.has('token')
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isRegisterPage = request.nextUrl.pathname === '/register'
  
  const isPublicPage = isLoginPage || isRegisterPage || 
                       request.nextUrl.pathname === '/accept-invite' || 
                       request.nextUrl.pathname === '/complete-invite' || 
                       request.nextUrl.pathname === '/verify-email'

  // If not authenticated and not on a public page, redirect to login
  if (!isAuth && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated and on login or register page, redirect to dashboard
  if (isAuth && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Protect all routes except static assets and API routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
