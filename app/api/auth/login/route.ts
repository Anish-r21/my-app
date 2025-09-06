// app/api/auth/login/route.ts - Simplified Login Route
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import type { ApiResponse, AuthUser, User } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('Login attempt for:', email)

    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    // Get user from database directly (no helper functions)
    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .limit(1)

    console.log('Database query result:', { users: users?.length, error: dbError })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 })
    }
    
    if (!users || users.length === 0) {
      console.log('No user found with email:', email)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    const user = users[0] as User
    console.log('User found:', { id: user.id, email: user.email, role: user.role, hasHash: !!user.password_hash })

    if (!user.password_hash) {
      console.log('User has no password hash')
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User account not properly configured'
      }, { status: 500 })
    }

    // Verify password directly with bcrypt
    console.log('Verifying password...')
    let isValidPassword = false
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash)
      console.log('Password verification result:', isValidPassword)
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Password verification failed'
      }, { status: 500 })
    }
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    // Create auth user object (without password hash)
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    console.log('Creating JWT token for user:', authUser.id)

    // Create JWT token directly
    let token: string
    try {
      token = jwt.sign(authUser, JWT_SECRET, { 
        expiresIn: '7d',
        issuer: 'lms-platform',
        audience: 'lms-users'
      })
      console.log('JWT token created successfully')
    } catch (jwtError) {
      console.error('JWT creation error:', jwtError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Token creation failed'
      }, { status: 500 })
    }
    
    // Create response with cookie set directly
    const response = NextResponse.json<ApiResponse<AuthUser>>({
      success: true,
      data: authUser,
      message: 'Login successful'
    })

    // Set cookie directly in response (avoid helper functions)
    response.cookies.set({
      name: 'lms-auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    console.log('Login successful for:', email, 'Role:', user.role)
    return response

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}