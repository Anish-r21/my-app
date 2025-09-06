import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { userQueries } from '@/lib/database'
import type { ApiResponse, User, CreateStudentData } from '@/types/database'

export async function GET() {
  try {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const students = await userQueries.getStudents()
    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: students
    })

  } catch (error) {
    console.error('Get students API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch students'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const studentData: CreateStudentData = await request.json()
    
    if (!studentData.name || !studentData.email) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 })
    }

    const result = await auth.createUser({
      ...studentData,
      role: 'student'
    })

    if (result.error || !result.user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: result.error || 'Failed to create student'
      }, { status: 500 })
    }

    return NextResponse.json<ApiResponse<{ user: User, tempPassword?: string }>>({
      success: true,
      data: {
        user: result.user,
        tempPassword: result.tempPassword
      },
      message: 'Student created successfully'
    })

  } catch (error) {
    console.error('Create student API error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create student'
    }, { status: 500 })
  }
}