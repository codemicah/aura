import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require wallet connection and risk profile
const protectedRoutes = ['/dashboard', '/analytics', '/onboarding']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current route is protected (excluding onboarding for special handling)
  const isProtectedRoute = protectedRoutes.filter(route => route !== '/onboarding')
    .some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Check for risk profile cookie (as a basic server-side check)
    const hasRiskProfile = request.cookies.get('hasRiskProfile')
    
    // For dashboard and analytics routes, check if user has completed risk profile
    if (!hasRiskProfile && (pathname.startsWith('/dashboard') || pathname.startsWith('/analytics'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - onboarding (the onboarding page itself)
     * - root (landing page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|onboarding|education|$).*)',
  ],
}