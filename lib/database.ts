// lib/database.ts - Database Query Functions (TypeScript Fixed)

import { supabase } from './supabase'
import type { 
  User, 
  Course, 
  Module, 
  Enrollment, 
  ModuleProgress,
  CourseWithStats,
  // StudentWithProgress,
  // CourseWithRelations,
  DashboardStats,
  StudentDashboardStats
} from '../types/database'

// Extended types for database responses
interface EnrollmentWithUser extends Enrollment {
  users: User | null
}

interface EnrollmentWithCourse extends Enrollment {
  courses: Course | null
}

// User queries
export const userQueries = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getStudents(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .eq('role', 'student')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }
}

// Course queries
export const courseQueries = {
  async getAll(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    
    if (error) return null
    return data
  },

  async getWithStats(): Promise<CourseWithStats[]> {
    try {
      // Get courses with manual stats calculation
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          modules!course_id (id),
          enrollments!course_id (id, progress_percentage, completed_at)
        `)
        .eq('is_active', true)

      if (coursesError) throw coursesError

      return courses?.map(course => ({
        ...course,
        module_count: course.modules?.length || 0,
        enrolled_students: course.enrollments?.length || 0,
        avg_progress: course.enrollments && course.enrollments.length > 0
          ? Math.round(course.enrollments.reduce((sum: number, e: Enrollment) => sum + e.progress_percentage, 0) / course.enrollments.length)
          : 0,
        total_completions: course.enrollments?.filter((e: Enrollment) => e.completed_at).length || 0
      })) || []
    } catch (error) {
      console.error('Error getting courses with stats:', error)
      return []
    }
  },

  async create(courseData: {
    title: string
    description: string
    created_by: string
    thumbnail_url?: string
  }): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Course>): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('courses')
      .update({ is_active: false })
      .eq('id', id)
    
    return !error
  }
}

// Module queries
export const moduleQueries = {
  async getByCourse(courseId: string): Promise<Module[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index')
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Module | null> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    
    if (error) return null
    return data
  },

  async create(moduleData: {
    course_id: string
    title: string
    description: string
    video_url: string
    order_index: number
    duration_minutes?: number
  }): Promise<Module | null> {
    const { data, error } = await supabase
      .from('modules')
      .insert(moduleData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Module>): Promise<Module | null> {
    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('modules')
      .update({ is_active: false })
      .eq('id', id)
    
    return !error
  },

  async reorder(courseId: string, moduleIds: string[]): Promise<boolean> {
    try {
      const updates = moduleIds.map((id, index) => ({
        id,
        order_index: index
      }))

      for (const update of updates) {
        await supabase
          .from('modules')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      }

      return true
    } catch (error) {
      console.error('Error reordering modules:', error)
      return false
    }
  }
}

// Enrollment queries
export const enrollmentQueries = {
  async enroll(studentId: string, courseId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        progress_percentage: 0
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByStudent(studentId: string): Promise<EnrollmentWithCourse[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses:course_id (
          id,
          title,
          description,
          thumbnail_url
        )
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByCourse(courseId: string): Promise<EnrollmentWithUser[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        users:student_id (
          id,
          name,
          email,
          role,
          created_at,
          updated_at
        )
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async unenroll(studentId: string, courseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)
    
    return !error
  }
}

// Progress queries
export const progressQueries = {
  async markModuleComplete(studentId: string, moduleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('module_progress')
        .upsert({
          student_id: studentId,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,module_id'
        })
      
      return !error
    } catch (error) {
      console.error('Error marking module complete:', error)
      return false
    }
  },

  async markModuleIncomplete(studentId: string, moduleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('module_progress')
        .upsert({
          student_id: studentId,
          module_id: moduleId,
          completed: false,
          completed_at: null
        }, {
          onConflict: 'student_id,module_id'
        })
      
      return !error
    } catch (error) {
      console.error('Error marking module incomplete:', error)
      return false
    }
  },

  async getStudentProgress(studentId: string, courseId: string): Promise<ModuleProgress[]> {
    const { data, error } = await supabase
      .from('module_progress')
      .select(`
        *,
        modules:module_id (
          id,
          title,
          course_id,
          order_index
        )
      `)
      .eq('student_id', studentId)
      .eq('modules.course_id', courseId)
    
    if (error) throw error
    return data || []
  }
}

// Analytics queries
export const analyticsQueries = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
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

      return {
        totalCourses,
        totalStudents,
        totalModules,
        averageProgress,
        totalCompletions,
        activeStudents
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        totalCourses: 0,
        totalStudents: 0,
        totalModules: 0,
        averageProgress: 0,
        totalCompletions: 0,
        activeStudents: 0
      }
    }
  },

  async getStudentStats(studentId: string): Promise<StudentDashboardStats> {
    try {
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses:course_id (
            id,
            title
          )
        `)
        .eq('student_id', studentId)

      if (error) throw error

      const enrolledCourses = enrollments?.length || 0
      const completedCourses = enrollments?.filter(e => e.completed_at !== null).length || 0
      const averageProgress = enrolledCourses > 0
        ? Math.round(enrollments!.reduce((sum, e) => sum + e.progress_percentage, 0) / enrolledCourses)
        : 0

      // Get module stats
      const { data: moduleProgress } = await supabase
        .from('module_progress')
        .select('completed, completed_at')
        .eq('student_id', studentId)

      const totalModules = moduleProgress?.length || 0
      const completedModules = moduleProgress?.filter(mp => mp.completed).length || 0
      const lastActivity = moduleProgress
        ?.filter(mp => mp.completed_at !== null)
        ?.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at || null

      return {
        enrolledCourses,
        completedCourses,
        totalModules,
        completedModules,
        averageProgress,
        lastActivity
      }
    } catch (error) {
      console.error('Error getting student stats:', error)
      return {
        enrolledCourses: 0,
        completedCourses: 0,
        totalModules: 0,
        completedModules: 0,
        averageProgress: 0,
        lastActivity: null
      }
    }
  }
}

