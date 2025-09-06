// app/student/courses/[id]/page.tsx - Student Course Detail Page
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  BookOpen, 
  Play, 
  CheckCircle, 
  Award,
  ExternalLink
} from "lucide-react"
import { utils } from "@/lib/database"
import type { Course, Module } from "@/types/database"

interface ModuleWithProgress extends Module {
  completed: boolean
  completed_at: string | null
}

interface StudentCourseData extends Course {
  modules: ModuleWithProgress[]
  enrollment: {
    progress_percentage: number
    enrolled_at: string
    completed_at: string | null
  }
}

export default function StudentCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [course, setCourse] = useState<StudentCourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingModuleId, setProcessingModuleId] = useState<string | null>(null)
  const [courseId, setCourseId] = useState<string>("")
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
      
      const response = await fetch(`/api/student/courses/${courseId}`, {
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load course')
      }
      
      setCourse(result.data)
      
    } catch (error) {
      console.error('Error loading course:', error)
      setError(error instanceof Error ? error.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async (moduleId: string, completed: boolean) => {
    setProcessingModuleId(moduleId)
    
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleId,
          completed
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update progress')
      }

      // Reload course data to get updated progress
      await loadCourseData()
      
    } catch (error) {
      console.error('Error updating progress:', error)
      // You could add a toast notification here
    } finally {
      setProcessingModuleId(null)
    }
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
          <Link href="/student">
            <Button className="btn-primary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const completedModules = course.modules.filter(m => m.completed).length
  const totalModules = course.modules.length
  const nextModule = course.modules.find(m => !m.completed)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--ui-card-border)] shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/student">
                <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)]">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-[var(--ui-card-border)]"></div>
              <div>
                <h1 className="text-xl font-bold text-[var(--fg-primary)]">{course.title}</h1>
                <p className="text-sm text-[var(--text-secondary)]">Course Progress</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge 
                variant={course.enrollment.completed_at ? "default" : "secondary"}
                className={course.enrollment.completed_at 
                  ? "bg-green-100 text-green-800" 
                  : "bg-[var(--ui-input-bg)] text-[var(--brand-primary)]"
                }
              >
                {course.enrollment.progress_percentage}% Complete
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Course Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-[var(--fg-primary)]">Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {course.description || 'No description available for this course.'}
                </p>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Progress: {completedModules}/{totalModules} modules completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${course.enrollment.progress_percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-[var(--brand-primary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Total Modules</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{totalModules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Completed</p>
                    <p className="text-2xl font-bold text-[var(--fg-primary)]">{completedModules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {course.enrollment.completed_at && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-800">Congratulations!</p>
                  <p className="text-sm text-green-700">Course completed on</p>
                  <p className="text-sm text-green-700">
                    {new Date(course.enrollment.completed_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Next Module to Watch */}
        {nextModule && !course.enrollment.completed_at && (
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Continue Learning</h3>
                  <p className="text-blue-700">Up next: {nextModule.title}</p>
                </div>
                <Link href={`/student/courses/${courseId}/modules/${nextModule.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Continue
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules List */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--fg-primary)] mb-2">Course Modules</h2>
            <p className="text-[var(--text-secondary)]">Watch videos and track your progress</p>
          </div>

          <div className="space-y-4">
            {course.modules
              .sort((a, b) => a.order_index - b.order_index)
              .map((module, index) => {
                const embedUrl = getYouTubeEmbedUrl(module.video_url)
                const isProcessing = processingModuleId === module.id
                
                return (
                  <Card key={module.id} className={`bg-white border-[var(--ui-card-border)] shadow-sm ${
                    module.completed ? 'bg-green-50 border-green-200' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Module Number & Status */}
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            module.completed 
                              ? 'bg-green-600 text-white' 
                              : 'bg-[var(--brand-primary)] text-white'
                          }`}>
                            {module.completed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          
                          {/* Complete/Incomplete Button */}
                          <Button
                            onClick={() => handleMarkComplete(module.id, !module.completed)}
                            disabled={isProcessing}
                            variant={module.completed ? "default" : "outline"}
                            size="sm"
                            className={`text-xs ${
                              module.completed 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'border-[var(--ui-card-border)]'
                            }`}
                          >
                            {isProcessing ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : module.completed ? (
                              'Completed'
                            ) : (
                              'Mark Complete'
                            )}
                          </Button>
                        </div>
                        
                        {/* Module Content */}
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
                                {module.completed && module.completed_at && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                    Completed {new Date(module.completed_at).toLocaleDateString()}
                                  </Badge>
                                )}
                                <a 
                                  href={module.video_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-[var(--brand-primary)] hover:underline flex items-center"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Watch on YouTube
                                </a>
                              </div>
                            </div>
                            
                            <Link href={`/student/courses/${courseId}/modules/${module.id}`}>
                              <Button variant="outline" size="sm" className="border-[var(--ui-card-border)]">
                                <Play className="h-4 w-4 mr-2" />
                                Watch
                              </Button>
                            </Link>
                          </div>
                          
                          {/* Video Thumbnail/Preview */}
                          {embedUrl && (
                            <div className="bg-[var(--ui-input-bg)] rounded-lg p-4">
                              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                                <iframe
                                  src={embedUrl}
                                  title={module.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
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
        </div>
      </main>
    </div>
  )
}