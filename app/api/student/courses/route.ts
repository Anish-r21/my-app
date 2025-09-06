

// app/api/student/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { enrollmentQueries, progressQueries, moduleQueries } from '@/lib/database'
import type { ApiResponse } from '@/types/database'

export async function GET() {
  try {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'student') {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get student's enrollments with course details
    const enrollments = await enrollmentQueries.getByStudent(user.id)
    
    // For each enrollment, get modules and progress
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        if (!enrollment.courses) return null
        
        // Get modules for this course
        const modules = await moduleQueries.getByCourse(enrollment.courses.id)
        
        // Get student's progress for this course
        const moduleProgress = await progressQueries.getStudentProgress(user.id, enrollment.courses.id)
        
        // Map modules with completion status
        const modulesWithProgress = modules.map(module => {
          const progress = moduleProgress.find(mp => mp.module_id === module.id)
          return {
            ...module,
            completed: progress?.completed || false
          }
        })

        return {
          id: enrollment.courses.id,
          title: enrollment.courses.title,
          description: enrollment.courses.description,
          thumbnail_url: enrollment.courses.thumbnail_url,
          modules: modulesWithProgress,
          enrollment: {
            progress_percentage: enrollment.progress_percentage,
            enrolled_at: enrollment.enrolled_at,
            completed_at: enrollment.completed_at
          }
        }
      })
    )

    // Filter out null values
    const validCourses = coursesWithProgress.filter(course => course !== null)
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: validCourses
    })

  } catch (error) {
    console.error('Get student courses API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch student courses'
    }, { status: 500 })
  }
}