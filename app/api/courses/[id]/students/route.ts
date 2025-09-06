// app/api/courses/[id]/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStudentsInCourse } from '@/lib/database'
import type { ApiResponse } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const students = await getStudentsInCourse(id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: students
    })
  } catch (error) {
    console.error('Get course students API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch course students'
    }, { status: 500 })
  }
}