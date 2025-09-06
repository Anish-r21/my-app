// app/api/admin/students/enrollment-status/[courseId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import type { ApiResponse, AuthUser } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    // Await params for Next.js 15+ compatibility
    const params = await context.params
    
    // Check authentication
    const token = request.cookies.get('lms-auth-token')?.value
    if (!token) {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    let user: AuthUser
    try {
      user = jwt.verify(token, JWT_SECRET, {
        issuer: 'lms-platform',
        audience: 'lms-users'
      }) as AuthUser
    } catch {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 })
    }

    // Get all students with their enrollment status for this course
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('name')

    if (studentsError) throw studentsError

    // Get enrollments for this course
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('student_id, enrolled_at')
      .eq('course_id', params.courseId)

    if (enrollmentsError) throw enrollmentsError

    // Create enrollment map
    const enrollmentMap = new Map(
      enrollments?.map(e => [e.student_id, e.enrolled_at]) || []
    )

    // Combine data
    const studentsWithStatus = students?.map(student => ({
      ...student,
      enrolled: enrollmentMap.has(student.id),
      enrollment_date: enrollmentMap.get(student.id) || undefined
    })) || []

    return NextResponse.json<ApiResponse>({
      success: true,
      data: studentsWithStatus
    })

  } catch (error) {
    console.error('Get enrollment status error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch enrollment status'
    }, { status: 500 })
  }
}