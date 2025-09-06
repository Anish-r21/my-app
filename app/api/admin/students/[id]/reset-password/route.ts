// app/api/admin/students/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import { passwordUtils } from '@/lib/auth'
import type { ApiResponse, AuthUser } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

async function authenticateAdmin(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('lms-auth-token')?.value
  if (!token) return null

  try {
    const user = jwt.verify(token, JWT_SECRET, {
      issuer: 'lms-platform',
      audience: 'lms-users'
    }) as AuthUser

    return user.role === 'admin' ? user : null
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authenticateAdmin(request)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'New password is required'
      }, { status: 400 })
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 })
    }

    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student not found'
      }, { status: 404 })
    }

    const hashedPassword = await passwordUtils.hash(newPassword)

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'student')

    if (updateError) {
      throw updateError
    }

    console.log(`Admin ${user.email} reset password for student ${student.email} (ID: ${id})`)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Password reset successfully for ${student.name}`
    })

  } catch (error) {
    console.error('Reset password API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to reset password'
    }, { status: 500 })
  }
}