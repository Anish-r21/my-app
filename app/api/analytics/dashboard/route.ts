// app/api/analytics/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import type { ApiResponse, DashboardStats, AuthUser } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

export async function GET(request: NextRequest) {
  try {
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

    // Get dashboard statistics
    const [coursesResult, studentsResult, modulesResult, enrollmentsResult] = await Promise.all([
      supabase.from('courses').select('id').eq('is_active', true),
      supabase.from('users').select('id').eq('role', 'student'),
      supabase.from('modules').select('id').eq('is_active', true),
      supabase.from('enrollments').select('progress_percentage, completed_at, student_id')
    ])

    const totalCourses = coursesResult.data?.length || 0
    const totalStudents = studentsResult.data?.length || 0
    const totalModules = modulesResult.data?.length || 0
    
    const enrollments = enrollmentsResult.data || []
    const averageProgress = enrollments.length > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
      : 0
    
    const totalCompletions = enrollments.filter(e => e.completed_at !== null).length
    const activeStudents = new Set(enrollments.map(e => e.student_id)).size

    const stats: DashboardStats = {
      totalCourses,
      totalStudents,
      totalModules,
      averageProgress,
      totalCompletions,
      activeStudents
    }

    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }, { status: 500 })
  }
}