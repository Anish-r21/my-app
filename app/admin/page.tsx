// app/admin/page.tsx - Admin Dashboard Main Page
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  LogOut, 
  User, 
  Plus, 
  BookOpen, 
  Users, 
  BarChart3, 
  Search,
  TrendingUp,
  Award,
  Clock,
  ArrowRight
} from "lucide-react"
import type { AuthUser, DashboardStats, CourseWithStats } from "@/types/database"

export default function AdminDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [courses, setCourses] = useState<CourseWithStats[]>([])
  const [searchTerm, setSearchTerm] = useState("")
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
      
      if (!authData.success || authData.data?.role !== 'admin') {
        router.push('/login')
        return
      }
      
      setUser(authData.data)

      // Get dashboard stats
      const statsRes = await fetch('/api/analytics/dashboard')
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.data)
      }

      // Get courses
      const coursesRes = await fetch('/api/courses')
      const coursesData = await coursesRes.json()
      if (coursesData.success) {
        setCourses(coursesData.data)
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
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Enhanced Loading Animation */}
          <div className="relative w-16 h-16 mx-auto">
            {/* Outer spinning ring */}
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin"></div>
            {/* Inner spinning ring */}
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[var(--brand-primary)] border-r-[var(--brand-primary)] rounded-full animate-spin"></div>
            {/* Center logo */}
            <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-[var(--brand-primary)]" />
            </div>
          </div>
          
          {/* Loading text with animation */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--fg-primary)]">
              Loading Dashboard
            </h3>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-[var(--text-secondary)]">Please wait</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-1 bg-[var(--brand-primary)] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>


        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={loadDashboardData} className="btn-primary">
              Try Again
            </Button>
          </div>
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
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-[var(--fg-primary)]">LearnHub</span>
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  Admin Dashboard
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
            Manage your courses, students, and track learning progress.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Courses</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.totalCourses}</p>
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
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Students</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.totalStudents}</p>
                  </div>
                  <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                    <Users className="h-6 w-6 text-[var(--brand-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Average Progress</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.averageProgress}%</p>
                  </div>
                  <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                    <TrendingUp className="h-6 w-6 text-[var(--brand-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Completions</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats.totalCompletions}</p>
                  </div>
                  <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                    <Award className="h-6 w-6 text-[var(--brand-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link href="/admin/courses/new" className="flex-1">
            <Button className="w-full btn-primary h-12 text-base font-semibold">
              <Plus className="h-5 w-5 mr-2" />
              Create New Course
            </Button>
          </Link>
          <Link href="/admin/students/new" className="flex-1">
            <Button className="w-full btn-secondary h-12 text-base font-semibold">
              <Users className="h-5 w-5 mr-2" />
              Add Student
            </Button>
          </Link>
          <Link href="/admin/analytics" className="flex-1">
            <Button variant="outline" className="w-full h-12 text-base font-semibold border-[var(--ui-card-border)] hover:bg-[var(--ui-input-bg)]">
              <BarChart3 className="h-5 w-5 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>

        {/* Courses Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--fg-primary)]">Your Courses</h2>
              <p className="text-[var(--text-secondary)]">Manage and track all your courses</p>
            </div>
            
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-[var(--ui-card-border)] focus:border-[var(--brand-primary)] h-11"
              />
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">
                  {searchTerm ? 'No courses found' : 'No courses yet'}
                </h3>
                <p className="text-[var(--text-secondary)] mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms or clear the filter.'
                    : 'Create your first course to get started with the platform.'
                  }
                </p>
                {!searchTerm && (
                  <Link href="/admin/courses/new">
                    <Button className="btn-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link key={course.id} href={`/admin/courses/${course.id}`}>
                  <Card className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group h-full">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-[var(--ui-input-bg)] rounded-lg group-hover:bg-[var(--brand-primary)] transition-colors">
                          <BookOpen className="h-5 w-5 text-[var(--brand-primary)] transition-colors" />
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
                        {/* Course Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-[var(--text-secondary)] text-sm">
                              <BookOpen className="h-4 w-4 mr-1" />
                              <span>{course.module_count} modules</span>
                            </div>
                            <div className="flex items-center text-[var(--text-secondary)] text-sm">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{course.enrolled_students} students</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                              Avg Progress: {course.avg_progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(course.avg_progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--ui-card-border)]">
                          <div className="flex items-center text-xs text-[var(--text-secondary)]">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{new Date(course.created_at).toLocaleDateString()}</span>
                          </div>
                          <Badge variant="secondary" className="bg-[var(--ui-input-bg)] text-[var(--brand-primary)] text-xs">
                            {course.total_completions} completed
                          </Badge>
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