// app/api/auth/check/route.ts - Server-side JWT verification
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import type { AuthUser, ApiResponse } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('lms-auth-token')?.value

    if (!token) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No token found'
      }, { status: 401 })
    }

    // Verify token
    try {
      const user = jwt.verify(token, JWT_SECRET, {
        issuer: 'lms-platform',
        audience: 'lms-users'
      }) as AuthUser

      return NextResponse.json<ApiResponse<AuthUser>>({
        success: true,
        data: user
      })

    } catch (jwtError) {
      // Clear invalid token
      const response = NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })

      response.cookies.set({
        name: 'lms-auth-token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      })

      return response
    }

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}