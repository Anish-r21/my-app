// app/student/courses/[id]/modules/[moduleId]/page.tsx - Module Player
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle, 
  Play,
  ExternalLink,
  SkipForward,
  SkipBack,
  BookOpen
} from "lucide-react"
import { utils } from "@/lib/database"
import type { Module, Course } from "@/types/database"

interface ModuleWithProgress extends Module {
  completed: boolean
  completed_at: string | null
}

interface CourseData extends Course {
  modules: ModuleWithProgress[]
  enrollment: {
    progress_percentage: number
    enrolled_at: string
    completed_at: string | null
  }
}

export default function ModulePlayerPage({ 
  params 
}: { 
  params: Promise<{ id: string; moduleId: string }> 
}) {
  const [course, setCourse] = useState<CourseData | null>(null)
  const [currentModule, setCurrentModule] = useState<ModuleWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [error, setError] = useState("")
  const [courseId, setCourseId] = useState<string>("")
  const [moduleId, setModuleId] = useState<string>("")
  
  // Extract params on component mount
  useEffect(() => {
    const extractParams = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.id);
      setModuleId(resolvedParams.moduleId);
    };
    extractParams();
  }, [params]);

  useEffect(() => {
    if (courseId && moduleId) {
      loadData()
    }
  }, [courseId, moduleId])

  const loadData = async () => {
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
      
      // Find current module
      const currentModule = result.data.modules.find((m: ModuleWithProgress) => m.id === moduleId)
      if (currentModule) {
        setCurrentModule(currentModule)
      } else {
        throw new Error('Module not found')
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load module')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async (completed: boolean) => {
    if (!currentModule) return
    
    setMarkingComplete(true)
    
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moduleId: currentModule.id,
          completed
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update progress')
      }

      // Reload data to get updated progress
      await loadData()
      
    } catch (error) {
      console.error('Error updating progress:', error)
      setError('Failed to update progress')
    } finally {
      setMarkingComplete(false)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = utils.extractYouTubeVideoId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null
  }

  const getAdjacentModules = () => {
    if (!course || !currentModule) return { prev: null, next: null }
    
    const sortedModules = course.modules
      .filter(m => m.is_active)
      .sort((a, b) => a.order_index - b.order_index)
    
    const currentIndex = sortedModules.findIndex(m => m.id === currentModule.id)
    
    return {
      prev: currentIndex > 0 ? sortedModules[currentIndex - 1] : null,
      next: currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null
    }
  }

  // Don't render until we have the params
  if (!courseId || !moduleId) {
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
          <p className="text-[var(--text-secondary)]">Loading module...</p>
        </div>
      </div>
    )
  }

  if (error || !course || !currentModule) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Module not found'}</p>
          <Link href="/student">
            <Button className="btn-primary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const embedUrl = getYouTubeEmbedUrl(currentModule.video_url)
  const { prev, next } = getAdjacentModules()
  const completedModules = course.modules.filter(m => m.completed).length

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--ui-card-border)] shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
              <Link href={`/student/courses/${courseId}`}>
                <Button variant="ghost" size="sm" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] shrink-0">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
              </Link>
              <div className="h-6 w-px bg-[var(--ui-card-border)] shrink-0"></div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[var(--fg-primary)] truncate">{currentModule.title}</h1>
                <p className="text-sm text-[var(--text-secondary)] truncate">{course.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 shrink-0">
              <Badge variant="secondary" className="bg-[var(--ui-input-bg)] text-[var(--brand-primary)]">
                Module {course.modules.findIndex(m => m.id === currentModule.id) + 1} of {course.modules.length}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video */}
            {embedUrl ? (
              <Card className="bg-white border-[var(--ui-card-border)] shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-black">
                    <iframe
                      src={embedUrl}
                      title={currentModule.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
                <CardContent className="p-12 text-center">
                  <Play className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--fg-primary)] mb-2">Video not available</h3>
                  <p className="text-[var(--text-secondary)] mb-4">The video URL appears to be invalid.</p>
                  <a 
                    href={currentModule.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[var(--brand-primary)] hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Original Link
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Module Info */}
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-[var(--fg-primary)]">{currentModule.title}</CardTitle>
                    <div className="flex items-center space-x-4 mt-2">
                      {currentModule.duration_minutes > 0 && (
                        <Badge variant="secondary" className="bg-[var(--ui-input-bg)] text-[var(--brand-primary)]">
                          {currentModule.duration_minutes} min
                        </Badge>
                      )}
                      {currentModule.completed && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleMarkComplete(!currentModule.completed)}
                    disabled={markingComplete}
                    variant={currentModule.completed ? "default" : "outline"}
                    className={currentModule.completed 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white"
                    }
                  >
                    {markingComplete ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : currentModule.completed ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {currentModule.completed ? 'Completed' : 'Mark Complete'}
                  </Button>
                </div>
              </CardHeader>
              
              {currentModule.description && (
                <CardContent>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {currentModule.description}
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              {prev ? (
                <Link href={`/student/courses/${courseId}/modules/${prev.id}`}>
                  <Button variant="outline" className="border-[var(--ui-card-border)]">
                    <SkipBack className="h-4 w-4 mr-2" />
                    Previous: {prev.title}
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              
              {next ? (
                <Link href={`/student/courses/${courseId}/modules/${next.id}`}>
                  <Button className="btn-primary">
                    Next: {next.title}
                    <SkipForward className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/student/courses/${courseId}`}>
                  <Button className="btn-primary">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Back to Course
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Course Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[var(--fg-primary)]">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--brand-primary)]">
                    {course.enrollment.progress_percentage}%
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {completedModules} of {course.modules.length} modules
                  </p>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.enrollment.progress_percentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Module List */}
            <Card className="bg-white border-[var(--ui-card-border)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[var(--fg-primary)]">All Modules</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {course.modules
                    .filter(m => m.is_active)
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((module, index) => (
                    <Link 
                      key={module.id} 
                      href={`/student/courses/${courseId}/modules/${module.id}`}
                      className={`block p-3 hover:bg-[var(--ui-input-bg)] transition-colors ${
                        module.id === currentModule.id ? 'bg-[var(--brand-primary)]/10 border-r-2 border-[var(--brand-primary)]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            module.completed 
                              ? 'bg-green-600 text-white' 
                              : module.id === currentModule.id
                                ? 'bg-[var(--brand-primary)] text-white'
                                : 'bg-gray-200 text-[var(--text-secondary)]'
                          }`}>
                            {module.completed ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <p className={`text-sm font-medium truncate ${
                            module.id === currentModule.id 
                              ? 'text-[var(--brand-primary)]' 
                              : 'text-[var(--fg-primary)]'
                          }`}>
                            {module.title}
                          </p>
                        </div>
                        
                        {module.duration_minutes > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {module.duration_minutes}min
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}