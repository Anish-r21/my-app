// app/student/page.tsx - Student Dashboard Main Page
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  LogOut, 
  User, 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp,
  Play,
  CheckCircle,
  ArrowRight
} from "lucide-react"
import type { AuthUser, StudentDashboardStats, CourseWithModules, Enrollment } from "@/types/database"

interface StudentCourse {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  modules: Array<{
    id: string
    title: string
    completed?: boolean
  }>
  enrollment: {
    progress_percentage: number
    enrolled_at: string
    completed_at: string | null
  }
}

export default function StudentDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [stats, setStats] = useState<StudentDashboardStats | null>(null)
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Check authentication first
      const authRes = await fetch('/api/auth/check', { credentials: 'include' })
      const authData = await authRes.json()
      
      if (!authData.success || authData.data?.role !== 'student') {
        router.push('/login')
        return
      }
      
      setUser(authData.data)

      // Get student stats
      const statsRes = await fetch('/api/student/stats', { credentials: 'include' })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(statsData.data)
        }
      }

      // Get enrolled courses
      const coursesRes = await fetch('/api/student/courses', { credentials: 'include' })
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        if (coursesData.success) {
          setCourses(coursesData.data || [])
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading your courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData} className="btn-primary">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--ui-card-border)] shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/student" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-[var(--fg-primary)]">LearnHub</span>
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  Student Portal
                </div>
              </div>
            </Link>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-[var(--ui-input-bg)] rounded-xl">
                <User className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--fg-primary)]">{user?.name}</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="ghost" 
                size="sm" 
                className="text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--fg-primary)] mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Continue your learning journey and track your progress.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Enrolled Courses</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.enrolledCourses}</p>
                  </div>
                  <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                    <BookOpen className="h-6 w-6 text-[var(--brand-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Completed Courses</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.completedCourses}</p>
                  </div>
                  <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                    <Award className="h-6 w-6 text-[var(--brand-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Modules Completed</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.completedModules}</p>
                    <p className="text-xs text-[var(--text-secondary)]">of {stats.totalModules} total</p>
                  </div>
                  <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                    <CheckCircle className="h-6 w-6 text-[var(--brand-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Overall Progress</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.averageProgress}%</p>
                  </div>
                  <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                    <TrendingUp className="h-6 w-6 text-[var(--brand-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Courses Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-[var(--fg-primary)]">My Courses</h2>
              <p className="text-[var(--text-secondary)]">Continue learning where you left off</p>
            </div>
          </div>

          {/* Courses Grid */}
          {courses.length === 0 ? (
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">
                  No courses assigned yet
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  You haven&apos;t been enrolled in any courses yet. Contact your administrator to get started.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-blue-700 text-sm">
                    <strong>Need help?</strong> Reach out to your course administrator to get enrolled in courses.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/student/courses/${course.id}`}>
                  <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group h-full">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-[var(--ui-input-bg)] rounded-lg group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] transition-colors" />
                      </div>
                      <CardTitle className="text-lg font-bold text-[var(--fg-primary)] group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2">
                        {course.title}
                      </CardTitle>
                      {course.description && (
                        <CardDescription className="text-[var(--text-secondary)] text-sm leading-relaxed line-clamp-3">
                          {course.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                              Progress: {course.enrollment.progress_percentage}%
                            </span>
                            {course.enrollment.completed_at && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(course.enrollment.progress_percentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Course Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-[var(--text-secondary)]">
                            <Play className="h-4 w-4 mr-1" />
                            <span>{course.modules?.length || 0} modules</span>
                          </div>
                          <div className="flex items-center text-xs text-[var(--text-secondary)]">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Enrolled {new Date(course.enrollment.enrolled_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Continue Learning Button */}
                        <div className="pt-2 border-t border-[var(--ui-card-border)]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-secondary)]">
                              {course.enrollment.progress_percentage === 100 
                                ? 'Course completed!'
                                : 'Continue learning'
                              }
                            </span>
                            <Badge 
                              variant="secondary" 
                              className="bg-[var(--ui-input-bg)] text-[var(--brand-primary)] text-xs"
                            >
                              {course.enrollment.progress_percentage === 100 ? (
                                <><Award className="h-3 w-3 mr-1" />Complete</>
                              ) : (
                                <><Play className="h-3 w-3 mr-1" />Resume</>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}