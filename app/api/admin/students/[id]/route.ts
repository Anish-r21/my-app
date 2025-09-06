// app/api/admin/students/[id]/route.ts - Full Working Version
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import type { ApiResponse, User, AuthUser } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

interface StudentDetail extends User {
  enrolled_courses: number
  completed_courses: number
  avg_progress: number
  last_activity: string | null
  total_modules: number
  completed_modules: number
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Getting student details for ID:', id)
    
    const user = await authenticateAdmin(request)
    if (!user) {
      console.log('Admin authentication failed')
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 401 })
    }

    console.log('Admin authenticated:', user.email)

    // Get student basic info
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, email, name, phone, role, created_at, updated_at')
      .eq('id', id)
      .eq('role', 'student')
      .single()

    if (studentError) {
      console.error('Student query error:', studentError)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student not found'
      }, { status: 404 })
    }

    if (!student) {
      console.log('No student found with ID:', id)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student not found'
      }, { status: 404 })
    }

    console.log('Student found:', student.name)

    // Get enrollment statistics
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('progress_percentage, completed_at')
      .eq('student_id', id)

    if (enrollmentError) {
      console.error('Enrollment query error:', enrollmentError)
    }

    const enrolledCourses = enrollments?.length || 0
    const completedCourses = enrollments?.filter(e => e.completed_at !== null).length || 0
    const avgProgress = enrolledCourses > 0
      ? Math.round(enrollments!.reduce((sum, e) => sum + e.progress_percentage, 0) / enrolledCourses)
      : 0

    // Get module progress
    const { data: moduleProgress, error: progressError } = await supabase
      .from('module_progress')
      .select('completed, completed_at')
      .eq('student_id', id)

    if (progressError) {
      console.error('Module progress query error:', progressError)
    }

    const totalModules = moduleProgress?.length || 0
    const completedModules = moduleProgress?.filter(mp => mp.completed).length || 0
    
    // Get last activity
    const lastActivity = moduleProgress
      ?.filter(mp => mp.completed_at !== null)
      ?.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at || null

    const studentWithStats: StudentDetail = {
      ...student,
      enrolled_courses: enrolledCourses,
      completed_courses: completedCourses,
      avg_progress: avgProgress,
      last_activity: lastActivity,
      total_modules: totalModules,
      completed_modules: completedModules
    }

    console.log('Returning student data with stats')
    return NextResponse.json<ApiResponse<StudentDetail>>({
      success: true,
      data: studentWithStats
    })

  } catch (error) {
    console.error('Get student API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch student details'
    }, { status: 500 })
  }
}

export async function PUT(
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
      .neq('id', id)

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
        .neq('id', id)
        .not('phone', 'is', null)

      if (phoneCheckError) {
        console.error('Phone check error:', phoneCheckError)
      }

      const phoneExists = allUsers?.some(user => {
        if (!user.phone) return false
        const existingNormalized = normalizePhoneNumber(user.phone)
        return existingNormalized === normalizedPhone
      })

      if (phoneExists) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'A user with this phone number already exists'
        }, { status: 400 })
      }
    }

    // Update student
    const { data: updatedStudent, error: updateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone && phone.trim() ? phone.trim() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'student')
      .select('id, email, name, phone, role, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    if (!updatedStudent) {
      throw new Error('Failed to update student')
    }

    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: updatedStudent as User,
      message: 'Student updated successfully'
    })

  } catch (error) {
    console.error('Update student API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update student'
    }, { status: 500 })
  }
}