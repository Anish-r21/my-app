// app/admin/courses/[id]/enroll/page.tsx - Student Enrollment Interface
"use client"

import { useState, useEffect } from "react"
import { useParams} from "next/navigation"
// import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
// import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Users, 
  Search, 
  UserCheck, 
  UserPlus,
  Mail,
  Calendar
} from "lucide-react"
import type { User, Course } from "@/types/database"

interface StudentWithEnrollment extends User {
  enrolled: boolean
  enrollment_date?: string
}

export default function StudentEnrollmentPage() {
  // Use useParams instead of params prop for Next.js 15 compatibility
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<StudentWithEnrollment[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  // const router = useRouter()

  useEffect(() => {
    if (courseId) {
      loadData()
    }
  }, [courseId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get course details
      const courseRes = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include'
      })
      const courseData = await courseRes.json()
      
      if (!courseData.success) {
        throw new Error(courseData.error || 'Course not found')
      }
      
      setCourse(courseData.data)

      // Get all students and their enrollment status for this course
      const studentsRes = await fetch(`/api/admin/students/enrollment-status/${courseId}`, {
        credentials: 'include'
      })
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        if (studentsData.success) {
          setStudents(studentsData.data || [])
        }
      }

    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    const newSelection = new Set(selectedStudents)
    if (checked) {
      newSelection.add(studentId)
    } else {
      newSelection.delete(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all unenrolled students that match search
      const unenrolledStudents = filteredStudents.filter(s => !s.enrolled)
      setSelectedStudents(new Set(unenrolledStudents.map(s => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }

  const handleEnrollSelected = async () => {
    if (selectedStudents.size === 0) return

    setProcessing(true)
    setError("")
    setMessage("")

    try {
      const enrollmentRequests = Array.from(selectedStudents).map(studentId => 
        fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            studentId,
            courseId: courseId
          })
        })
      )

      const results = await Promise.all(enrollmentRequests)
      
      let successCount = 0
      let errorCount = 0

      for (const result of results) {
        const data = await result.json()
        if (data.success) {
          successCount++
        } else {
          errorCount++
        }
      }

      if (successCount > 0) {
        setMessage(`Successfully enrolled ${successCount} student(s)`)
        await loadData() // Refresh data
        setSelectedStudents(new Set()) // Clear selection
      }

      if (errorCount > 0) {
        setError(`Failed to enroll ${errorCount} student(s)`)
      }

    } catch (err) {
      console.error("Enrollment error: ", err)
      setError("Failed to enroll students")
    } finally {
      setProcessing(false)
    }
  }

  const handleUnenroll = async (studentId: string) => {
    if (!confirm('Are you sure you want to unenroll this student?')) return

    try {
      const response = await fetch('/api/enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          courseId: courseId
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Student unenrolled successfully')
        await loadData()
      } else {
        setError(result.error || 'Failed to unenroll student')
      }

    } catch (err) {
      console.error("Unenroll error:", err)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const enrolledStudents = filteredStudents.filter(s => s.enrolled)
  const unenrolledStudents = filteredStudents.filter(s => !s.enrolled)

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading enrollment data...</p>
        </div>
      </div>
    )
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin">
            <Button className="btn-primary">Back to Dashboard</Button>
          </Link>
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
              <Link href={`/admin/courses/${courseId}`}>
                <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
              <div className="h-6 w-px bg-[var(--ui-card-border)]"></div>
              <div>
                <h1 className="text-xl font-bold text-[var(--fg-primary)]">Enroll Students</h1>
                <p className="text-sm text-[var(--text-secondary)]">{course?.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl mb-6">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-[var(--ui-card-border)]"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => handleSelectAll(selectedStudents.size === 0)}
              variant="outline"
              className="border-[var(--ui-card-border)]"
              disabled={unenrolledStudents.length === 0}
            >
              {selectedStudents.size === 0 ? 'Select All Available' : 'Clear Selection'}
            </Button>
            
            <Button
              onClick={handleEnrollSelected}
              disabled={selectedStudents.size === 0 || processing}
              className="btn-primary"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Selected ({selectedStudents.size})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white border-[var(--ui-card-border)]">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-[var(--brand-primary)]" />
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Total Students</p>
                  <p className="text-xl font-bold text-[var(--fg-primary)]">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--ui-card-border)]">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Enrolled</p>
                  <p className="text-xl font-bold text-[var(--fg-primary)]">{enrolledStudents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--ui-card-border)]">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Available</p>
                  <p className="text-xl font-bold text-[var(--fg-primary)]">{unenrolledStudents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Students */}
          <Card className="bg-white border-[var(--ui-card-border)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>Available Students ({unenrolledStudents.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {unenrolledStudents.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[var(--text-secondary)]">All students are enrolled in this course</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {unenrolledStudents.map((student) => (
                    <div key={student.id} className="flex items-center space-x-3 p-4 hover:bg-[var(--ui-input-bg)] transition-colors">
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[var(--fg-primary)]">{student.name}</p>
                        <div className="flex items-center space-x-1 text-sm text-[var(--text-secondary)]">
                          <Mail className="h-3 w-3" />
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Students */}
          <Card className="bg-white border-[var(--ui-card-border)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <span>Enrolled Students ({enrolledStudents.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {enrolledStudents.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-[var(--text-secondary)]">No students enrolled yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {enrolledStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 hover:bg-[var(--ui-input-bg)] transition-colors">
                      <div>
                        <p className="font-medium text-[var(--fg-primary)]">{student.name}</p>
                        <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{student.email}</span>
                          </div>
                          {student.enrollment_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Enrolled {new Date(student.enrollment_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUnenroll(student.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Unenroll
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}