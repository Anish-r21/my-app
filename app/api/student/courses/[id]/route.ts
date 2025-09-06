//app/api/student/courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { courseQueries, moduleQueries, progressQueries, enrollmentQueries } from '@/lib/database'
import type { ApiResponse } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'student') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Check if student is enrolled in this course
    const enrollments = await enrollmentQueries.getByStudent(user.id)
    const enrollment = enrollments.find(e => e.course_id === id)

    if (!enrollment) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Not enrolled in this course'
      }, { status: 403 })
    }

    // Get course details
    const course = await courseQueries.getById(id)
    if (!course) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Course not found'
      }, { status: 404 })
    }

    // Get modules
    const modules = await moduleQueries.getByCourse(id)

    // Get student's progress
    const moduleProgress = await progressQueries.getStudentProgress(user.id, id)

    // Combine modules with progress
    const modulesWithProgress = modules.map(module => {
      const progress = moduleProgress.find(mp => mp.module_id === module.id)
      return {
        ...module,
        completed: progress?.completed || false,
        completed_at: progress?.completed_at || null
      }
    })

    const courseData = {
      ...course,
      modules: modulesWithProgress,
      enrollment: {
        progress_percentage: enrollment.progress_percentage,
        enrolled_at: enrollment.enrolled_at,
        completed_at: enrollment.completed_at
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: courseData
    })
  } catch (error) {
    console.error('Get student course API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch course details'
    }, { status: 500 })
  }
}