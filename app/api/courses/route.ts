import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { courseQueries } from '@/lib/database'
import type { ApiResponse, Course, CreateCourseData } from '@/types/database'

export async function GET() {
  try {
    const user = await auth.getCurrentUser()
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await courseQueries.getAll()
    return NextResponse.json<ApiResponse<Course[]>>({
      success: true,
      data: courses
    })

  } catch (error) {
    console.error('Get courses API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch courses'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const courseData: CreateCourseData = await request.json()
    
    if (!courseData.title || !courseData.description) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Title and description are required'
      }, { status: 400 })
    }

    const course = await courseQueries.create({
      ...courseData,
      created_by: user.id
    })

    if (!course) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to create course'
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<Course>>({
      success: true,
      data: course,
      message: 'Course created successfully'
    })

  } catch (error) {
    console.error('Create course API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create course'
    }, { status: 500 })
  }
}