// app/api/auth/signup/route.ts - Signup API Route
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { passwordUtils, tokenUtils } from '@/lib/auth'
import type { ApiResponse, AuthUser, User } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    console.log('Signup attempt for email:', email)

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name, email, and password are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Please enter a valid email address'
      }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 })
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name must be at least 2 characters long'
      }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)

    if (checkError) {
      console.error('Database check error:', checkError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'An account with this email already exists'
      }, { status: 409 })
    }

    // Hash password
    let hashedPassword: string
    try {
      hashedPassword = await passwordUtils.hash(password)
      console.log('Password hashed successfully')
    } catch (hashError) {
      console.error('Password hashing error:', hashError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Password processing failed'
      }, { status: 500 })
    }

    // Create new user (default role is 'student')
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: hashedPassword,
        name: name.trim(),
        role: 'student' // New signups default to student role
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to create account'
      }, { status: 500 })
    }

    const user = newUser as User
    console.log('User created successfully:', { id: user.id, email: user.email, role: user.role })

    // Create auth user object (without password hash)
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    // Create JWT token
    let token: string
    try {
      token = tokenUtils.sign(authUser)
      console.log('JWT token created successfully')
    } catch (jwtError) {
      console.error('JWT creation error:', jwtError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Token creation failed'
      }, { status: 500 })
    }

    // Create response with user data
    const response = NextResponse.json<ApiResponse<AuthUser>>({
      success: true,
      data: authUser,
      message: 'Account created successfully'
    })

    // Set httpOnly cookie
    response.cookies.set({
      name: 'lms-auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    console.log('Signup successful for:', normalizedEmail, 'Role:', user.role)
    return response

  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}

// Optional: Add a GET method to check if signup is available
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Signup endpoint is available'
  })
}