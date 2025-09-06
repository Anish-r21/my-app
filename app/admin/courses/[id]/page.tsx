// app/admin/courses/[id]/page.tsx - Course Detail Page
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  BarChart3, 
  Play, 
  Download,
  GripVertical,
  ExternalLink
} from "lucide-react"
import type { Course, Module, ApiResponse } from "@/types/database"
import { utils } from "@/lib/database"

interface CourseWithModules extends Course {
  modules: Module[]
}

interface StudentInCourse {
  id: string
  name: string
  email: string
  role: 'admin' | 'student'
  progress_percentage: number
  created_at: string
  updated_at: string
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [course, setCourse] = useState<CourseWithModules | null>(null)
  const [students, setStudents] = useState<StudentInCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [courseId, setCourseId] = useState<string>("")
  
  // Module form state
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    video_url: "",
    duration_minutes: 0
  })
  const [moduleLoading, setModuleLoading] = useState(false)
  
  const router = useRouter()

  // Extract params on component mount
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.id);
    };
    extractParams();
  }, [params]);

  useEffect(() => {
    if (courseId) {
      loadCourseData()
    }
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      
      const [courseRes, studentsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/students`)
      ])

      const courseData = await courseRes.json()
      const studentsData = await studentsRes.json()

      if (!courseData.success) {
        throw new Error(courseData.error || 'Course not found')
      }

      setCourse(courseData.data)
      if (studentsData.success) {
        setStudents(studentsData.data || [])
      }

    } catch (error) {
      console.error('Error loading course:', error)
      setError(error instanceof Error ? error.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault()
    setModuleLoading(true)

    try {
      if (!moduleForm.title.trim() || !moduleForm.video_url.trim()) {
        throw new Error("Title and video URL are required")
      }

      const response = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleForm.title.trim(),
          description: moduleForm.description.trim(),
          video_url: moduleForm.video_url.trim(),
          duration_minutes: moduleForm.duration_minutes || 0
        })
      })

      const result: ApiResponse<Module> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create module')
      }

      // Reload course data to show new module
      await loadCourseData()
      
      // Reset form
      setModuleForm({
        title: "",
        description: "",
        video_url: "",
        duration_minutes: 0
      })
      setShowModuleForm(false)

    } catch (error) {
      console.error('Create module error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create module')
    } finally {
      setModuleLoading(false)
    }
  }

  const handleDownloadCSV = () => {
    if (students.length === 0) return
    
    const csvContent = utils.generateCSV(students, course?.title || 'Course')
    utils.downloadCSV(csvContent, `${course?.title || 'course'}-students.csv`)
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = utils.extractYouTubeVideoId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  // Don't render until we have the courseId
  if (!courseId) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Course not found'}</p>
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
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-[var(--ui-card-border)]"></div>
              <div>
                <h1 className="text-xl font-bold text-[var(--fg-primary)]">{course.title}</h1>
                <p className="text-sm text-[var(--text-secondary)]">Course Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-[var(--ui-card-border)]">
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Button>
              <Button 
                onClick={handleDownloadCSV}
                variant="outline" 
                size="sm" 
                className="border-[var(--ui-card-border)]"
                disabled={students.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-[var(--ui-card-border)] p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white font-medium"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="modules"
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white font-medium"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Modules ({course.modules?.length || 0})
            </TabsTrigger>
            <TabsTrigger 
              value="students"
              className="data-[state=active]:bg-[var(--brand-primary)] data-[state=active]:text-white font-medium"
            >
              <Users className="h-4 w-4 mr-2" />
              Students ({students.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Modules</p>
                      <p className="text-2xl font-bold text-[var(--fg-primary)]">{course.modules?.length || 0}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-[var(--brand-primary)]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Enrolled Students</p>
                      <p className="text-2xl font-bold text-[var(--fg-primary)]">{students.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-[var(--brand-primary)]" />
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
                          ? Math.round(students.reduce((sum, s) => sum + s.progress_percentage, 0) / students.length)
                          : 0
                        }%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-[var(--brand-primary)]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Info */}
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[var(--fg-primary)]">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-[var(--fg-primary)]">Description</Label>
                  <p className="text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {course.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[var(--fg-primary)]">Created</Label>
                  <p className="text-[var(--text-secondary)] mt-1">
                    {new Date(course.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-[var(--fg-primary)]">Course Modules</h3>
                <p className="text-[var(--text-secondary)]">Manage video modules for this course</p>
              </div>
              <Dialog open={showModuleForm} onOpenChange={setShowModuleForm}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleCreateModule}>
                    <DialogHeader>
                      <DialogTitle>Add New Module</DialogTitle>
                      <DialogDescription>
                        Create a new video module for this course
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="module-title">Module Title *</Label>
                        <Input
                          id="module-title"
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Introduction to HTML"
                          className="h-11"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="module-description">Description</Label>
                        <Textarea
                          id="module-description"
                          value={moduleForm.description}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what this module covers..."
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="video-url">YouTube Video URL *</Label>
                        <Input
                          id="video-url"
                          value={moduleForm.video_url}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, video_url: e.target.value }))}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="h-11"
                          required
                        />
                        <p className="text-xs text-[var(--text-secondary)]">
                          YouTube, YouTube Shorts, or YouTube embed URLs are supported
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={moduleForm.duration_minutes}
                          onChange={(e) => setModuleForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                          placeholder="e.g., 15"
                          min="0"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowModuleForm(false)}
                        disabled={moduleLoading}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="btn-primary"
                        disabled={moduleLoading || !moduleForm.title.trim() || !moduleForm.video_url.trim()}
                      >
                        {moduleLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Module
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Modules List */}
            {course.modules && course.modules.length > 0 ? (
              <div className="space-y-4">
                {course.modules
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((module, index) => {
                    const embedUrl = getYouTubeEmbedUrl(module.video_url)
                    return (
                      <Card key={module.id} className="bg-white border-[var(--ui-card-border)] shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <GripVertical className="h-4 w-4 text-[var(--text-secondary)] cursor-move" />
                            </div>
                            
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-[var(--fg-primary)] text-lg">{module.title}</h4>
                                  {module.description && (
                                    <p className="text-[var(--text-secondary)] text-sm mt-1">{module.description}</p>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2">
                                    <Badge variant="secondary" className="bg-[var(--ui-input-bg)] text-[var(--brand-primary)]">
                                      {module.duration_minutes > 0 ? `${module.duration_minutes} min` : 'Duration not set'}
                                    </Badge>
                                    {embedUrl && (
                                      <a 
                                        href={module.video_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-[var(--brand-primary)] hover:underline flex items-center"
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        View on YouTube
                                      </a>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" className="text-[var(--text-secondary)]">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Video Preview */}
                              {embedUrl && (
                                <div className="bg-[var(--ui-input-bg)] rounded-lg p-4">
                                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                    <iframe
                                      src={embedUrl}
                                      title={module.title}
                                      className="w-full h-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                      referrerPolicy="strict-origin-when-cross-origin"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            ) : (
              <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
                <CardContent className="p-12 text-center">
                  <Play className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">No modules yet</h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    Start by adding video modules to your course. Students will see modules in the order you create them.
                  </p>
                  <Button onClick={() => setShowModuleForm(true)} className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Module
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-[var(--fg-primary)]">Enrolled Students</h3>
                <p className="text-[var(--text-secondary)]">Track student progress and manage enrollments</p>
              </div>
              <Link href={`/admin/courses/${courseId}/enroll`}>
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll Students
                </Button>
              </Link>
            </div>

            {students.length > 0 ? (
              <div className="space-y-4">
                {students.map((student) => (
                  <Card key={student.id} className="bg-white border-[var(--ui-card-border)] shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[var(--fg-primary)]">{student.name}</h4>
                            <p className="text-sm text-[var(--text-secondary)]">{student.email}</p>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={student.progress_percentage === 100 ? "default" : "secondary"}
                              className={student.progress_percentage === 100 
                                ? "bg-green-100 text-green-800" 
                                : "bg-[var(--ui-input-bg)] text-[var(--brand-primary)]"
                              }
                            >
                              {student.progress_percentage}% Complete
                            </Badge>
                          </div>
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(student.progress_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">No students enrolled</h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    Start by enrolling students in this course to track their progress.
                  </p>
                  <Link href={`/admin/courses/${courseId}/enroll`}>
                    <Button className="btn-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Enroll Students
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}