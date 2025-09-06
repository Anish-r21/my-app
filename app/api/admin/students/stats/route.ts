// app/api/admin/students/stats/route.ts - Corrected Student Statistics
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { ApiResponse } from '@/types/database'

interface StudentWithStats {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'student'
  created_at: string
  updated_at: string
  enrolled_courses: number
  completed_courses: number
  avg_progress: number
  last_activity: string | null
  total_modules: number
  completed_modules: number
}

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 401 })
    }

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, email, name, phone, role, created_at, updated_at')
      .eq('role', 'student')
      .order('name')

    if (studentsError) throw studentsError

    // Get all active modules grouped by course for accurate calculations
    const { data: modules } = await supabase
      .from('modules')
      .select('id, course_id')
      .eq('is_active', true)

    // Group modules by course for easier lookup
    const modulesByCourse = modules?.reduce((acc, module) => {
      if (!acc[module.course_id]) acc[module.course_id] = []
      acc[module.course_id].push(module.id)
      return acc
    }, {} as Record<string, string[]>) || {}

    const studentsWithStats: StudentWithStats[] = await Promise.all(
      (students || []).map(async (student) => {
        try {
          // Get student's enrollments (only in active courses)
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select(`
              id,
              course_id,
              progress_percentage,
              completed_at,
              courses!inner(id, is_active)
            `)
            .eq('student_id', student.id)
            .eq('courses.is_active', true)

          const enrolledCourses = enrollments?.length || 0

          // Get student's module progress (only for active modules in active courses)
          const { data: moduleProgress } = await supabase
            .from('module_progress')
            .select(`
              module_id,
              completed,
              completed_at,
              modules!inner(id, course_id, is_active),
              courses!inner(id, is_active)
            `)
            .eq('student_id', student.id)
            .eq('modules.is_active', true)
            .eq('courses.is_active', true)

          const completedModules = moduleProgress?.filter(mp => mp.completed).length || 0

          // Calculate total accessible modules for this student
          let totalAccessibleModules = 0
          for (const enrollment of enrollments || []) {
            totalAccessibleModules += modulesByCourse[enrollment.course_id]?.length || 0
          }

          // Calculate accurate average progress based on actual module completion
          const avgProgress = totalAccessibleModules > 0 
            ? Math.round((completedModules / totalAccessibleModules) * 100)
            : 0

          // Calculate completed courses based on current module requirements
          let completedCourses = 0
          for (const enrollment of enrollments || []) {
            const courseModules = modulesByCourse[enrollment.course_id] || []
            if (courseModules.length === 0) continue

            const completedInCourse = moduleProgress?.filter(mp => 
              courseModules.includes(mp.module_id) && mp.completed
            ).length || 0

            // Course is complete if student completed all current active modules
            if (completedInCourse === courseModules.length) {
              completedCourses++
            }
          }

          // Get last activity (most recent module completion)
          const lastActivity = moduleProgress
            ?.filter(mp => mp.completed_at !== null)
            ?.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at || null

          return {
            ...student,
            enrolled_courses: enrolledCourses,
            completed_courses: completedCourses,
            avg_progress: avgProgress,
            last_activity: lastActivity,
            total_modules: totalAccessibleModules, // Only modules accessible to this student
            completed_modules: completedModules
          }
        } catch (error) {
          console.error(`Error getting stats for student ${student.id}:`, error)
          return {
            ...student,
            enrolled_courses: 0,
            completed_courses: 0,
            avg_progress: 0,
            last_activity: null,
            total_modules: 0,
            completed_modules: 0
          }
        }
      })
    )

    return NextResponse.json<ApiResponse<StudentWithStats[]>>({
      success: true,
      data: studentsWithStats
    })

  } catch (error) {
    console.error('Get students stats API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch students statistics'
    }, { status: 500 })
  }
}