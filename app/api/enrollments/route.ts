
// app/api/enrollments/route.ts - Updated with DELETE method
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import type { ApiResponse, Enrollment, AuthUser } from '@/types/database'

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

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateAdmin(request)
    if (!user) {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 401 })
    }

    const { studentId, courseId } = await request.json()
    
    if (!studentId || !courseId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student ID and Course ID are required'
      }, { status: 400 })
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single()

    if (existingEnrollment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student is already enrolled in this course'
      }, { status: 400 })
    }

    // Create enrollment
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        progress_percentage: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json<ApiResponse<Enrollment>>({
      success: true,
      data: enrollment,
      message: 'Student enrolled successfully'
    })

  } catch (error) {
    console.error('Enroll student error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to enroll student'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateAdmin(request)
    if (!user) {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 401 })
    }

    const { studentId, courseId } = await request.json()
    
    if (!studentId || !courseId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student ID and Course ID are required'
      }, { status: 400 })
    }

    // Delete enrollment
    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)

    if (enrollmentError) throw enrollmentError

    // Also delete any module progress for this student in this course
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId)

    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)
      
      const { error: progressError } = await supabase
        .from('module_progress')
        .delete()
        .eq('student_id', studentId)
        .in('module_id', moduleIds)

      if (progressError) {
        console.error('Error cleaning up progress:', progressError)
        // Don't fail the request for this
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Student unenrolled successfully'
    })

  } catch (error) {
    console.error('Unenroll student error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to unenroll student'
    }, { status: 500 })
  }
}