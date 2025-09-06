//app/api/courses/[id]/modules/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { moduleQueries } from '@/lib/database'
import type { ApiResponse, Module, CreateModuleData } from '@/types/database'

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

    const modules = await moduleQueries.getByCourse(id)

    return NextResponse.json<ApiResponse<Module[]>>({
      success: true,
      data: modules
    })
  } catch (error) {
    console.error('Get modules API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch modules'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Authenticate user
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const moduleData: CreateModuleData = await request.json()

    if (!moduleData.title || !moduleData.video_url) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Title and video URL are required'
      }, { status: 400 })
    }

    // Determine next order index
    const existingModules = await moduleQueries.getByCourse(id)
    const nextOrderIndex = existingModules.length

    // Create the module
    const createdModule = await moduleQueries.create({
      course_id: id,
      title: moduleData.title,
      description: moduleData.description || '',
      video_url: moduleData.video_url,
      order_index: nextOrderIndex,
      duration_minutes: moduleData.duration_minutes || 0
    })

    // Check creation success
    if (!createdModule) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Failed to create module'
      }, { status: 500 })
    }

    // Return success response
    return NextResponse.json<ApiResponse<Module>>({
      success: true,
      data: createdModule,
      message: 'Module created successfully'
    })
  } catch (error) {
    console.error('Create module API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create module'
    }, { status: 500 })
  }
}