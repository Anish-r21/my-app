//app/api/courses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { courseQueries, moduleQueries } from '@/lib/database'
import type { ApiResponse, Course } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const course = await courseQueries.getById(id)
    if (!course) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Course not found'
      }, { status: 404 })
    }

    // Get modules for this course
    const modules = await moduleQueries.getByCourse(id)

    return NextResponse.json<ApiResponse<Course & { modules: typeof modules }>>({
      success: true,
      data: { ...course, modules }
    })
  } catch (error) {
    console.error('Get course API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch course'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    const course = await courseQueries.update(id, updates)

    if (!course) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to update course'
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Course>>({
      success: true,
      data: course,
      message: 'Course updated successfully'
    })
  } catch (error) {
    console.error('Update course API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update course'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const success = await courseQueries.delete(id)

    if (!success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to delete course'
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    console.error('Delete course API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to delete course'
    }, { status: 500 })
  }
}