// types/database.ts - Database Type Definitions (TypeScript Fixed)

export interface User {
  id: string
  email: string
  password_hash?: string // Don't expose this in frontend
  name: string
  phone?: string | null // NEW: Optional phone field
  role: 'admin' | 'student'
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  created_by: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string
  order_index: number
  duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  completed_at: string | null
  progress_percentage: number
}

export interface ModuleProgress {
  id: string
  student_id: string
  module_id: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

// Extended types for frontend use
export interface CourseWithStats extends Course {
  module_count: number
  enrolled_students: number
  avg_progress: number
  total_completions: number
}

export interface StudentWithProgress extends User {
  enrolled_courses: number
  completed_courses: number
  avg_progress: number
  last_activity: string | null
}

export interface ModuleWithProgress extends Module {
  completed: boolean
  completed_at: string | null
}

export interface CourseWithModules extends Course {
  modules: ModuleWithProgress[]
  enrollment?: Enrollment
}

// API Response types (Fixed Generic)
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Authentication types
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  phone?: string | null
  role: 'admin' | 'student'
  created_at: string
}


// Dashboard Stats
export interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalModules: number
  averageProgress: number
  totalCompletions: number
  activeStudents: number
}

export interface StudentDashboardStats {
  enrolledCourses: number
  completedCourses: number
  totalModules: number
  completedModules: number
  averageProgress: number
  lastActivity: string | null
}

// Form data types
export interface CreateCourseData {
  title: string
  description: string
  thumbnail_url?: string
}

export interface CreateModuleData {
  title: string
  description: string
  video_url: string
  duration_minutes?: number
}

export interface CreateStudentData {
  name: string
  email: string
  password?: string
}

// Course enrollment data
export interface EnrollmentData {
  studentIds: string[]
  courseId: string
}

// Progress tracking
export interface CourseProgress {
  courseId: string
  totalModules: number
  completedModules: number
  progressPercentage: number
  nextModuleId?: string
  nextModuleTitle?: string
}

// CSV Export data
export interface StudentProgressCSV {
  studentName: string
  email: string
  progressPercentage: number
  completedModules: number
  totalModules: number
  lastActivity: string | null
}

// Error types
export interface DatabaseError {
  message: string
  code?: string
  details?: string
}



// Supabase relations for courses
export type CourseWithRelations = Course & {
  modules: Module[]
  enrollments: Enrollment[]
}