// Fixed legacy exports
export const getAllCourses = courseQueries.getAll
export const getAllStudents = userQueries.getStudents

export const getStudentsInCourse = async (courseId: string): Promise<(User & { progress_percentage: number })[]> => {
  const enrollments = await enrollmentQueries.getByCourse(courseId)
  return enrollments
    .filter(e => e.users !== null)
    .map(e => ({
      ...e.users!,
      progress_percentage: e.progress_percentage
    }))
}

// Utility functions
export const utils = {
  extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  },

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  generateCSV(data: (User & { progress_percentage: number })[], courseName: string): string {
    const headers = ['Student Name', 'Email', 'Progress %', 'Created Date']
    const rows = data.map(student => [
      student.name,
      student.email,
      `${student.progress_percentage}%`,
      this.formatDate(student.created_at)
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    return csvContent
  },

  downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}





































// import { supabase } from './supabase'
// import type { User, Course, Module, Enrollment, Progress, CourseWithModules, StudentProgress } from '@/types/database'

// // Admin Functions
// export async function createCourse(title: string, description?: string): Promise<Course | null> {
//   try {
//     const { data, error } = await supabase
//       .from('courses')
//       .insert({ title, description })
//       .select()
//       .single()
    
//     if (error) throw error
//     return data
//   } catch (error) {
//     console.error('Error creating course:', error)
//     return null
//   }
// }

// export async function getAllCourses(): Promise<Course[]> {
//   try {
//     const { data, error } = await supabase
//       .from('courses')
//       .select('*')
//       .order('created_at', { ascending: false })
    
//     if (error) throw error
//     return data || []
//   } catch (error) {
//     console.error('Error fetching courses:', error)
//     return []
//   }
// }

// export async function getCourseWithModules(courseId: string): Promise<CourseWithModules | null> {
//   try {
//     const { data, error } = await supabase
//       .from('courses')
//       .select(`
//         *,
//         modules (*)
//       `)
//       .eq('id', courseId)
//       .single()
    
//     if (error) throw error
//     return data
//   } catch (error) {
//     console.error('Error fetching course with modules:', error)
//     return null
//   }
// }

// export async function createModule(courseId: string, title: string, description: string, videoUrl: string): Promise<Module | null> {
//   try {
//     const { data, error } = await supabase
//       .from('modules')
//       .insert({
//         course_id: courseId,
//         title,
//         module_desc: description,
//         video_url: videoUrl
//       })
//       .select()
//       .single()
    
//     if (error) throw error
//     return data
//   } catch (error) {
//     console.error('Error creating module:', error)
//     return null
//   }
// }

// export async function getStudentsInCourse(courseId: string): Promise<StudentProgress[]> {
//   try {
//     // Get all enrollments for this course
//     const { data: enrollments, error: enrollError } = await supabase
//       .from('enrollments')
//       .select(`
//         student_id,
//         student:users!enrollments_student_id_fkey (*)
//       `)
//       .eq('course_id', courseId)
    
//     if (enrollError) throw enrollError

//     // Get all modules for this course
//     const { data: modules, error: modulesError } = await supabase
//       .from('modules')
//       .select('id')
//       .eq('course_id', courseId)
    
//     if (modulesError) throw modulesError

//     const totalModules = modules?.length || 0
//     const studentProgress: StudentProgress[] = []

//     for (const enrollment of enrollments || []) {
//       // Get completed modules for this student in this course
//       const { data: completedProgress, error: progressError } = await supabase
//         .from('progress')
//         .select('module_id, completed_at')
//         .eq('student_id', enrollment.student_id)
//         .eq('completed', true)
//         .in('module_id', modules?.map(m => m.id) || [])
      
//       if (progressError) throw progressError

//       const completedModules = completedProgress?.length || 0
//       const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
      
//       // Get last activity
//       const lastActivity = completedProgress?.length > 0 
//         ? completedProgress.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0].completed_at
//         : undefined

//       studentProgress.push({
//         student: enrollment.student!,
//         completed_modules: completedModules,
//         total_modules: totalModules,
//         progress_percentage: progressPercentage,
//         last_activity: lastActivity
//       })
//     }

//     return studentProgress
//   } catch (error) {
//     console.error('Error fetching students in course:', error)
//     return []
//   }
// }

// export async function enrollStudentInCourse(studentId: string, courseId: string): Promise<boolean> {
//   try {
//     const { error } = await supabase
//       .from('enrollments')
//       .insert({ student_id: studentId, course_id: courseId })
    
//     if (error) throw error
//     return true
//   } catch (error) {
//     console.error('Error enrolling student:', error)
//     return false
//   }
// }

// export async function getAllStudents(): Promise<User[]> {
//   try {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('role', 'student')
//       .order('name')
    
//     if (error) throw error
//     return data || []
//   } catch (error) {
//     console.error('Error fetching students:', error)
//     return []
//   }
// }

// // Student Functions
// export async function getStudentCourses(studentId: string): Promise<CourseWithModules[]> {
//   try {
//     const { data, error } = await supabase
//       .from('enrollments')
//       .select(`
//         course:courses (
//           *,
//           modules (*)
//         )
//       `)
//       .eq('student_id', studentId)
    
//     if (error) throw error
//     return data?.map(enrollment => enrollment.course).filter(Boolean) || []
//   } catch (error) {
//     console.error('Error fetching student courses:', error)
//     return []
//   }
// }

// export async function getStudentProgressInCourse(studentId: string, courseId: string): Promise<Progress[]> {
//   try {
//     const { data, error } = await supabase
//       .from('progress')
//       .select(`
//         *,
//         module:modules (*)
//       `)
//       .eq('student_id', studentId)
//       .in('module_id', 
//         await supabase
//           .from('modules')
//           .select('id')
//           .eq('course_id', courseId)
//           .then(({ data }) => data?.map(m => m.id) || [])
//       )
    
//     if (error) throw error
//     return data || []
//   } catch (error) {
//     console.error('Error fetching student progress:', error)
//     return []
//   }
// }

// export async function markModuleComplete(studentId: string, moduleId: string): Promise<boolean> {
//   try {
//     const { error } = await supabase
//       .from('progress')
//       .upsert({
//         student_id: studentId,
//         module_id: moduleId,
//         completed: true,
//         completed_at: new Date().toISOString()
//       }, {
//         onConflict: 'student_id,module_id'
//       })
    
//     if (error) throw error
//     return true
//   } catch (error) {
//     console.error('Error marking module complete:', error)
//     return false
//   }
// }

// export async function getStudentOverallProgress(studentId: string): Promise<{
//   total_courses: number
//   completed_courses: number
//   total_modules: number
//   completed_modules: number
//   overall_percentage: number
// }> {
//   try {
//     // Get all enrolled courses
//     const courses = await getStudentCourses(studentId)
//     const totalCourses = courses.length
//     let totalModules = 0
//     let completedModules = 0
//     let completedCourses = 0

//     for (const course of courses) {
//       const courseModules = course.modules?.length || 0
//       totalModules += courseModules

//       // Get completed modules for this course
//       const { data: progress, error } = await supabase
//         .from('progress')
//         .select('module_id')
//         .eq('student_id', studentId)
//         .eq('completed', true)
//         .in('module_id', course.modules?.map(m => m.id) || [])
      
//       if (!error && progress) {
//         const completedInCourse = progress.length
//         completedModules += completedInCourse
        
//         // If all modules in course are completed, count as completed course
//         if (completedInCourse === courseModules && courseModules > 0) {
//           completedCourses++
//         }
//       }
//     }

//     const overallPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

//     return {
//       total_courses: totalCourses,
//       completed_courses: completedCourses,
//       total_modules: totalModules,
//       completed_modules: completedModules,
//       overall_percentage: overallPercentage
//     }
//   } catch (error) {
//     console.error('Error calculating overall progress:', error)
//     return {
//       total_courses: 0,
//       completed_courses: 0,
//       total_modules: 0,
//       completed_modules: 0,
//       overall_percentage: 0
//     }
//   }
// }

// // Utility Functions
// export function extractYouTubeVideoId(url: string): string | null {
//   const patterns = [
//     /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
//     /youtube\.com\/watch\?.*v=([^&\n?#]+)/
//   ]
  
//   for (const pattern of patterns) {
//     const match = url.match(pattern)
//     if (match) return match[1]
//   }
  
//   return null
// }

// export function formatDate(dateString: string): string {
//   return new Date(dateString).toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric'
//   })
// }

// export function generateCSV(data: StudentProgress[], courseName: string): string {
//   const headers = ['Student Name', 'Completed Modules', 'Total Modules', 'Progress %', 'Last Activity']
//   const rows = data.map(student => [
//     student.student.name,
//     student.completed_modules.toString(),
//     student.total_modules.toString(),
//     `${student.progress_percentage}%`,
//     student.last_activity ? formatDate(student.last_activity) : 'No activity'
//   ])
  
//   const csvContent = [
//     headers.join(','),
//     ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
//   ].join('\n')
  
//   return csvContent
// }






















































// // lib/database.ts - Database Query Functions

// import { supabase } from './supabase'
// import type { 
//   User, 
//   Course, 
//   Module, 
//   Enrollment, 
//   ModuleProgress,
//   CourseWithStats,
//   StudentWithProgress,
//   DashboardStats,
//   StudentDashboardStats
// } from '../types/database'

// // User queries
// export const userQueries = {
//   async getAll(): Promise<User[]> {
//     const { data, error } = await supabase
//       .from('users')
//       .select('id, email, name, role, created_at, updated_at')
//       .order('created_at', { ascending: false })
    
//     if (error) throw error
//     return data || []
//   },

//   async getStudents(): Promise<User[]> {
//     const { data, error } = await supabase
//       .from('users')
//       .select('id, email, name, role, created_at, updated_at')
//       .eq('role', 'student')
//       .order('name')
    
//     if (error) throw error
//     return data || []
//   },

//   async getById(id: string): Promise<User | null> {
//     const { data, error } = await supabase
//       .from('users')
//       .select('id, email, name, role, created_at, updated_at')
//       .eq('id', id)
//       .single()
    
//     if (error) return null
//     return data
//   }
// }

// // Course queries
// export const courseQueries = {
//   async getAll(): Promise<Course[]> {
//     const { data, error } = await supabase
//       .from('courses')
//       .select('*')
//       .eq('is_active', true)
//       .order('created_at', { ascending: false })
    
//     if (error) throw error
//     return data || []
//   },

//   async getById(id: string): Promise<Course | null> {
//     const { data, error } = await supabase
//       .from('courses')
//       .select('*')
//       .eq('id', id)
//       .eq('is_active', true)
//       .single()
    
//     if (error) return null
//     return data
//   },

//   async getWithStats(): Promise<CourseWithStats[]> {
//     const { data, error } = await supabase
//       .from('course_analytics')
//       .select('*')
    
//     if (error) throw error
//     return data?.map(course => ({
//       ...course,
//       module_count: course.total_modules || 0,
//       enrolled_students: course.enrolled_students || 0,
//       avg_progress: course.avg_progress || 0,
//       total_completions: course.completions || 0
//     })) || []
//   },

//   async create(courseData: {
//     title: string
//     description: string
//     created_by: string
//     thumbnail_url?: string
//   }): Promise<Course | null> {
//     const { data, error } = await supabase
//       .from('courses')
//       .insert(courseData)
//       .select()
//       .single()
    
//     if (error) throw error
//     return data
//   },

//   async update(id: string, updates: Partial<Course>): Promise<Course | null> {
//     const { data, error } = await supabase
//       .from('courses')
//       .update(updates)
//       .eq('id', id)
//       .select()
//       .single()
    
//     if (error) throw error
//     return data
//   },

//   async delete(id: string): Promise<boolean> {
//     const { error } = await supabase
//       .from('courses')
//       .update({ is_active: false })
//       .eq('id', id)
    
//     return !error
//   }
// }

// // Module queries
// export const moduleQueries = {
//   async getByCourse(courseId: string): Promise<Module[]> {
//     const { data, error } = await supabase
//       .from('modules')
//       .select('*')
//       .eq('course_id', courseId)
//       .eq('is_active', true)
//       .order('order_index')
    
//     if (error) throw error
//     return data || []
//   },

//   async getById(id: string): Promise<Module | null> {
//     const { data, error } = await supabase
//       .from('modules')
//       .select('*')
//       .eq('id', id)
//       .eq('is_active', true)
//       .single()
    
//     if (error) return null
//     return data
//   },

//   async create(moduleData: {
//     course_id: string
//     title: string
//     description: string
//     video_url: string
//     order_index: number
//     duration_minutes?: number
//   }): Promise<Module | null> {
//     const { data, error } = await supabase
//       .from('modules')
//       .insert(moduleData)
//       .select()
//       .single()
    
//     if (error) throw error
//     return data
//   },

//   async update(id: string, updates: Partial<Module>): Promise<Module | null> {
//     const { data, error } = await supabase
//       .from('modules')
//       .update(updates)
//       .eq('id', id)
//       .select()
//       .single()
    
//     if (error) throw error
//     return data
//   },

//   async delete(id: string): Promise<boolean> {
//     const { error } = await supabase
//       .from('modules')
//       .update({ is_active: false })
//       .eq('id', id)
    
//     return !error
//   },

//   async reorder(courseId: string, moduleIds: string[]): Promise<boolean> {
//     try {
//       const updates = moduleIds.map((id, index) => ({
//         id,
//         order_index: index
//       }))

//       for (const update of updates) {
//         await supabase
//           .from('modules')
//           .update({ order_index: update.order_index })
//           .eq('id', update.id)
//       }

//       return true
//     } catch (error) {
//       console.error('Error reordering modules:', error)
//       return false
//     }
//   }
// }

// // Enrollment queries
// export const enrollmentQueries = {
//   async enroll(studentId: string, courseId: string): Promise<Enrollment | null> {
//     const { data, error } = await supabase
//       .from('enrollments')
//       .insert({
//         student_id: studentId,
//         course_id: courseId,
//         progress_percentage: 0
//       })
//       .select()
//       .single()
    
//     if (error) throw error
//     return data
//   },

//   async getByStudent(studentId: string): Promise<Enrollment[]> {
//     const { data, error } = await supabase
//       .from('enrollments')
//       .select(`
//         *,
//         courses:course_id (
//           id,
//           title,
//           description,
//           thumbnail_url
//         )
//       `)
//       .eq('student_id', studentId)
//       .order('enrolled_at', { ascending: false })
    
//     if (error) throw error
//     return data || []
//   },

//   async getByCourse(courseId: string): Promise<Enrollment[]> {
//     const { data, error } = await supabase
//       .from('enrollments')
//       .select(`
//         *,
//         users:student_id (
//           id,
//           name,
//           email
//         )
//       `)
//       .eq('course_id', courseId)
//       .order('enrolled_at', { ascending: false })
    
//     if (error) throw error
//     return data || []
//   },

//   async unenroll(studentId: string, courseId: string): Promise<boolean> {
//     const { error } = await supabase
//       .from('enrollments')
//       .delete()
//       .eq('student_id', studentId)
//       .eq('course_id', courseId)
    
//     return !error
//   }
// }

// // Progress queries
// export const progressQueries = {
//   async markModuleComplete(studentId: string, moduleId: string): Promise<boolean> {
//     try {
//       const { error } = await supabase
//         .from('module_progress')
//         .upsert({
//           student_id: studentId,
//           module_id: moduleId,
//           completed: true,
//           completed_at: new Date().toISOString()
//         }, {
//           onConflict: 'student_id,module_id'
//         })
      
//       return !error
//     } catch (error) {
//       console.error('Error marking module complete:', error)
//       return false
//     }
//   },

//   async markModuleIncomplete(studentId: string, moduleId: string): Promise<boolean> {
//     try {
//       const { error } = await supabase
//         .from('module_progress')
//         .upsert({
//           student_id: studentId,
//           module_id: moduleId,
//           completed: false,
//           completed_at: null
//         }, {
//           onConflict: 'student_id,module_id'
//         })
      
//       return !error
//     } catch (error) {
//       console.error('Error marking module incomplete:', error)
//       return false
//     }
//   },

//   async getStudentProgress(studentId: string, courseId: string): Promise<ModuleProgress[]> {
//     const { data, error } = await supabase
//       .from('module_progress')
//       .select(`
//         *,
//         modules:module_id (
//           id,
//           title,
//           course_id,
//           order_index
//         )
//       `)
//       .eq('student_id', studentId)
//       .eq('modules.course_id', courseId)
    
//     if (error) throw error
//     return data || []
//   }
// }

// // Analytics queries
// export const analyticsQueries = {
//   async getDashboardStats(): Promise<DashboardStats> {
//     try {
//       const [coursesResult, studentsResult, modulesResult, enrollmentsResult] = await Promise.all([
//         supabase.from('courses').select('id').eq('is_active', true),
//         supabase.from('users').select('id').eq('role', 'student'),
//         supabase.from('modules').select('id').eq('is_active', true),
//         supabase.from('enrollments').select('progress_percentage, completed_at')
//       ])

//       const totalCourses = coursesResult.data?.length || 0
//       const totalStudents = studentsResult.data?.length || 0
//       const totalModules = modulesResult.data?.length || 0
      
//       const enrollments = enrollmentsResult.data || []
//       const averageProgress = enrollments.length > 0 
//         ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
//         : 0
      
//       const totalCompletions = enrollments.filter(e => e.completed_at).length
//       const activeStudents = new Set(enrollments.map(e => e.student_id)).size

//       return {
//         totalCourses,
//         totalStudents,
//         totalModules,
//         averageProgress,
//         totalCompletions,
//         activeStudents
//       }
//     } catch (error) {
//       console.error('Error getting dashboard stats:', error)
//       return {
//         totalCourses: 0,
//         totalStudents: 0,
//         totalModules: 0,
//         averageProgress: 0,
//         totalCompletions: 0,
//         activeStudents: 0
//       }
//     }
//   },

//   async getStudentStats(studentId: string): Promise<StudentDashboardStats> {
//     try {
//       const { data: enrollments, error } = await supabase
//         .from('enrollments')
//         .select(`
//           *,
//           courses:course_id (
//             id,
//             title
//           )
//         `)
//         .eq('student_id', studentId)

//       if (error) throw error

//       const enrolledCourses = enrollments?.length || 0
//       const completedCourses = enrollments?.filter(e => e.completed_at).length || 0
//       const averageProgress = enrolledCourses > 0
//         ? Math.round(enrollments!.reduce((sum, e) => sum + e.progress_percentage, 0) / enrolledCourses)
//         : 0

//       // Get module stats
//       const { data: moduleProgress } = await supabase
//         .from('module_progress')
//         .select('completed, completed_at')
//         .eq('student_id', studentId)

//       const totalModules = moduleProgress?.length || 0
//       const completedModules = moduleProgress?.filter(mp => mp.completed).length || 0
//       const lastActivity = moduleProgress
//         ?.filter(mp => mp.completed_at)
//         ?.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at || null

//       return {
//         enrolledCourses,
//         completedCourses,
//         totalModules,
//         completedModules,
//         averageProgress,
//         lastActivity
//       }
//     } catch (error) {
//       console.error('Error getting student stats:', error)
//       return {
//         enrolledCourses: 0,
//         completedCourses: 0,
//         totalModules: 0,
//         completedModules: 0,
//         averageProgress: 0,
//         lastActivity: null
//       }
//     }
//   }
// }

// // Legacy exports for backward compatibility with your existing code
// export const getAllCourses = courseQueries.getAll
// export const getAllStudents = userQueries.getStudents
// export const getStudentsInCourse = async (courseId: string) => {
//   const enrollments = await enrollmentQueries.getByCourse(courseId)
//   return enrollments.map(e => ({
//     ...e.users,
//     progress_percentage: e.progress_percentage
//   }))
// }