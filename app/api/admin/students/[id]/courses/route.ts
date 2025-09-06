// app/api/admin/students/[id]/courses/route.ts - Full Working Version
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'
import type { ApiResponse, Course, Enrollment, AuthUser } from '@/types/database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars'

interface StudentCourse extends Course {
  enrollment: Enrollment
  modules_count: number
  completed_modules: number
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
    console.log('Getting courses for student ID:', id)
    
    const user = await authenticateAdmin(request)
    if (!user) {
      console.log('Admin authentication failed')
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 401 })
    }

    console.log('Admin authenticated:', user.email)

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      console.log('Student not found:', id)
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Student not found'
      }, { status: 404 })
    }

    console.log('Student exists, getting enrollments...')

    // Get student's enrollments with course details
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses:course_id (
          id,
          title,
          description,
          thumbnail_url,
          created_by,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('student_id', id)
      .order('enrolled_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Enrollments query error:', enrollmentsError)
      throw enrollmentsError
    }

    console.log('Found enrollments:', enrollments?.length || 0)

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json<ApiResponse<StudentCourse[]>>({
        success: true,
        data: []
      })
    }

    // For each enrollment, get module statistics
    const coursesWithStats = await Promise.all(
      enrollments
        .filter(enrollment => enrollment.courses !== null)
        .map(async (enrollment) => {
          const course = enrollment.courses as Course
          
          try {
            console.log('Processing course:', course.title)

            // Get total modules for this course
            const { data: modules, error: modulesError } = await supabase
              .from('modules')
              .select('id')
              .eq('course_id', course.id)
              .eq('is_active', true)

            if (modulesError) {
              console.error(`Error getting modules for course ${course.id}:`, modulesError)
            }

            const modulesCount = modules?.length || 0
            console.log(`Course ${course.title} has ${modulesCount} modules`)

            // Get completed modules for this student in this course
            let completedModules = 0
            if (modulesCount > 0) {
              const moduleIds = modules!.map(m => m.id)
              
              const { data: progress, error: progressError } = await supabase
                .from('module_progress')
                .select('id')
                .eq('student_id', id)
                .in('module_id', moduleIds)
                .eq('completed', true)

              if (progressError) {
                console.error(`Error getting progress for student ${id} in course ${course.id}:`, progressError)
              }

              completedModules = progress?.length || 0
            }

            console.log(`Student completed ${completedModules}/${modulesCount} modules in ${course.title}`)

            const studentCourse: StudentCourse = {
              ...course,
              enrollment: {
                id: enrollment.id,
                student_id: enrollment.student_id,
                course_id: enrollment.course_id,
                enrolled_at: enrollment.enrolled_at,
                completed_at: enrollment.completed_at,
                progress_percentage: enrollment.progress_percentage
              },
              modules_count: modulesCount,
              completed_modules: completedModules
            }

            return studentCourse
          } catch (error) {
            console.error(`Error processing course ${course.id} for student ${id}:`, error)
            // Return course with zero stats if error occurs
            return {
              ...course,
              enrollment: {
                id: enrollment.id,
                student_id: enrollment.student_id,
                course_id: enrollment.course_id,
                enrolled_at: enrollment.enrolled_at,
                completed_at: enrollment.completed_at,
                progress_percentage: enrollment.progress_percentage
              },
              modules_count: 0,
              completed_modules: 0
            }
          }
        })
    )

    console.log('Returning courses with stats:', coursesWithStats.length)
    return NextResponse.json<ApiResponse<StudentCourse[]>>({
      success: true,
      data: coursesWithStats
    })

  } catch (error) {
    console.error('Get student courses API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch student courses'
    }, { status: 500 })
  }
}