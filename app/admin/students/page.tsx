// app/admin/students/page.tsx - Admin Students Management
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Filter,
  Download,
  Eye
} from "lucide-react"
import type { User, Enrollment } from "@/types/database"

interface StudentWithStats extends User {
  enrolled_courses: number
  completed_courses: number
  avg_progress: number
  last_activity: string | null
  total_modules: number
  completed_modules: number
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentWithStats[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<'all' | 'enrolled' | 'not_enrolled'>('all')
  
  const router = useRouter()

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, filterType])

  const loadStudents = async () => {
    try {
      setLoading(true)
      
      // Get all students with their enrollment statistics
      const response = await fetch('/api/admin/students/stats', {
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load students')
      }
      
      setStudents(result.data || [])
      
    } catch (error) {
      console.error('Error loading students:', error)
      setError(error instanceof Error ? error.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    let filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.phone && student.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (filterType === 'enrolled') {
      filtered = filtered.filter(student => student.enrolled_courses > 0)
    } else if (filterType === 'not_enrolled') {
      filtered = filtered.filter(student => student.enrolled_courses === 0)
    }

    setFilteredStudents(filtered)
  }

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return
    
    const csvHeaders = ['Name', 'Email', 'Phone', 'Enrolled Courses', 'Completed Courses', 'Average Progress', 'Completed Modules', 'Total Modules', 'Last Activity', 'Created Date']
    
    const csvData = filteredStudents.map(student => [
      student.name,
      student.email,
      student.phone || 'N/A',
      student.enrolled_courses.toString(),
      student.completed_courses.toString(),
      `${student.avg_progress}%`,
      student.completed_modules.toString(),
      student.total_modules.toString(),
      student.last_activity ? new Date(student.last_activity).toLocaleDateString() : 'No activity',
      new Date(student.created_at).toLocaleDateString()
    ])
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `students-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBgColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-100 border-green-200'
    if (progress >= 50) return 'bg-yellow-100 border-yellow-200'
    return 'bg-red-100 border-red-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--ui-card-border)] shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-[var(--ui-card-border)]"></div>
              <div>
                <h1 className="text-xl font-bold text-[var(--fg-primary)]">Student Management</h1>
                <p className="text-sm text-[var(--text-secondary)]">View and manage all students</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="border-[var(--ui-card-border)]"
                disabled={filteredStudents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Link href="/admin/students/new">
                <Button className="btn-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">{students.length}</p>
                </div>
                <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                  <Users className="h-6 w-6 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Enrolled</p>
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">
                    {students.filter(s => s.enrolled_courses > 0).length}
                  </p>
                </div>
                <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                  <BookOpen className="h-6 w-6 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Not Enrolled</p>
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">
                    {students.filter(s => s.enrolled_courses === 0).length}
                  </p>
                </div>
                <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                  <UserPlus className="h-6 w-6 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Avg Progress</p>
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, s) => sum + s.avg_progress, 0) / students.length)
                      : 0
                    }%
                  </p>
                </div>
                <div className="p-3 bg-[var(--ui-input-bg)] rounded-xl">
                  <TrendingUp className="h-6 w-6 text-[var(--brand-primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search students by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-[var(--ui-card-border)] h-11"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
            <div className="flex space-x-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'btn-primary' : 'border-[var(--ui-card-border)]'}
              >
                All ({students.length})
              </Button>
              <Button
                variant={filterType === 'enrolled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('enrolled')}
                className={filterType === 'enrolled' ? 'btn-primary' : 'border-[var(--ui-card-border)]'}
              >
                Enrolled ({students.filter(s => s.enrolled_courses > 0).length})
              </Button>
              <Button
                variant={filterType === 'not_enrolled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('not_enrolled')}
                className={filterType === 'not_enrolled' ? 'btn-primary' : 'border-[var(--ui-card-border)]'}
              >
                Not Enrolled ({students.filter(s => s.enrolled_courses === 0).length})
              </Button>
            </div>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">
                {searchTerm ? 'No students found' : 'No students yet'}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms or filter options.'
                  : 'Add your first student to get started with the platform.'
                }
              </p>
              {!searchTerm && (
                <Link href="/admin/students/new">
                  <Button className="btn-primary">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Student
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="bg-white border-[var(--ui-card-border)] shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center font-semibold text-lg">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Student Info */}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-[var(--fg-primary)] text-lg">
                            {student.name}
                          </h3>
                          {student.enrolled_courses === 0 && (
                            <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                              Not Enrolled
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-[var(--text-secondary)]">
                            <Mail className="h-3 w-3 mr-2" />
                            <span className="truncate">{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center text-sm text-[var(--text-secondary)]">
                              <Phone className="h-3 w-3 mr-2" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm text-[var(--text-secondary)]">
                            <Calendar className="h-3 w-3 mr-2" />
                            <span>Joined {new Date(student.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats and Actions */}
                    <div className="flex items-center space-x-6">
                      {/* Stats */}
                      <div className="text-right space-y-2">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-xs text-[var(--text-secondary)]">Courses</p>
                            <p className="font-bold text-[var(--fg-primary)]">{student.enrolled_courses}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-[var(--text-secondary)]">Completed</p>
                            <p className="font-bold text-[var(--fg-primary)]">{student.completed_courses}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-[var(--text-secondary)]">Modules</p>
                            <p className="font-bold text-[var(--fg-primary)]">{student.completed_modules}/{student.total_modules}</p>
                          </div>
                        </div>
                        
                        {student.enrolled_courses > 0 && (
                          <div className={`px-3 py-1 rounded-full border ${getProgressBgColor(student.avg_progress)}`}>
                            <p className={`text-xs font-medium ${getProgressColor(student.avg_progress)}`}>
                              {student.avg_progress}% Progress
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link href={`/admin/students/${student.id}`}>
                        <Button variant="outline" size="sm" className="border-[var(--ui-card-border)] hover:bg-[var(--ui-input-bg)]">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}