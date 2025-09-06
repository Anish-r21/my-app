// middleware.ts - Edge Runtime Compatible (No JWT Verification)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('Middleware processing:', pathname)
  
  // Protected routes
  const isAdminRoute = pathname.startsWith('/admin')
  const isStudentRoute = pathname.startsWith('/student')
  const isLoginRoute = pathname === '/login'
  const isSignupRoute = pathname === '/signup'
  const isProtectedRoute = isAdminRoute || isStudentRoute

  // Get auth token from cookies
  const token = request.cookies.get('lms-auth-token')?.value
  console.log('Token found:', !!token)

  // Simple check - if there's a token, assume user is authenticated
  // Let the actual API routes handle JWT verification
  const hasToken = !!token && token.length > 50 // Basic token format check

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !hasToken) {
    console.log(`No token found, redirecting to login from ${pathname}`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If has token and accessing login/signup, redirect to admin (we'll let API routes handle role-based routing)
  if (hasToken && (isLoginRoute || isSignupRoute)) {
    console.log(`Has token, redirecting from ${pathname} to /admin`)
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  console.log('Middleware allowing access to:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/login', '/signup']
}