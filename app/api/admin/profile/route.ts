// app/api/admin/profile/route.ts - Complete Admin Profile Management
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import type { ApiResponse, User, AuthUser } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

// Helper function to normalize phone numbers
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)\+]/g, '')
  
  if (normalized.length === 10 && /^[6-9]\d{9}$/.test(normalized)) {
    normalized = '91' + normalized
  }
  
  return normalized
}

async function authenticateAdmin(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('lms-auth-token')?.value
    if (!token) return null

    const user = jwt.verify(token, JWT_SECRET, {
      issuer: 'lms-platform',
      audience: 'lms-users'
    }) as AuthUser

    return user.role === 'admin' ? user : null
  } catch (error) {
    console.error('Admin auth error:', error)
    return null
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateAdmin(request)
    if (!user) {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 401 })
    }

    const updateData = await request.json()
    const { name, email, phone } = updateData

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name and email are required'
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

    const normalizedEmail = email.toLowerCase().trim()
    let normalizedPhone: string | null = null

    // Validate and normalize phone if provided
    if (phone && phone.trim()) {
      const rawPhone = phone.trim()
      
      if (!/^[\+\d\s\-\(\)]+$/.test(rawPhone)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Phone number contains invalid characters'
        }, { status: 400 })
      }

      normalizedPhone = normalizePhoneNumber(rawPhone)
      
      if (!/^\d{10,15}$/.test(normalizedPhone)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Please enter a valid phone number (10-15 digits)'
        }, { status: 400 })
      }
    }

    // Check if email already exists for other users
    const { data: existingEmailUsers, error: emailCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .neq('id', user.id)

    if (emailCheckError) {
      console.error('Email check error:', emailCheckError)
    }

    if (existingEmailUsers && existingEmailUsers.length > 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'A user with this email already exists'
      }, { status: 400 })
    }

    // Check if phone already exists for other users (if provided)
    if (normalizedPhone) {
      const { data: allUsers, error: phoneCheckError } = await supabase
        .from('users')
        .select('id, phone')
        .neq('id', user.id)
        .not('phone', 'is', null)

      if (phoneCheckError) {
        console.error('Phone check error:', phoneCheckError)
      }

      const phoneExists = allUsers?.some(existingUser => {
        if (!existingUser.phone) return false
        const existingNormalized = normalizePhoneNumber(existingUser.phone)
        return existingNormalized === normalizedPhone
      })

      if (phoneExists) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'A user with this phone number already exists'
        }, { status: 400 })
      }
    }

    // Update admin profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone && phone.trim() ? phone.trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .eq('role', 'admin')
      .select('id, email, name, phone, role, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      throw updateError
    }

    if (!updatedUser) {
      throw new Error('Failed to update profile')
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: updatedUser as User,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Update admin profile API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update profile'
    }, { status: 500 })
  }
}