// app/admin/students/[id]/page.tsx - Student Detail & Edit Page
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react"
import type { User as UserType, Enrollment, Course } from "@/types/database"

interface StudentDetail extends UserType {
  enrolled_courses: number
  completed_courses: number
  avg_progress: number
  last_activity: string | null
  total_modules: number
  completed_modules: number
}

interface StudentCourse extends Course {
  enrollment: Enrollment
  modules_count: number
  completed_modules: number
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [studentId, setStudentId] = useState<string>("")

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")
  const [editSuccess, setEditSuccess] = useState("")

  // Password reset state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false })

  const router = useRouter()

  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params
      setStudentId(resolvedParams.id)
    }
    extractParams()
  }, [params])

  useEffect(() => {
    if (studentId) loadStudentData()
  }, [studentId])

  const loadStudentData = async () => {
    try {
      setLoading(true)

      const [studentRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/students/${studentId}`, { credentials: "include" }),
        fetch(`/api/admin/students/${studentId}/courses`, { credentials: "include" })
      ])

      const studentData = await studentRes.json()
      const coursesData = await coursesRes.json()

      if (!studentData.success) throw new Error(studentData.error || "Student not found")

      setStudent(studentData.data)
      setEditForm({
        name: studentData.data.name,
        email: studentData.data.email,
        phone: studentData.data.phone || ""
      })

      if (coursesData.success) setStudentCourses(coursesData.data || [])
    } catch (error) {
      console.error("Error loading student:", error)
      setError(error instanceof Error ? error.message : "Failed to load student")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError("")
    setEditSuccess("")

    try {
      if (!editForm.name.trim() || !editForm.email.trim()) throw new Error("Name and email are required")

      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to update student")

      setEditSuccess("Student updated successfully!")
      setIsEditing(false)
      await loadStudentData()
      setTimeout(() => setEditSuccess(""), 3000)
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to update student")
    } finally {
      setEditLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError("")
    setPasswordSuccess("")

    try {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword)
        throw new Error("Both password fields are required")
      if (passwordForm.newPassword.length < 6) throw new Error("Password must be at least 6 characters long")
      if (passwordForm.newPassword !== passwordForm.confirmPassword)
        throw new Error("Passwords do not match")

      const response = await fetch(`/api/admin/students/${studentId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to reset password")

      setPasswordSuccess("Password reset successfully!")
      setPasswordForm({ newPassword: "", confirmPassword: "" })
      setTimeout(() => {
        setShowPasswordDialog(false)
        setPasswordSuccess("")
      }, 2000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      setPasswordLoading(false)
    }
  }

  const togglePasswordVisibility = (field: "new" | "confirm") => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (!studentId || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">
            {loading ? "Loading student details..." : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Student not found"}</p>
          <Link href="/admin/students">
            <Button className="btn-primary">Back to Students</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--ui-card-border)] shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin/students">
              <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Students
              </Button>
            </Link>
            <div className="h-6 w-px bg-[var(--ui-card-border)]"></div>
            <div>
              <h1 className="text-xl font-bold text-[var(--fg-primary)]">{student.name}</h1>
              <p className="text-sm text-[var(--text-secondary)]">Student Details & Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {editSuccess && (
              <div className="bg-green-100 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
                {editSuccess}
              </div>
            )}
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className={isEditing ? "border-[var(--ui-card-border)]" : "btn-primary"}
            >
              {isEditing ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Edit className="h-4 w-4 mr-2" /> Edit</>}
            </Button>
            <Button onClick={() => setShowPasswordDialog(true)} variant="outline" size="sm">
              Reset Password
            </Button>
          </div>
        </div>
      </header>

      {/* Student Info Section */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Card className="bg-white border-[var(--ui-card-border)] shadow-sm mb-8">
          <CardContent className="p-6">
            {!isEditing ? (
              <div>
                <div className="space-y-3">
                  <p><Mail className="inline h-4 w-4 mr-2 text-gray-500" /> {student.email}</p>
                  {student.phone && <p><Phone className="inline h-4 w-4 mr-2 text-gray-500" /> {student.phone}</p>}
                  <p><Calendar className="inline h-4 w-4 mr-2 text-gray-500" /> Joined {new Date(student.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateStudent} className="space-y-4">
                {editError && <div className="bg-red-100 text-red-700 p-2 rounded">{editError}</div>}
                <div>
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <Button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Enrolled Courses */}
        <h2 className="text-lg font-semibold mb-4">Enrolled Courses</h2>
        {studentCourses.length === 0 ? (
          <p className="text-gray-500">No courses enrolled</p>
        ) : (
          <div className="space-y-4">
            {studentCourses.map((course) => (
              <Card key={course.id} className="bg-white border-[var(--ui-card-border)] shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.description}</p>
                  </div>
                  <Badge>{course.completed_modules}/{course.modules_count} Modules</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {passwordError && <div className="bg-red-100 text-red-700 p-2 rounded">{passwordError}</div>}
            {passwordSuccess && <div className="bg-green-100 text-green-700 p-2 rounded">{passwordSuccess}</div>}
            <div>
              <Label>New Password</Label>
              <div className="flex">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                />
                <Button type="button" variant="ghost" onClick={() => togglePasswordVisibility("new")}>
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>Confirm Password</Label>
              <div className="flex">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                />
                <Button type="button" variant="ghost" onClick={() => togglePasswordVisibility("confirm")}>
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="btn-primary" disabled={passwordLoading}>
                {passwordLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}